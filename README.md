# Storyline XLIFF Translator

A web app for translating Articulate Storyline `.xlf` and `.xliff` files with Google Gemini.

This project is designed for Storyline exports that contain inline XLIFF markup such as `bpt`, `ept`, `ph`, and `g`. Instead of sending the whole XML structure to the model and hoping it survives, the app preserves the XLIFF structure and translates only the human-readable text nodes.

## What This App Does

- Uploads Storyline XLIFF files from your browser
- Lets you choose a target language
- Uses Google Gemini to translate only the text content
- Preserves inline Storyline/XLIFF markup and placeholders
- Generates a translated XLIFF file ready for download
- Runs in bring your own key mode, so each user provides their own Gemini API key

## Why It Exists

Storyline XLIFF files are not plain text. They often mix visible text with formatting and placeholder tags inside the same translation unit. A naive AI prompt over raw XML can easily:

- break the XLIFF structure
- move or remove placeholders
- damage whitespace or line breaks
- return invalid XML

This app takes a safer approach by rebuilding the `target` content from `source` and translating only the text nodes that should actually change.

## Bring Your Own Key

This app is built for static hosting platforms such as Netlify.

There is no backend required for translation. The user enters their own Gemini API key in the frontend, and the browser calls the Gemini API directly.

Notes:

- The key is stored locally in the browser using `localStorage`
- The key is not committed to the repository
- If the Gemini API fails, the app shows the real error instead of silently faking a successful translation

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- `@google/genai`

## Local Development

Requirements:

- Node.js 20+

Run locally:

```bash
npm install
npm run dev
```

Then open the local app, paste your Gemini API key, upload a Storyline `.xlf` or `.xliff` file, and start translating.

## Build

```bash
npm run build
```

## Supported Files

This app is intended for:

- Articulate Storyline `.xlf`
- Articulate Storyline `.xliff`

It is especially useful for files that include inline formatting or placeholder tags inside `<source>` nodes.

## Current Behavior

- Preserves XLIFF structure while translating text
- Creates or updates `<target>` nodes
- Sets the `target-language` attribute on XLIFF `file` nodes
- Stops on API errors instead of falling back silently to source text

## Contributing

Issues and pull requests are welcome.

Good contribution areas:

- better handling for additional XLIFF edge cases
- language quality improvements
- UI polish and accessibility
- Storyline-specific validation
- Netlify deployment docs

## License

No license has been added yet.
