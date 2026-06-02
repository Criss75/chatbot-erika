# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot-reload via ts-node-dev)
npm run dev

# Production build (TypeScript -> dist/)
npm run build

# Run production build
npm start
```

No test suite is configured. Manual testing is done via the browser UI at `http://localhost:3000` or via `POST /api/chat/:clientId`.

## Environment

Copy `.env.example` to `.env` and set:
```
OPENAI_API_KEY=your-api-key-here
```

## Architecture

This is a multi-tenant chatbot platform. A single Express server serves all clients; each client is configured entirely through files in `clients/<clientId>/`.

### Request flow

```
POST /api/chat/:clientId
  -> src/server.ts           (Express route, validates input)
  -> src/core/chat.ts        (generateChatReply)
      -> src/core/clientConfig.ts  (getClientConfig — reads clients/<id>/config.json)
      -> loadSystemPrompt          (reads clients/<id>/prompts/system-prompt.txt + context.txt)
      -> OpenAI gpt-4o-mini        (system prompt + full message history)
  <- { clientId, clientName, reply }
```

### Key files

| Path | Purpose |
|------|---------|
| `src/server.ts` | Express app entry point, all API routes |
| `src/core/chat.ts` | OpenAI integration, system prompt assembly |
| `src/core/clientConfig.ts` | `ClientConfig` type, file-based client loader |
| `clients/<id>/config.json` | Per-client branding, language, tone, topics |
| `clients/<id>/prompts/system-prompt.txt` | Behavioral rules injected into the system prompt |
| `clients/<id>/prompts/context.txt` | Business facts (services, hours, location) — model-facing, not user-facing |
| `public/chat.js` | Frontend chat logic (fetches `/api/clients`, sends message history) |
| `public/chat.html` + `public/style.css` | Generic chat UI |
| `public/erikajurescu-demo.html` | Standalone branded demo for the erikajurescu client |

### Adding a new client

1. Create `clients/<clientId>/config.json` — required fields: `id`, `name`. Optional: `brandColor`, `brandColors`, `defaultLanguage`, `toneOfVoice`, `openingMessage`, `allowedTopics`.
2. Create `clients/<clientId>/prompts/system-prompt.txt` — behavioral rules for the bot.
3. (Recommended) Create `clients/<clientId>/prompts/context.txt` — factual context for the model (not shown to users).

The server auto-discovers clients by scanning `clients/` for directories containing `config.json`. No code changes needed.

### System prompt assembly (chat.ts)

The final system prompt sent to OpenAI is built as:
1. Base prompt from `config.json` fields (`name`, `toneOfVoice`, `defaultLanguage`)
2. Appended content of `system-prompt.txt` (if exists)
3. Appended content of `context.txt` (if exists), with an instruction not to repeat it verbatim

### TypeScript config

- `rootDir: src`, `outDir: dist`, CommonJS modules, strict mode on.
- Only `src/` is compiled; `clients/`, `public/` are served at runtime as-is.
