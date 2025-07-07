let messages = [];
let currentMode = "quick";
let currentModel = "meta-llama/llama-3-70b-instruct";
let currentChatId = Date.now();
const chatBox = document.getElementById("chat-box");

function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  messages.push({ role: "user", content: message });
  renderMessages();

  // Show [Thinking...]
  const thinkingMessage = document.createElement("div");
  thinkingMessage.className = "ai-message text-gray-500 italic my-2";
  thinkingMessage.id = "thinking";
  thinkingMessage.innerText = "[Thinking";
  let dotCount = 0;
  const thinkingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    thinkingMessage.innerText = "[Thinking" + ".".repeat(dotCount) + "]";
  }, 500);
  chatBox.appendChild(thinkingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;

  input.value = "";

  fetch("https://austrox-backend-production.up.railway.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      mode: currentMode,
      model: currentModel,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      clearInterval(thinkingInterval);
      thinkingMessage.remove();
      messages.push({ role: "assistant", content: data.reply });
      renderMessages();
      saveChatHistory();
    })
    .catch((err) => {
      console.error("❌ Fetch Error:", err);
      clearInterval(thinkingInterval);
      thinkingMessage.remove();
      messages.push({
        role: "assistant",
        content: "⚠️ Error: Unable to get response.",
      });
      renderMessages();
    });
}

function renderMessages() {
  chatBox.innerHTML = "";
  messages.forEach((msg) => {
    const msgDiv = document.createElement("div");
    msgDiv.className =
      msg.role === "user"
        ? "user-message bg-blue-600 text-white rounded p-2 my-2"
        : "ai-message bg-gray-200 text-black rounded p-2 my-2";
    msgDiv.innerText = msg.content;
    chatBox.appendChild(msgDiv);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function saveChatHistory() {
  let history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  history[currentChatId] = messages;
  localStorage.setItem("chatHistory", JSON.stringify(history));
  loadChatHistoryList();
}

function loadChatHistoryList() {
  const list = document.getElementById("chat-history-list");
  if (!list) return;
  list.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");

  Object.keys(history)
    .reverse()
    .forEach((id) => {
      const item = document.createElement("li");
      item.textContent = `Chat ${new Date(Number(id)).toLocaleString()}`;
      item.style.cursor = "pointer";
      item.style.padding = "4px 8px";
      item.onclick = () => loadChatSession(id);
      list.appendChild(item);
    });
}

function loadChatSession(chatId) {
  currentChatId = chatId;
  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  messages = history[chatId] || [];
  renderMessages();
}

function startNewChat() {
  currentChatId = Date.now();
  messages = [];
  renderMessages();
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

function setMode(mode) {
  currentMode = mode;
  const quickBtn = document.getElementById("quickBtn");
  const deeperBtn = document.getElementById("deeperBtn");

  quickBtn.classList.remove("active-mode");
  deeperBtn.classList.remove("active-mode");

  if (mode === "quick") quickBtn.classList.add("active-mode");
  else deeperBtn.classList.add("active-mode");
}

function setModel(model) {
  currentModel = model;
}

// Voice input
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
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

// Enter key to send
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("user-input");

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Theme + history restore
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
  }

  loadChatHistoryList();
});
