let currentMode = "quick",
    currentModel = "meta-llama/llama-3-70b-instruct",
    chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]"),
    currentChatName = "",
    isFirstMessage = true;

document.title = "AustroX-GPT";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light");
  if (!localStorage.getItem("currentUser")) window.location.href = "login.html";
  loadChatHistory();
  attachMenuToggle();
});

async function sendMessage() {
  const inp = document.getElementById("user-input");
  const msg = inp.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  inp.value = "";

  // Save chat name on first message
  if (isFirstMessage) {
    currentChatName = msg.slice(0, 20).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    addToHistory(currentChatName);
    isFirstMessage = false;
  }

  const ai = await getAIResponse(msg);
  addMessage("ai", ai);
}

function addMessage(role, text) {
  const cb = document.getElementById("chat-box");
  const message = document.createElement("div");
  message.className = "msg " + role;
  message.innerHTML = `<span class="${role}">${role === "user" ? "You" : "AustroX"}:</span> <div class="msg-text">${text}</div>`;
  cb.appendChild(message);
  cb.scrollTop = cb.scrollHeight;
}

async function getAIResponse(msg) {
  try {
    const res = await fetch("https://austrox-backend-production.up.railway.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, mode: currentMode, model: currentModel })
    });
    const data = await res.json();
    return data.reply || "⚠️ No reply from AI.";
  } catch (err) {
    return "❌ Error contacting AI.";
  }
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

function startNewChat() {
  currentChatName = "";
  isFirstMessage = true;
  document.getElementById("chat-box").innerHTML = "";
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById("quickBtn").classList.toggle("active-mode", mode === "quick");
  document.getElementById("deeperBtn").classList.toggle("active-mode", mode === "deep");
}

function setModel(model) {
  currentModel = model;
}

function loadChatHistory() {
  const ul = document.getElementById("chat-history-list");
  ul.innerHTML = "";
  chatHistory.forEach((name, index) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <span onclick="loadChat(${index})">${name}</span>
      <button class="delete-history-btn" onclick="deleteChat(${index})">🗑</button>
    `;
    ul.appendChild(li);
  });
}

function addToHistory(name) {
  chatHistory.unshift(name);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  loadChatHistory();
}

function deleteChat(index) {
  chatHistory.splice(index, 1);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  loadChatHistory();
}

function loadChat(index) {
  alert("Load chat: " + chatHistory[index]);
}

function attachMenuToggle() {
  const btn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (btn && sidebar) {
    btn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      console.log("Sidebar toggled:", sidebar.classList);
    });
  }
}

function startVoiceInput() {
  const mic = document.getElementById("mic-btn");
  mic.classList.add("mic-active");

  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported.");
    mic.classList.remove("mic-active");
    return;
  }

  const rec = new webkitSpeechRecognition();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.continuous = false;

  rec.onresult = e => {
    const transcript = e.results[0][0].transcript;
    document.getElementById("user-input").value = transcript;
    mic.classList.remove("mic-active");
    sendMessage();
  };

  rec.onerror = rec.onend = () => mic.classList.remove("mic-active");
  rec.start();
}
