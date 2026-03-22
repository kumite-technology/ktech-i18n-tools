#!/usr/bin/env node

import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { translateCatalog, type LocaleConfig } from './translateCatalog.js';

type CliArgs = {
    source?: string;
    outputDir?: string;
    localesConfig?: string;
    chunkSize?: number;
    promptVersion?: string;
    promptId?: string;
};

function parseArgs(argv: string[]): CliArgs {
    const parsed: CliArgs = {};

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = argv[i + 1];

        if (arg === '--source' && next) {
            parsed.source = next;
            i++;
            continue;
        }

        if (arg === '--output-dir' && next) {
            parsed.outputDir = next;
            i++;
            continue;
        }

        if (arg === '--locales-config' && next) {
            parsed.localesConfig = next;
            i++;
            continue;
        }

        if (arg === '--chunk-size' && next) {
            parsed.chunkSize = Number(next);
            i++;
            continue;
        }

        if (arg === '--prompt-version' && next) {
            parsed.promptVersion = next;
            i++;
            continue;
        }

        if (arg === '--prompt-id' && next) {
            parsed.promptId = next;
            i++;
            continue;
        }
    }

    return parsed;
}

function printUsage(): void {
    console.log(`
Usage:
  ktech-i18n-translate --source <path> --output-dir <path> --locales-config <path> [options]

Required:
  --source           Path to source locale json (e.g. locales/en.json)
  --output-dir       Directory where language files live (e.g. locales)
  --locales-config   JSON file with locale map

Optional:
  --chunk-size       Number of keys per request (default: 100)
  --prompt-version   Prompt version (default: 9)
  --prompt-id        Override OPENAI_TRANSLATION_PROMPT_ID

Environment:
  OPENAI_API_KEY
  OPENAI_TRANSLATION_PROMPT_ID (unless --prompt-id is passed)
`);
}

async function loadLocales(localesConfigPath: string): Promise<LocaleConfig> {
    const absolutePath = path.resolve(localesConfigPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(content) as LocaleConfig;
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));

    if (!args.source || !args.outputDir || !args.localesConfig) {
        printUsage();
        process.exit(1);
    }

    const locales = await loadLocales(args.localesConfig);

    await translateCatalog({
        sourceFilePath: args.source,
        outputDir: args.outputDir,
        locales,
        chunkSize: args.chunkSize,
        promptVersion: args.promptVersion,
        promptId: args.promptId,
    });
}

main().catch(error => {
    console.error('❌ Translation failed:', error);
    process.exit(1);
});
