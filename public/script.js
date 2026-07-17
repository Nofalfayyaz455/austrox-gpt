// ======================
// State
// ======================
let currentUser = localStorage.getItem("currentUser");
let messages = [];
let currentChatId = Date.now();
let currentMode = "quick";
let currentModel = "auto";

// Custom Configuration Preferences
let customUsername = currentUser || "User";
let customMemory = "";
let saveHistoryOnServer = true;

// ======================
// Backend URL
// ======================
const API_URL = "https://austrox-backendofficial.containers.snapdeploy.app/api/chat";

// ======================
// Initialize
// ======================
window.addEventListener("DOMContentLoaded", () => {
    loadUserSettings();
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
// Load & Save User Settings
// ======================
function loadUserSettings() {
    let users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[currentUser] && typeof users[currentUser] === "object") {
        const profile = users[currentUser];
        customUsername = profile.displayUsername || currentUser;
        customMemory = profile.memory || "";
        saveHistoryOnServer = profile.historyAllowed !== undefined ? profile.historyAllowed : true;
        
        // Update DOM Settings Input Values
        document.getElementById("settings-username").value = customUsername;
        document.getElementById("settings-memory").value = customMemory;
        document.getElementById("perm-history").checked = saveHistoryOnServer;
        document.getElementById("perm-mic").checked = profile.micAllowed !== undefined ? profile.micAllowed : true;
    }
}

function saveSettings() {
    let users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[currentUser]) {
        if (typeof users[currentUser] !== "object") {
            // Convert old text formats to objects
            users[currentUser] = { password: users[currentUser] };
        }
        
        users[currentUser].displayUsername = document.getElementById("settings-username").value.trim() || currentUser;
        users[currentUser].memory = document.getElementById("settings-memory").value.trim();
        users[currentUser].historyAllowed = document.getElementById("perm-history").checked;
        users[currentUser].micAllowed = document.getElementById("perm-mic").checked;
        
        localStorage.setItem("users", JSON.stringify(users));
        
        // Sync working application cache values
        customUsername = users[currentUser].displayUsername;
        customMemory = users[currentUser].memory;
        saveHistoryOnServer = users[currentUser].historyAllowed;
        
        alert("Settings saved. Context updated.");
        closeSettings();
        renderMessages();
    }
}

// ======================
// Settings Modal Controls
// ======================
function openSettings() {
    loadUserSettings();
    document.getElementById("settings-modal").style.display = "flex";
}

function closeSettings() {
    document.getElementById("settings-modal").style.display = "none";
}

function changeSettingsTab(evt, tabId) {
    const tabPanes = document.getElementsByClassName("tab-pane");
    for (let i = 0; i < tabPanes.length; i++) {
        tabPanes[i].classList.remove("active");
    }
    const tabLinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }
    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// ======================
// Navigation
// ======================
function startNewChat() {
    currentChatId = Date.now();
    messages = [];
    renderMessages();
    saveChatHistory();
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById("quickBtn").classList.toggle("active-mode", mode === "quick");
    document.getElementById("deepBtn").classList.toggle("active-mode", mode === "deep");
}

function setModel(model) {
    currentModel = model;
}

// ======================
// Chat History Syncing (Local & Server Support)
// ======================
async function saveChatHistory() {
    let history = JSON.parse(localStorage.getItem("chatHistory") || "{}");
    history[currentChatId] = messages;
    localStorage.setItem("chatHistory", JSON.stringify(history));
    loadChatHistoryList();

    // SERVER DATABASE SYNC
    if (saveHistoryOnServer) {
        try {
            await fetch("https://austrox-backendofficial.containers.snapdeploy.app/api/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: currentUser,
                    chatId: currentChatId,
                    messages: messages
                })
            });
        } catch (err) {
            console.warn("Could not sync conversation data backup to server endpoint: ", err);
        }
    }
}

function loadChatHistoryList() {
    const list = document.getElementById("chat-history-list");
    list.innerHTML = "";
    let history = JSON.parse(localStorage.getItem("chatHistory") || "{}");

    Object.keys(history).reverse().forEach(id => {
        let li = document.createElement("li");
        li.className = "history-item";
        li.innerHTML = `
            <span>Chat ${new Date(Number(id)).toLocaleDateString()}</span>
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

        const displayName = msg.role === "user" ? customUsername : "AustroX AI";
        div.innerHTML = `<strong>${displayName}:</strong> ` + msg.content.replace(/\n/g, "<br>");
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
        document.title = text.substring(0, 15) + "...";
    }

    messages.push({ role: "user", content: text });
    renderMessages();
    saveChatHistory();

    input.value = "";

    const thinking = document.createElement("div");
    thinking.className = "msg ai";
    thinking.id = "thinking";
    thinking.innerHTML = "<strong>AustroX AI:</strong> 🤔 Thinking";
    document.getElementById("chat-box").appendChild(thinking);

    let dots = 0;
    const timer = setInterval(() => {
        dots = (dots + 1) % 4;
        thinking.innerHTML = "<strong>AustroX AI:</strong> 🤔 Thinking" + ".".repeat(dots);
    }, 500);

    try {
        // We append any custom prompt context (instructions) to guide the assistant backend
        const payloadMessage = customMemory 
            ? `[System Memory instructions: ${customMemory}]\nUser Message: ${text}` 
            : text;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: payloadMessage,
                mode: currentMode,
                model: currentModel
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const data = await response.json();
        clearInterval(timer);
        thinking.remove();

        messages.push({
            role: "assistant",
            content: data.reply || "⚠️ No response received."
        });
        renderMessages();
        saveChatHistory();
    } catch (error) {
        clearInterval(timer);
        thinking.remove();
        console.error("Backend connection issues:", error);
        messages.push({
            role: "assistant",
            content: "⚠️ Error resolving request. Ensure Backend Server is online."
        });
        renderMessages();
    }
}

// ======================
// Voice Input
// ======================
function startVoiceInput() {
    let users = JSON.parse(localStorage.getItem("users") || "{}");
    const micAllowed = (users[currentUser] && users[currentUser].micAllowed !== undefined) ? users[currentUser].micAllowed : true;

    if (!micAllowed) {
        alert("Microphone permissions have been disabled in AustroX Settings.");
        return;
    }

    const btn = document.getElementById("voice-btn");
    if (!("webkitSpeechRecognition" in window)) {
        alert("Voice speech services are not supported on this browser context.");
        return;
    }

    btn.classList.add("mic-active");
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = e => {
        document.getElementById("user-input").value = e.results[0][0].transcript;
        btn.classList.remove("mic-active");
        recognition.stop();
    };

    recognition.onerror = recognition.onend = () => {
        btn.classList.remove("mic-active");
    };
    recognition.start();
}
