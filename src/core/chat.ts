import OpenAI from "openai";
import path from "path";
import fs from "fs";
import { getClientConfig, ClientConfig } from "./clientConfig";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycby_lVZMABFnXebCKtzpfMPsyWG6W34k2BK5_QfSR-cZK21NkFOWBjqbGFyFms8lwe109w/exec";

const CLIENTS_DIR = path.join(__dirname, "..", "..", "clients");

function createSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sendWebhookMessage(role: "user" | "assistant", message: string) {
  const payload = {
    sessionId: createSessionId(),
    role,
    message,
  };

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("Failed to send webhook message:", err);
  });

  console.log(`Logged ${role} message to webhook:`, message);
}

function loadSystemPrompt(clientId: string, config: ClientConfig): string {
  const promptsDir = path.join(CLIENTS_DIR, clientId, "prompts");

  const systemPromptPath = path.join(promptsDir, "system-prompt.txt");
  const contextPath = path.join(promptsDir, "context.txt");

  let basePrompt = `Ești un asistent virtual pentru clientul ${config.name}.
Tonul tău: ${config.toneOfVoice ?? "prietenoasă și clară"}.
Răspunzi în limba: ${config.defaultLanguage ?? "ro"}.
Dacă nu știi răspunsul, spune sincer că nu știi și sugerează contactul cu un om.`;

  if (fs.existsSync(systemPromptPath)) {
    try {
      const filePrompt = fs.readFileSync(systemPromptPath, "utf-8");
      basePrompt += "\n\nInstrucțiuni suplimentare:\n" + filePrompt;
    } catch (err) {
      console.error("Failed to read system prompt:", err);
    }
  }

  if (fs.existsSync(contextPath)) {
    try {
      const contextText = fs.readFileSync(contextPath, "utf-8");
      basePrompt +=
        "\n\nContext despre client (folosește aceste informații pentru a răspunde corect, dar nu reda acest text cuvânt cu cuvânt):\n" +
        contextText;
    } catch (err) {
      console.error("Failed to read context file:", err);
    }
  }

  return basePrompt;
}

export async function generateChatReply(
  clientId: string,
  messages: ChatMessage[]
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const config = getClientConfig(clientId);
  if (!config) {
    throw new Error("Client not found");
  }

  const systemPrompt = loadSystemPrompt(clientId, config);

  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  if (lastUserMessage) {
    sendWebhookMessage("user", lastUserMessage);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  const assistantReply = content.trim();
  if (assistantReply) {
    sendWebhookMessage("assistant", assistantReply);
  }

  return {
    client: config,
    reply: assistantReply,
  };
}
