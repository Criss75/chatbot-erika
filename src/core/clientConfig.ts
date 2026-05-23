import path from "path";
import fs from "fs";

export type ClientConfig = {
  id: string;
  name: string;
  brandColor?: string; // rămâne pentru compatibilitate
  defaultLanguage?: string;
  description?: string;
  toneOfVoice?: string;
  openingMessage?: string;
  allowedTopics?: string[];

  // 👇 nou: set de culori de brand
  brandColors?: {
    primary?: string;          // header, buton trimite
    secondary?: string;        // bubble user
    assistantBubble?: string;  // bubble asistent
    background?: string;       // fundal pagină
    surface?: string;          // card/chat container
  };
};

export type ClientSummary = {
  id: string;
  name: string;
  brandColor?: string;
  defaultLanguage?: string;
  description?: string;
};

const CLIENTS_DIR = path.join(__dirname, "..", "..", "clients");

export function getClientConfig(clientId: string): ClientConfig | null {
  const configPath = path.join(CLIENTS_DIR, clientId, "config.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw) as ClientConfig;
    return config;
  } catch (err) {
    console.error("Failed to read client config:", err);
    return null;
  }
}

export function listClients(): ClientSummary[] {
  if (!fs.existsSync(CLIENTS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true });

  const clients: ClientSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const clientId = entry.name;
    const configPath = path.join(CLIENTS_DIR, clientId, "config.json");

    if (!fs.existsSync(configPath)) continue;

    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      const cfg = JSON.parse(raw) as ClientConfig;

      clients.push({
        id: cfg.id || clientId,
        name: cfg.name || clientId,
        brandColor: cfg.brandColor,
        defaultLanguage: cfg.defaultLanguage,
        description: cfg.description,
      });
    } catch (err) {
      console.error("Failed to read client config for", clientId, err);
    }
  }

  return clients;
}
