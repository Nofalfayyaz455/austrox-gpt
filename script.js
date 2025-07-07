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

  // Show "thinking..."
  const thinking = document.createElement("div");
  thinking.className = 'ai-message text-gray-500 italic my-2';
  thinking.id = 'thinking';
  thinking.innerText = '[Thinking';
  let dotCount = 0;

  const thinkingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    thinking.innerText = '[Thinking' + '.'.repeat(dotCount) + ']';
  }, 500);

  const chatBox = document.getElementById("chat-box");
  chatBox.appendChild(thinking);
  chatBox.scrollTop = chatBox.scrollHeight;

  fetch('https://austrox-backend-production.up.railway.app/api/chat', {
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
      clearInterval(thinkingInterval);
      thinking.remove();
      messages.push({ role: "assistant", content: data.reply });
      renderMessages();
      saveChatHistory();
    })
    .catch(err => {
      clearInterval(thinkingInterval);
      thinking.remove();
      console.error("❌ Fetch Error:", err);
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
    div.innerHTML = `<span class="${msg.role === "user" ? "user" : "ai"}">${msg.role === "user" ? "You" : "AustroX"}:</span> ${msg.content}`;
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
    const li = document.createElement("li");

    // Chat title
    const title = document.createElement("span");
    title.textContent = `Chat ${new Date(Number(id)).toLocaleString()}`;
    title.onclick = () => loadChatSession(id);
    title.style.flex = "1";
    title.style.cursor = "pointer";

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.innerText = "🗑️";
    delBtn.title = "Delete this chat";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChatSession(id);
    };

    li.appendChild(title);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function deleteChatSession(id) {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  delete history[id];
  localStorage.setItem("chatHistory", JSON.stringify(history));
  loadChatHistoryList();
  if (id == currentChatId) {
    messages = [];
    renderMessages();
  }
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
  document.getElementById("quickBtn").classList.remove("active-mode");
  document.getElementById("deeperBtn").classList.remove("active-mode");
  document.getElementById(mode === "quick" ? "quickBtn" : "deeperBtn").classList.add("active-mode");
}

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

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
  }

  loadChatHistoryList();
});
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("user-input");
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
  }

  loadChatHistoryList();

  // Mobile menu toggle
  document.getElementById("menu-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("sidebar-open");
  });
});

