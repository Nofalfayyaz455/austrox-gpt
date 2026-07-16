
// ======================
// State
// ======================
let currentUser = localStorage.getItem("currentUser");
let messages = [];
let currentChatId = Date.now();
let currentMode = "quick";
let currentModel = "google/gemini-2.0-flash-001";

// ======================
// Backend URL
// ======================
const API_URL = "https://austrox-backendofficial.containers.snapdeploy.app/api/chat";

// ======================
// Initialize
// ======================
window.addEventListener("DOMContentLoaded", () => {
    loadChatHistoryList();
    renderMessages();
    setMode(currentMode);

    document.getElementById("menu-toggle").onclick = () => {
        document.getElementById("sidebar").classList.toggle("open");
    };

    document.getElementById("user-input").addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    if (localStorage.getItem("theme") === "light") {
        document.documentElement.classList.add("light");
    }
});

// ======================
// Navigation
// ======================
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

// ======================
// Settings
// ======================
function setMode(mode) {
    currentMode = mode;

    document.getElementById("quickBtn").classList.toggle("active-mode", mode === "quick");
    document.getElementById("deepBtn").classList.toggle("active-mode", mode === "deep");
}

function setModel(model) {
    currentModel = model;
}

// ======================
// Chat History
// ======================
function saveChatHistory() {
    let history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
    history[currentChatId] = messages;
    localStorage.setItem("chatHistory", JSON.stringify(history));
    loadChatHistoryList();
}

function loadChatHistoryList() {
    const list = document.getElementById("chat-history-list");
    list.innerHTML = "";

    let history = JSON.parse(localStorage.getItem("chatHistory") || "{}");

    Object.keys(history).reverse().forEach(id => {

        let li = document.createElement("li");
        li.className = "history-item";

        li.innerHTML = `
            <span>Chat ${new Date(Number(id)).toLocaleString()}</span>
            <button class="delete-history-btn">🗑️</button>
        `;

        li.onclick = () => {
            currentChatId = id;
            messages = history[id];
            renderMessages();
        };

        li.querySelector(".delete-history-btn").onclick = e => {
            e.stopPropagation();
            delete history[id];
            localStorage.setItem("chatHistory", JSON.stringify(history));
            loadChatHistoryList();
        };

        list.appendChild(li);
    });
}

// ======================
// Render Messages
// ======================
function renderMessages() {

    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";

    messages.forEach(msg => {

        const div = document.createElement("div");

        div.className = "msg " + (msg.role === "user" ? "user" : "ai");

        div.innerHTML =
            (msg.role === "user"
                ? "<strong>You:</strong> "
                : "<strong>AI:</strong> ")
            + msg.content.replace(/\n/g, "<br>");

        chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

// ======================
// Send Message
// ======================
async function sendMessage() {

    const input = document.getElementById("user-input");

    const text = input.value.trim();

    if (!text) return;

    if (messages.length === 0) {
        document.title = text.substring(0, 20) + "...";
    }

    messages.push({
        role: "user",
        content: text
    });

    renderMessages();
    saveChatHistory();

    input.value = "";

    const thinking = document.createElement("div");

    thinking.className = "msg ai";
    thinking.id = "thinking";
    thinking.innerHTML = "<strong>AI:</strong> 🤔 Thinking";

    document.getElementById("chat-box").appendChild(thinking);

    let dots = 0;

    const timer = setInterval(() => {
        dots = (dots + 1) % 4;
        thinking.innerHTML =
            "<strong>AI:</strong> 🤔 Thinking" + ".".repeat(dots);
    }, 500);

    try {

        console.log("Sending request to:", API_URL);

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: text,
                mode: currentMode,
                model: currentModel
            })

        });

        console.log("Status:", response.status);

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(errorText);
        }

        const data = await response.json();

        clearInterval(timer);
        thinking.remove();

        messages.push({
            role: "assistant",
            content: data.reply || "⚠️ No reply received."
        });

        renderMessages();
        saveChatHistory();

    }

    catch (error) {

        clearInterval(timer);
        thinking.remove();

        console.error("Backend Error:", error);

        messages.push({
            role: "assistant",
            content: "⚠️ Error: Unable to get response."
        });

        renderMessages();
    }
}

// ======================
// Voice Input
// ======================
function startVoiceInput() {

    const btn = document.getElementById("voice-btn");

    if (!("webkitSpeechRecognition" in window)) {

        alert("Voice recognition is not supported.");

        return;
    }

    btn.classList.add("mic-active");

    const recognition = new webkitSpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = e => {

        document.getElementById("user-input").value =
            e.results[0][0].transcript;

        btn.classList.remove("mic-active");

        recognition.stop();
    };

    recognition.onerror = recognition.onend = () => {

        btn.classList.remove("mic-active");
    };

    recognition.start();
}
