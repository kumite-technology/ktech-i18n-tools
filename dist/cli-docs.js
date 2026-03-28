#!/usr/bin/env node
import { translateDocs } from './translateDocs.js';
console.log('ktech-i18n-translate-docs CLI is running...');
// CLI entry for ktech-i18n-translate-docs
const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const localesArg = args.find(a => a.startsWith('--locales='));
const locales = localesArg ? localesArg.replace('--locales=', '').split(',') : [];
if (!files.length || !locales.length) {
    console.error('Usage: ktech-i18n-translate-docs <file1.mdx|glob> <file2.mdx|glob> --locales=fr,de');
    process.exit(1);
}
translateDocs({ files, locales }).catch(e => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=cli-docs.js.map