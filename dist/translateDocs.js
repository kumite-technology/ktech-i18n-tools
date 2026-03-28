import fg from 'fast-glob';
import fs from 'fs/promises';
import * as path from 'node:path';
import { OpenAI } from 'openai';
function ensureEnv(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`${name} environment variable is not set.`);
    return value;
}
async function readFileContent(filePath) {
    return await fs.readFile(filePath, 'utf-8');
}
async function writeFileContent(filePath, content) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
}
function getTargetPath(filePath, docsRoot, sourceLocale, targetLocale) {
    const rel = path.relative(path.join(docsRoot, sourceLocale), filePath);
    return path.join(docsRoot, targetLocale, rel);
}
export async function translateDocs(options) {
    const { files, locales, sourceLocale = 'en', docsRoot = 'content/docs', openaiApiKey, promptId, promptVersion, } = options;
    const apiKey = openaiApiKey || ensureEnv('OPENAI_API_KEY');
    const usedPromptId = promptId || ensureEnv('OPENAI_TRANSLATION_PROMPT_ID');
    const openai = new OpenAI({ apiKey });
    // Expand glob patterns to file paths
    const expandedFiles = await fg(files, { onlyFiles: true, unique: true });
    if (expandedFiles.length === 0) {
        console.warn('⚠️  No files matched the provided patterns.');
        return;
    }
    console.log(`📄 Found ${expandedFiles.length} file(s) to translate.`);
    for (const file of expandedFiles) {
        console.log('\n──────────────────────────────────────────────');
        const absFile = path.resolve(file);
        const content = await readFileContent(absFile);
        console.log(`📂 Processing: ${file}`);
        for (const locale of locales) {
            if (locale === sourceLocale)
                continue;
            const targetPath = getTargetPath(absFile, docsRoot, sourceLocale, locale);
            console.log(`🌍 Translating to ${locale} → ${targetPath}`);
            const prompt = `Translate the following MDX documentation from ${sourceLocale} to ${locale}. Preserve all code blocks, frontmatter, and formatting.\n\n---\n${content}\n---`;
            const openaiPrompt = {
                id: usedPromptId,
            };
            if (promptVersion) {
                openaiPrompt.version = promptVersion;
            }
            try {
                const response = await openai.responses.create({
                    prompt: openaiPrompt,
                    input: prompt,
                });
                let translated = response.output_text?.trim() || '';
                // Remove triple backticks if present
                if (translated.startsWith('```')) {
                    translated = translated.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
                }
                await writeFileContent(targetPath, translated);
                console.log(`✅ Saved: ${targetPath}`);
            }
            catch (err) {
                console.error(`❌ Error translating ${file} to ${locale}:`, err);
            }
        }
    }
    console.log('\n🎉 All translations complete!');
}
//# sourceMappingURL=translateDocs.js.map