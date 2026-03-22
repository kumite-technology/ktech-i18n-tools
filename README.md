# @ktech/i18n-tools

Isolated translation CLI package intended to be moved into its own private repository.

## What it does

- Reads source messages from a base locale file (usually `en.json`)
- Translates missing keys for configured locales using OpenAI Responses API
- Preserves existing translated keys
- Removes obsolete keys that no longer exist in source
- Stores output in `{ "key": { "defaultMessage": "..." } }` format

## Install

```bash
yarn
```

## Build

```bash
yarn build
```

## Usage (local dev)

```bash
yarn translate \
  --source ../packages/locales/locales/en.json \
  --output-dir ../packages/locales/locales \
  --locales-config ./locales.config.example.json
```

## Environment variables

- `OPENAI_API_KEY` (required)
- `OPENAI_TRANSLATION_PROMPT_ID` (required unless `--prompt-id` is passed)

## CLI arguments

- `--source` (required): source locale JSON path
- `--output-dir` (required): output locale directory
- `--locales-config` (required): JSON map of locales to names
- `--chunk-size` (optional): defaults to `100`
- `--prompt-version` (optional): defaults to `9`
- `--prompt-id` (optional): overrides env var

## Expected locales config shape

```json
{
  "lt": { "name": "Lithuanian" },
  "ru": "Russian"
}
```

## Move to a standalone private repository

1. Copy this whole folder into a new repository root.
2. Set `private: true` (or configure private package publishing).
3. Publish to your private registry (GitHub Packages / npm private).
4. In consumer repos, add a script that calls `ktech-i18n-translate`.
