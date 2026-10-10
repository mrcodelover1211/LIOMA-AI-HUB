# Lioma Agent Hub

A Windows x64 Electron desktop starter with six AI modes and Groq chat integration.

## Windows installer

The repository's GitHub Actions workflow builds a Windows x64 NSIS installer and uploads it as an artifact.

1. Open the **Actions** tab.
2. Select **Build Lioma Agent Hub for Windows x64**.
3. Click **Run workflow** on the `main` branch.
4. Wait for the run to finish successfully.
5. Open the completed run and download **Lioma-Agent-Hub-Windows-x64** from Artifacts.

A push to `main` or `master` also triggers the workflow. The artifact is retained for 14 days.

## Local development

Requires Node.js 22 or later.

```bash
npm install
npm run dev
```

## Build the Windows x64 installer

```bash
npm install
npm run dist
```

The installer is written to `release/`.

## Groq key security

On first launch, Lioma asks for a Groq API key. Electron's `safeStorage` encrypts it using operating-system-backed storage, and the UI clears and hides the input after saving. The key is not placed in Vite variables or sent to Supabase. If secure storage is unavailable, Lioma refuses to save the key as plaintext.

The current app calls Groq's OpenAI-compatible chat completions endpoint using `openai/gpt-oss-120b`. Confirm the model is available in Groq's current model catalog before release.

## Current limitations

Shopping and research modes do not have a live web-search integration yet. Browser Agent is a planning interface, not actual mouse/keyboard automation. Supabase is not connected yet. Never assume a purchase or external action has occurred.
