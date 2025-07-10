let messages = [], currentMode = "quick", currentModel = "meta-llama/llama-3-70b-instruct";
let currentChatId = Date.now();

function sendMessage() {
  const input = document.getElementById("user-input");
  const msg = input.value.trim();
  if (!msg) return;
  messages.push({ role: "user", content: msg });
  renderMessages(); input.value = "";

  const thinking = document.createElement("div");
  thinking.className = "msg ai"; thinking.id = "thinking";
  thinking.innerText = "[Thinking";
  document.getElementById("chat-box").appendChild(thinking);

  let dots = 0;
  const ti = setInterval(() => {
    dots = (dots + 1) % 4;
    thinking.innerText = "[Thinking" + ".".repeat(dots) + "]";
  }, 500);

  fetch("https://austrox-backend-production.up.railway.app/api/chat", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ message: msg, mode: currentMode, model: currentModel })
  })
    .then(r => r.json())
    .then(data => {
      clearInterval(ti); thinking.remove();
      messages.push({ role: "assistant", content: data.reply });
      renderMessages(); saveChatHistory();
    })
    .catch(err => {
      clearInterval(ti); thinking.remove();
      console.error(err);
      messages.push({ role: "assistant", content: "⚠️ Error: Unable to get response." });
      renderMessages();
    });
}

function renderMessages() {
  const cb = document.getElementById("chat-box");
  cb.innerHTML = "";
  messages.forEach(m => {
    const d = document.createElement("div");
    d.className = "msg " + (m.role === "user" ? "user" : "ai");
    d.innerText = (m.role === "user" ? "You: " : "AI: ") + m.content;
    cb.appendChild(d);
  });
  cb.scrollTop = cb.scrollHeight;
}

function saveChatHistory() {
  const h = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  h[currentChatId] = messages;
  localStorage.setItem("chatHistory", JSON.stringify(h));
  loadChatHistoryList();
}

function loadChatHistoryList(){
  const list = document.getElementById("chat-history-list");
  list.innerHTML = "";
  const h = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  Object.keys(h).reverse().forEach(id => {
    const li = document.createElement("li"); li.className = "history-item";
    const span = document.createElement("span");
    span.textContent = `Chat ${new Date(Number(id)).toLocaleString()}`;
    span.onclick = () => loadChatSession(id);
    const bt = document.createElement("button"); bt.textContent = "🗑️";
    bt.className = "delete-history-btn";
    bt.onclick = (e) => {
      e.stopPropagation(); delete h[id]; localStorage.setItem("chatHistory", JSON.stringify(h)); loadChatHistoryList();
    };
    li.append(span, bt); list.appendChild(li);
  });
}

function loadChatSession(id) {
  currentChatId = id;
  messages = JSON.parse(localStorage.getItem("chatHistory"))[id] || [];
  renderMessages();
}

function startNewChat() {
  currentChatId = Date.now();
  messages = [];
  renderMessages();
  saveChatHistory();
}

function setMode(md){
  currentMode = md;
  document.getElementById("quickBtn").classList.toggle("active-mode", md==="quick");
  document.getElementById("deeperBtn").classList.toggle("active-mode", md==="deep");
}

function setModel(m){ currentModel = m; }

function toggleTheme(){
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

function startVoiceInput(){
  if (!('webkitSpeechRecognition' in window)) return alert("Not supported");
  const mic = document.querySelector(".send-btn[title='Voice input']");
  mic.classList.add("mic-active");
  const rec = new webkitSpeechRecognition();
  rec.lang="en-US"; rec.interimResults=false; rec.continuous=false;
  rec.start();
  rec.onresult = e => { document.getElementById("user-input").value = e.results[0][0].transcript; mic.classList.remove("mic-active"); }
  rec.onerror = () => mic.classList.remove("mic-active");
  rec.onend = () => mic.classList.remove("mic-active");
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme")==="light") document.body.classList.add("light");
  loadChatHistoryList();

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  document.getElementById("user-input").addEventListener("keydown", e => {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
});
// Redirect to login if not logged in
if (!localStorage.getItem("currentUser")) {
  window.location.href = "login.html";
}

