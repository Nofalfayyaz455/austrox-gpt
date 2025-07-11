const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatDisplay = document.getElementById('chatDisplay');
const themeToggle = document.getElementById('themeToggle');
const newChat = document.getElementById('newChat');
const newChatMobile = document.getElementById('newChatMobile');
const chatList = document.getElementById('chatHistoryList');
const chatListMobile = document.getElementById('chatHistoryListMobile');
const menuToggle = document.getElementById('menuToggle');
const mobileSidebar = document.getElementById('mobileSidebar');

let messages = [];

sendBtn.onclick = () => sendMessage();
userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;
  displayMessage(msg, 'user');
  userInput.value = '';

  try {
    const reply = await fetchAIResponse(msg);
    displayMessage(reply, 'ai');
    messages.push({ role: 'user', content: msg });
    messages.push({ role: 'ai', content: reply });
  } catch (error) {
    displayMessage("⚠️ Error connecting to server.", 'ai');
    console.error(error);
  }
}

function displayMessage(text, role) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  chatDisplay.appendChild(div);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// 🔗 Replace with your actual backend URL
const API_BASE_URL = "https://austrox-backend.up.railway.app/api"; // or http://localhost:3001/api

async function fetchAIResponse(message) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  return data.reply || "⚠️ No reply received.";
}

themeToggle.onclick = () => {
  document.body.classList.toggle('dark');
};

newChat.onclick = () => location.reload();
newChatMobile.onclick = () => location.reload();

menuToggle.onclick = () => {
  mobileSidebar.classList.toggle('hidden');
};
