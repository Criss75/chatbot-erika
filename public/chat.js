let currentClientId = null;
let currentClientName = "";
let messages = [];

const clientSelect = document.getElementById("client-select");
const chatTitle = document.getElementById("chat-title");
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const urlParams = new URLSearchParams(window.location.search);
const forcedClientId = urlParams.get("clientId");

// Avatar image path (saved in public folder)
const AGENT_IMG_SRC = "/erika-avatar.png";

function makeRobotAvatar() {
  const div = document.createElement("div");
  div.className = "msg-avatar";
  const img = document.createElement("img");
  img.src = AGENT_IMG_SRC;
  img.style.cssText = "width:20px;height:20px;border-radius:4px;object-fit:cover;display:block;";
  div.appendChild(img);
  return div;
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function applyClientTheme(config) {
  const root = document.documentElement;
  const colors = config.brandColors || {};
  const primary = colors.primary || config.brandColor || "#6366f1";
  const secondary = colors.secondary || primary;
  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-secondary", secondary);
  if (colors.assistantBubble) root.style.setProperty("--brand-assistant-bubble", colors.assistantBubble);
}

function addMessage(role, content, addToHistory = true) {
  if (addToHistory) messages.push({ role, content });

  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  if (role === "assistant") {
    row.appendChild(makeRobotAvatar());
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = content;
  row.appendChild(bubble);

  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "typing-row";
  row.id = "typing-indicator";

  row.appendChild(makeRobotAvatar());

  const bubble = document.createElement("div");
  bubble.className = "typing-bubble";
  bubble.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  row.appendChild(bubble);

  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

async function selectClient(clientId, clientName) {
  currentClientId = clientId;
  currentClientName = clientName;
  chatTitle.textContent = clientName;

  const headerAvatar = document.getElementById("client-avatar");
  if (headerAvatar) {
    headerAvatar.innerHTML = "";
    const img = document.createElement("img");
    img.src = AGENT_IMG_SRC;
    img.style.cssText = "width:30px;height:30px;border-radius:8px;object-fit:cover;display:block;";
    headerAvatar.appendChild(img);
  }

  messages = [];
  chatWindow.innerHTML = `<div class="chat-date-divider"><span>Astazi</span></div>`;

  try {
    const cfgRes = await fetch(`/api/clients/${clientId}`);
    const cfg = await cfgRes.json();
    applyClientTheme(cfg);
    if (cfg.openingMessage) {
      addMessage("assistant", cfg.openingMessage, true);
    }
  } catch (err) {
    console.error("Failed to load client config", err);
  }
}

async function loadClients() {
  try {
    const res = await fetch("/api/clients");
    const clients = await res.json();

    clientSelect.innerHTML = "";
    clients.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      clientSelect.appendChild(opt);
    });

    const targetClient = forcedClientId
      ? clients.find((c) => c.id === forcedClientId) || clients[0]
      : clients[0];

    if (!targetClient) return;

    if (clients.length <= 1 || forcedClientId) {
      clientSelect.style.display = "none";
    } else {
      clientSelect.style.display = "block";
      clientSelect.value = targetClient.id;
    }

    await selectClient(targetClient.id, targetClient.name);

  } catch (err) {
    console.error("Failed to load clients", err);
  }
}

clientSelect.addEventListener("change", async () => {
  const id = clientSelect.value;
  const name = clientSelect.options[clientSelect.selectedIndex]?.textContent || "Chatbot";
  await selectClient(id, name);
});

async function sendMessage(text) {
  if (!currentClientId || !text?.trim()) return;

  const trimmed = text.trim();
  addMessage("user", trimmed, true);
  chatInput.value = "";
  chatInput.focus();

  chatInput.disabled = true;
  const button = chatForm.querySelector("button");
  button.disabled = true;

  showTyping();

  try {
    const res = await fetch(`/api/chat/${currentClientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    hideTyping();

    if (!res.ok) {
      addMessage("assistant", "A aparut o eroare. Va rog sa incercati din nou.", false);
      return;
    }

    const data = await res.json();
    addMessage("assistant", data.reply || "", true);
    playNotificationSound();
  } catch (err) {
    hideTyping();
    addMessage("assistant", "Nu am putut contacta serverul. Verificati conexiunea.", false);
  } finally {
    chatInput.disabled = false;
    button.disabled = false;
    chatInput.focus();
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value;
  if (!text.trim()) return;
  sendMessage(text);
});

loadClients();
