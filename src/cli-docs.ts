#!/usr/bin/env node

import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { translateDocs } from './translateDocs.js';

type CliArgs = {
    files: string[];
    localesConfig?: string;
};

function parseArgs(argv: string[]): CliArgs {
    const args: CliArgs = { files: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = argv[i + 1];
        if (arg === '--locales-config' && next) {
            args.localesConfig = next;
            i++;
            continue;
        }
        // Accept all non-option args as files
        if (!arg.startsWith('--')) {
            args.files.push(arg);
            continue;
        }
    }
    return args;
}

function printUsage(): void {
    console.log(
        `\nUsage:\n  ktech-i18n-translate-docs <file1.mdx|glob> <file2.mdx|glob> --locales-config <path>\n\nRequired:\n  <file.mdx|glob>         MDX file(s) or glob(s) to translate\n  --locales-config        JSON file with locale array (e.g. [\"fr\",\"de\"])\n\nEnvironment:\n  OPENAI_API_KEY\n  OPENAI_TRANSLATION_PROMPT_ID\n`
    );
}

async function loadLocales(localesConfigPath: string): Promise<string[]> {
    const absolutePath = path.resolve(localesConfigPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(content);
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));
    if (!args.files.length || !args.localesConfig) {
        printUsage();
        process.exit(1);
    }
    const locales = await loadLocales(args.localesConfig);
    if (!Array.isArray(locales) || locales.length === 0) {
        console.error('Locales config must be a non-empty array of locale codes.');
        process.exit(1);
    }
    await translateDocs({ files: args.files, locales });
}

main().catch(error => {
    console.error('❌ Translation failed:', error);
    process.exit(1);
});
