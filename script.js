let messages = [];
let currentMode = "quick";
let currentModel = "meta-llama/llama-3-70b-instruct";
let currentChatId = Date.now();

// Send message to server
function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  messages.push({ role: "user", content: message });
  renderMessages();
  input.value = "";

  fetch('austrox-backend-production.up.railway.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      mode: currentMode,
      model: currentModel
    })
  })
    .then(res => res.json())
    .then(data => {
      messages.push({ role: "assistant", content: data.reply });
      renderMessages();
      saveChatHistory();
    })
    .catch(err => {
      messages.push({ role: "assistant", content: "⚠️ Error: Unable to get response." });
      renderMessages();
    });
}

// Render messages in chat area
function renderMessages() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";

  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<span class="${msg.role}">${msg.role === "user" ? "You" : "AustroX"}:</span> ${msg.content}`;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Save chat history to localStorage
function saveChatHistory() {
  let history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  history[currentChatId] = messages;
  localStorage.setItem("chatHistory", JSON.stringify(history));
  loadChatHistoryList();
}

// Load chat history list into sidebar
function loadChatHistoryList() {
  const list = document.getElementById("chat-history-list");
  if (!list) return;
  list.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");

  Object.keys(history).reverse().forEach(id => {
    const item = document.createElement("li");
    item.textContent = `Chat ${new Date(Number(id)).toLocaleString()}`;
    item.style.cursor = "pointer";
    item.style.padding = "4px 8px";
    item.onclick = () => loadChatSession(id);
    list.appendChild(item);
  });
}

// Load a previous chat session
function loadChatSession(chatId) {
  currentChatId = chatId;
  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  messages = history[chatId] || [];
  renderMessages();
}

// Start new chat session
function startNewChat() {
  currentChatId = Date.now();
  messages = [];
  renderMessages();
}

// Toggle between light/dark theme
function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

// Select mode (quick/deep)
function setMode(mode) {
  currentMode = mode;
  document.getElementById("mode-quick").classList.remove("active-mode");
  document.getElementById("mode-deep").classList.remove("active-mode");
  document.getElementById(`mode-${mode}`).classList.add("active-mode");
}

// Select model (N1, N2, Advanced N3)
function setModel(model) {
  currentModel = model;
}

// Voice input support
function startVoiceInput() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Voice input not supported.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.start();

  recognition.onresult = function (event) {
    const input = document.getElementById("user-input");
    input.value = event.results[0][0].transcript;
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error", event.error);
  };
}

// Handle enter key
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("user-input");
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Load theme and chat history
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
  }

  loadChatHistoryList()
});
