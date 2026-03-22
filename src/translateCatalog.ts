import { OpenAI } from 'openai';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type SourceMessage = {
    defaultMessage: string;
    description?: string;
};

export type TranslatedMessage = {
    defaultMessage: string;
};

export type LocaleConfig = Record<string, { name: string } | string>;

export type TranslateCatalogOptions = {
    sourceFilePath: string;
    outputDir: string;
    locales: LocaleConfig;
    chunkSize?: number;
    promptId?: string;
    promptVersion?: string;
};

function normalizeEntry(value: TranslatedMessage | string): TranslatedMessage {
    if (typeof value === 'string') {
        return { defaultMessage: value };
    }

    return value;
}

async function readJson<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(value, null, 4)}\n`, 'utf-8');
}

function ensureEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable is not set.`);
    }
    return value;
}

function parseResponse(outputText: string): Record<string, string> {
    const cleaned = outputText
        .replace(/```json\s*([\s\S]*?)```/g, '$1')
        .replace(/```([\s\S]*?)```/g, '$1')
        .trim();

    const parsed = JSON.parse(cleaned) as Record<string, string>;
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
        normalized[key.trim()] = value;
    }

    return normalized;
}

function splitIntoChunks(
    entries: Record<string, SourceMessage>,
    chunkSize: number
): Record<string, SourceMessage>[] {
    const pairs = Object.entries(entries);
    const chunks: Record<string, SourceMessage>[] = [];

    for (let i = 0; i < pairs.length; i += chunkSize) {
        const chunk = Object.fromEntries(pairs.slice(i, i + chunkSize));
        chunks.push(chunk);
    }

    return chunks;
}

export async function translateCatalog(options: TranslateCatalogOptions): Promise<void> {
    const {
        sourceFilePath,
        outputDir,
        locales,
        chunkSize = 100,
        promptId = process.env.OPENAI_TRANSLATION_PROMPT_ID,
        promptVersion = '9',
    } = options;

    const apiKey = ensureEnv('OPENAI_API_KEY');
    if (!promptId) {
        throw new Error('OPENAI_TRANSLATION_PROMPT_ID environment variable is not set.');
    }

    const openai = new OpenAI({ apiKey });
    const sourceAbsolutePath = path.resolve(sourceFilePath);
    const outputAbsoluteDir = path.resolve(outputDir);

    const sourceTranslations = await readJson<Record<string, SourceMessage>>(sourceAbsolutePath);

    for (const [languageCode, localeDef] of Object.entries(locales)) {
        const languageName = typeof localeDef === 'string' ? localeDef : localeDef.name;
        const outputFilePath = path.join(outputAbsoluteDir, `${languageCode}.json`);

        let rawOutputTranslations: Record<string, TranslatedMessage | string> = {};
        try {
            rawOutputTranslations =
                await readJson<Record<string, TranslatedMessage | string>>(outputFilePath);
        } catch {
            rawOutputTranslations = {};
        }

        const outputTranslations: Record<string, TranslatedMessage> = Object.fromEntries(
            Object.entries(rawOutputTranslations).map(([key, value]) => [
                key,
                normalizeEntry(value),
            ])
        );

        const removedKeys = Object.keys(outputTranslations).filter(key => !sourceTranslations[key]);
        for (const key of removedKeys) {
            delete outputTranslations[key];
        }

        const needToTranslate = Object.entries(sourceTranslations).reduce(
            (acc, [key, value]) => {
                if (!outputTranslations[key]) {
                    acc[key] = value;
                }
                return acc;
            },
            {} as Record<string, SourceMessage>
        );

        const translationChunks = splitIntoChunks(needToTranslate, chunkSize);

        if (translationChunks.length === 0) {
            console.log(`✅ No translations needed for ${languageName} (${languageCode}).`);
            if (removedKeys.length > 0) {
                await writeJson(outputFilePath, outputTranslations);
                console.log(
                    `🧹 Removed ${removedKeys.length} obsolete keys in ${languageCode}.json`
                );
            }
            continue;
        }

        console.log(`⌛️ Translating to ${languageName} (${languageCode})...`);

        for (let index = 0; index < translationChunks.length; index++) {
            const chunk = translationChunks[index]!;
            console.log(`  📚 Translating chunk ${index + 1}/${translationChunks.length}`);

            const openaiResponse = await openai.responses.create({
                prompt: {
                    id: promptId,
                    version: promptVersion,
                },
                input: `translate to ${languageName}:\n${JSON.stringify(chunk)}`,
            });

            let translatedChunk: Record<string, string>;
            try {
                translatedChunk = parseResponse(openaiResponse.output_text);
            } catch (error) {
                console.error(
                    '💥 Failed to parse translation response, falling back to source values.',
                    error
                );
                translatedChunk = Object.fromEntries(
                    Object.entries(chunk).map(([key, value]) => [key, value.defaultMessage])
                );
            }

            for (const [key, translatedText] of Object.entries(translatedChunk)) {
                outputTranslations[key] = { defaultMessage: translatedText };
            }
        }

        await writeJson(outputFilePath, outputTranslations);
        console.log(`💾 Saved ${languageCode}.json to ${outputFilePath}`);
    }
}
