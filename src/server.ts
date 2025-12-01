import "dotenv/config";
import express from "express";
import path from "path";
import { getClientConfig, listClients } from "./core/clientConfig";
import { generateChatReply, ChatMessage } from "./core/chat";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (_req, res) => {
  res.send("Chatbot Agency Template API is running 🚀");
});

app.get("/api/clients", (_req, res) => {
  const clients = listClients();
  return res.json(clients);
});

app.get("/api/clients/:clientId", (req, res) => {
  const clientId = req.params.clientId;
  const config = getClientConfig(clientId);

  if (!config) {
    return res.status(404).json({ error: "Client not found" });
  }

  return res.json(config);
});

// endpoint de chat pentru un client – acum primește întregul istoric
app.post("/api/chat/:clientId", async (req, res) => {
  const clientId = req.params.clientId;

  // Acceptăm fie `messages`, fie fallback pe `message` ca înainte
  const { messages, message } = req.body as {
    messages?: ChatMessage[];
    message?: string;
  };

  if ((!messages || messages.length === 0) && (!message || !message.trim())) {
    return res
      .status(400)
      .json({ error: "Field 'messages' (or 'message') is required" });
  }

  // Dacă avem doar `message` (vechiul format), îl transformăm într-un singur mesaj user
  const chatMessages: ChatMessage[] =
    messages && messages.length > 0
      ? messages
      : [{ role: "user", content: message!.trim() }];

  try {
    const result = await generateChatReply(clientId, chatMessages);

    return res.json({
      clientId: result.client.id,
      clientName: result.client.name,
      reply: result.reply,
    });
  } catch (err: any) {
    console.error(err);

    if (err.message === "Client not found") {
      return res.status(404).json({ error: "Client not found" });
    }

    if (err.message === "Missing OPENAI_API_KEY") {
      return res.status(500).json({
        error:
          "OPENAI_API_KEY is not set. Please configure it in your .env file.",
      });
    }

    return res
      .status(500)
      .json({ error: "Unexpected error while generating reply" });
  }
});

export default app;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
