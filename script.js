// State
let currentUser = localStorage.getItem("currentUser");
let messages = [], currentChatId = Date.now();
let currentMode = "quick", currentModel = "google/gemini-2.0-flash-001";

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  loadChatHistoryList();
  renderMessages();
  setMode(currentMode);
  document.getElementById("menu-toggle").onclick = () => {
    document.getElementById("sidebar").classList.toggle("open");
  };
  document.getElementById("user-input").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) sendMessage();
  });
  if (localStorage.getItem("theme")==="light") document.documentElement.classList.add("light");
});

// Navigation
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}
function startNewChat() {
  currentChatId = Date.now();
  messages = [];
  renderMessages();
  saveChatHistory();
}

// Settings
function setMode(m) {
  currentMode = m;
  document.getElementById("quickBtn").classList.toggle("active-mode", m==="quick");
  document.getElementById("deepBtn").classList.toggle("active-mode", m==="deep");
}
function setModel(m) {
  currentModel = m;
}

// Chat history
function saveChatHistory() {
  let h = JSON.parse(localStorage.getItem("chatHistory")||"{}");
  h[currentChatId] = messages;
  localStorage.setItem("chatHistory", JSON.stringify(h));
  loadChatHistoryList();
}
function loadChatHistoryList() {
  const list = document.getElementById("chat-history-list");
  list.innerHTML = "";
  let h = JSON.parse(localStorage.getItem("chatHistory")||"{}");
  Object.keys(h).reverse().forEach(id => {
    let li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `<span>Chat ${new Date(Number(id)).toLocaleString()}</span>
      <button class="delete-history-btn">🗑️</button>`;
    li.onclick = () => {
      currentChatId = id;
      messages = h[id];
      renderMessages();
    };
    li.querySelector(".delete-history-btn").onclick = e => {
      e.stopPropagation();
      delete h[id];
      localStorage.setItem("chatHistory", JSON.stringify(h));
      loadChatHistoryList();
    };
    list.appendChild(li);
  });
}

// UI messaging
function renderMessages() {
  const cb = document.getElementById("chat-box");
  cb.innerHTML = "";
  messages.forEach(m => {
    let d = document.createElement("div");
    d.className = "msg " + (m.role === "user" ? "user" : "ai");

    // Replace line breaks with <br> to display multi-line correctly
    let content = m.content.replace(/\n/g, "<br>");

    // Optional prefix
    d.innerHTML = (m.role === "user" ? "<strong>You:</strong> " : "<strong>AI:</strong> ") + content;

    cb.appendChild(d);
  });
  cb.scrollTop = cb.scrollHeight;
}


// Chat send
function sendMessage() {
  let inp = document.getElementById("user-input");
  if (!inp.value.trim()) return;
  // Auto name first message
  if (!messages.length) document.title = inp.value.slice(0,20) + "...";
  // Add message
  messages.push({ role:"user", content:inp.value });
  renderMessages();
  saveChatHistory();
  let thinking = document.createElement("div");
  thinking.className="msg ai"; thinking.id="thinking"; thinking.innerText="[Thinking";
  document.getElementById("chat-box").appendChild(thinking);
  let dots=0;
  const ti = setInterval(() => {
    dots = (dots+1)%4;
    thinking.innerText = "[Thinking" + ".".repeat(dots) + "]";
  }, 500);
  fetch("https://austrox-backend-production.up.railway.app/api/chat", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      message: inp.value,
      mode: currentMode,
      model: currentModel
    })
  })
  .then(r=>r.json())
  .then(data => {
    clearInterval(ti);
    thinking.remove();
    messages.push({ role:"assistant", content:data.reply });
    renderMessages();
    saveChatHistory();
  })
  .catch(err => {
    clearInterval(ti);
    thinking.remove();
    messages.push({ role:"assistant", content:"⚠️ Error: Unable to get response." });
    renderMessages();
  });
  inp.value="";
}

// Voice input
function startVoiceInput() {
  let btn = document.getElementById("voice-btn");
  if (!('webkitSpeechRecognition' in window)) {
    alert("Voice not supported");
    return;
  }
  btn.classList.add("mic-active");
  let rec = new webkitSpeechRecognition();
  rec.lang = "en-US"; rec.interimResults=false; rec.continuous=false;
  rec.onresult = e => {
    document.getElementById("user-input").value = e.results[0][0].transcript;
    btn.classList.remove("mic-active");
    rec.stop();
  };
  rec.onerror = rec.onend = () => btn.classList.remove("mic-active");
  rec.start();
}
