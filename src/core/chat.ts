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

const CLIENTS_DIR = path.join(__dirname, "..", "..", "clients");

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";

  return {
    client: config,
    reply: content.trim(),
  };
}
