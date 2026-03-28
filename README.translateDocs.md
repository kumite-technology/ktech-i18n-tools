# translateDocs.ts — Documentation Translation Script

This script translates MDX documentation files from a source locale (default: `en`) to one or more target locales using the OpenAI API. It preserves the directory structure and outputs translated files under the appropriate locale folder.

## Usage

### Programmatic

```ts
import { translateDocs } from './src/translateDocs';

await translateDocs({
  files: [
    'content/docs/en/guide/intro.mdx',
    'content/docs/en/tutorials/setup.mdx',
  ],
  locales: ['fr', 'de'],
});
```

### CLI

```sh
node src/translateDocs.js content/docs/en/guide/intro.mdx content/docs/en/tutorials/setup.mdx --locales=fr,de
```

## Options

- `files`: Array of MDX file paths to translate (absolute or relative).
- `locales`: Array of target locale codes (e.g., `['fr', 'de']`).
- `sourceLocale`: Source language code (default: `en`).
- `docsRoot`: Root docs directory (default: `content/docs`).
- `openaiApiKey`: OpenAI API key (default: `process.env.OPENAI_API_KEY`).
- `promptId`: OpenAI prompt ID (default: `process.env.OPENAI_TRANSLATION_PROMPT_ID`).
- `promptVersion`: OpenAI prompt version (default: `1`).

## Environment Variables

- `OPENAI_API_KEY` — Your OpenAI API key.
- `OPENAI_TRANSLATION_PROMPT_ID` — The prompt ID for translation.

## Output

Translated files are saved in the same relative path under the target locale, e.g.:

- `content/docs/en/guide/intro.mdx` → `content/docs/fr/guide/intro.mdx`

---

**Note:**
- The script preserves code blocks, frontmatter, and formatting.
- Designed for integration with GitHub Actions or local CLI usage.
