let messages = [];
let currentMode = "quick";
let currentModel = "meta-llama/llama-3-70b-instruct";
let currentChatId = Date.now();

// Send user message
function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  messages.push({ role: "user", content: message });
  renderMessages();

  input.value = "";

  const thinkingDiv = document.createElement("div");
  thinkingDiv.className = "msg ai";
  thinkingDiv.id = "thinking";
  thinkingDiv.innerText = "[Thinking";
  document.getElementById("chat-box").appendChild(thinkingDiv);

  let dotCount = 0;
  const interval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    thinkingDiv.innerText = "[Thinking" + ".".repeat(dotCount) + "]";
  }, 500);

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
      clearInterval(interval);
      thinkingDiv.remove();
      messages.push({ role: "assistant", content: data.reply });
      renderMessages();
      saveChatHistory();
    })
    .catch((err) => {
      clearInterval(interval);
      thinkingDiv.remove();
      console.error("❌ Fetch Error:", err);
      messages.push({
        role: "assistant",
        content: "⚠️ Error: Unable to get response.",
      });
      renderMessages();
    });
}

// Render messages
function renderMessages() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";

  messages.forEach((msg) => {
    const div = document.createElement("div");
    div.className = "msg " + (msg.role === "user" ? "user" : "ai");
    div.innerText = (msg.role === "user" ? "You: " : "AustroX-GPT🔥: ") + msg.content;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Save chat to localStorage
function saveChatHistory() {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  history[currentChatId] = messages;
  localStorage.setItem("chatHistory", JSON.stringify(history));
  loadChatHistoryList();
}

// Load chat history sidebar list
function loadChatHistoryList() {
  const list = document.getElementById("chat-history-list");
  if (!list) return;
  list.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");

  Object.keys(history).reverse().forEach(id => {
    const item = document.createElement("li");
    item.classList.add("history-item");

    const preview = history[id].find((m) => m.role === "user")?.content;
    const titleText = preview
      ? preview.split(" ").slice(0, 4).join(" ") + "..."
      : `Chat ${new Date(Number(id)).toLocaleString()}`;

    const title = document.createElement("span");
    title.textContent = titleText;
    title.classList.add("chat-title");
    title.onclick = () => loadChatSession(id);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.className = "delete-history-btn";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChatHistory(id);
    };

    item.appendChild(title);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });
}

// Delete a single chat session
function deleteChatHistory(chatId) {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  delete history[chatId];
  localStorage.setItem("chatHistory", JSON.stringify(history));
  loadChatHistoryList();
}

// Load specific chat session
function loadChatSession(chatId) {
  currentChatId = chatId;
  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  messages = history[chatId] || [];
  renderMessages();
}

// Start a new empty chat
function startNewChat() {
  currentChatId = Date.now();
  messages = [];
  renderMessages();
  saveChatHistory();
}

// Set dark/light theme
function toggleTheme() {
  document.body.classList.toggle("light");
  const theme = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem("theme", theme);
}

// Set chat mode
function setMode(mode) {
  currentMode = mode;
  document.getElementById("quickBtn").classList.remove("active-mode");
  document.getElementById("deeperBtn").classList.remove("active-mode");
  document.getElementById(mode === "quick" ? "quickBtn" : "deeperBtn").classList.add("active-mode");
}

// Set model (meta-llama, gpt, etc.)
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

  const micBtn = document.querySelector(".send-btn[title='Voice input']");
  micBtn.classList.add("mic-active");

  recognition.start();

  recognition.onresult = function (event) {
    const input = document.getElementById("user-input");
    input.value = event.results[0][0].transcript;
    micBtn.classList.remove("mic-active");
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error", event.error);
    micBtn.classList.remove("mic-active");
  };

  recognition.onend = function () {
    micBtn.classList.remove("mic-active");
  };
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
  // Send on Enter
  const input = document.getElementById("user-input");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Set theme
  const theme = localStorage.getItem("theme");
  if (theme === "light") document.body.classList.add("light");

  // Load chat history
  loadChatHistoryList();

  // Sidebar toggle
  const toggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
});
