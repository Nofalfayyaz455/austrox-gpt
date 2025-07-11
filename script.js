let messages = [];
let currentMode = "quick";
let currentModel = "google/gemini-2.0-flash-001";
let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
let currentChatName = "";
let isFirstMessage = true;

// Don't change tab title
document.title = "AustroX-GPT";

document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme");
  if (theme === "light") document.body.classList.add("light");

  const user = localStorage.getItem("currentUser");
  if (!user) window.location.href = "login.html";

  loadChatHistory();
  attachMenuToggle();
});

// Send message
async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  addMessage("user", message);
  input.value = "";

  if (isFirstMessage) {
    currentChatName = message.slice(0, 20);
    addToHistory(currentChatName);
    isFirstMessage = false;
  }

  const aiMessage = await getAIResponse(message);
  addMessage("ai", aiMessage);
}

// Add message to chat
function addMessage(sender, text) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = "msg " + sender;
  msg.innerHTML = `<span class="${sender}">${sender === "user" ? "You" : "AustroX"}:</span> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Get AI response (simulate for frontend only)
async function getAIResponse(userMessage) {
  return new Promise((res) =>
    setTimeout(() => res("This is a simulated response to: " + userMessage), 1000)
  );
}

// Toggle theme
function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

// New chat
function startNewChat() {
  messages = [];
  document.getElementById("chat-box").innerHTML = "";
  isFirstMessage = true;
}

// Set mode
function setMode(mode) {
  currentMode = mode;
  document.getElementById("quickBtn").classList.remove("active-mode");
  document.getElementById("deeperBtn").classList.remove("active-mode");
  document.getElementById(mode === "quick" ? "quickBtn" : "deeperBtn").classList.add("active-mode");
}

// Set model
function setModel(model) {
  currentModel = model;
}

// Load chat history
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
  alert("🧠 This is a placeholder to load chat: " + chatHistory[index]);
}

// Menu toggle on mobile
function attachMenuToggle() {
  const menuBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
}

// Voice input
function startVoiceInput() {
  const micBtn = event.target;
  micBtn.classList.add("mic-active");

  setTimeout(() => {
    micBtn.classList.remove("mic-active");
    sendMessageFromVoice("This is a simulated voice message.");
  }, 2000);
}

function sendMessageFromVoice(message) {
  const input = document.getElementById("user-input");
  input.value = message;
  sendMessage();
}
