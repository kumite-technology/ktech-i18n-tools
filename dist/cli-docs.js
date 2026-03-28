#!/usr/bin/env node
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { translateDocs } from './translateDocs.js';
function parseArgs(argv) {
    const args = { files: [] };
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
    return {
        files: args.files.filter(Boolean),
        localesConfig: args.localesConfig,
    };
}
function printUsage() {
    console.log(`\nUsage:\n  ktech-i18n-translate-docs <file1.mdx|glob> <file2.mdx|glob> --locales-config <path>\n\nRequired:\n  <file.mdx|glob>         MDX file(s) or glob(s) to translate\n  --locales-config        JSON file with locale array (e.g. [\"fr\",\"de\"])\n\nEnvironment:\n  OPENAI_API_KEY\n  OPENAI_TRANSLATION_PROMPT_ID\n`);
}
async function loadLocales(localesConfigPath) {
    const absolutePath = path.resolve(localesConfigPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(content);
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (!args.files.length) {
        console.log('No files specified. Nothing to translate.');
        process.exit(0);
    }
    if (!args.localesConfig) {
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
//# sourceMappingURL=cli-docs.js.map