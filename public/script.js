// ======================
// State
// ======================
let currentUser = null;
let messages = [];
let currentChatId = Date.now();
let currentMode = "quick";
let currentModel = "auto";

// Custom Configuration Preferences
let customUsername = "User";
let customMemory = "";
let saveHistoryOnServer = true;
let preferredTone = "friendly";
let responseLength = "balanced";
let assistantStyle = "balanced";
let useEmojis = true;
let useMarkdown = true;
let factualMode = true;

// ======================
// Backend URL
// ======================
const BACKEND_BASE_URL = "https://austrox-backendofficial.containers.snapdeploy.app";
const API_URL = `${BACKEND_BASE_URL}/api/chat`;
const HISTORY_API_URL = `${BACKEND_BASE_URL}/api/history`;
const PROFILE_API_URL = `${BACKEND_BASE_URL}/api/profile`;

// ======================
// Initialize
// ======================
window.addEventListener("DOMContentLoaded", async () => {
    await window.AustroXFirebase.initializeFirebase();
    const auth = await window.AustroXFirebase.getAuth();
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        currentUser = user.uid;
        const profile = await window.AustroXFirestore.getUserProfile(user.uid);
        customUsername = profile?.displayName || user.displayName || "User";
        loadUserSettings();
        loadChatHistoryList();
        renderMessages();
        setMode(currentMode);
    });

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
    const profile = window.AustroXFirebase.getCurrentProfile();
    if (profile) {
        customUsername = profile.displayName || profile.displayUsername || customUsername;
        customMemory = profile.memory || "";
        saveHistoryOnServer = profile.historyEnabled !== undefined ? profile.historyEnabled : true;
        preferredTone = profile.preferredTone || "friendly";
        responseLength = profile.responseLength || "balanced";
        assistantStyle = profile.assistantStyle || "balanced";
        useEmojis = profile.useEmojis !== undefined ? profile.useEmojis : true;
        useMarkdown = profile.useMarkdown !== undefined ? profile.useMarkdown : true;
        factualMode = profile.factualMode !== undefined ? profile.factualMode : true;
        
        const setField = (id, value, isChecked = false) => {
            const element = document.getElementById(id);
            if (!element) return;
            if (isChecked) {
                element.checked = value;
            } else {
                element.value = value;
            }
        };

        setField("settings-username", customUsername);
        setField("settings-memory", customMemory);
        setField("settings-tone", preferredTone);
        setField("settings-length", responseLength);
        setField("settings-style", assistantStyle);
        setField("setting-emojis", useEmojis, true);
        setField("setting-markdown", useMarkdown, true);
        setField("setting-facts", factualMode, true);
        setField("perm-history", saveHistoryOnServer, true);
        setField("perm-mic", profile.micAllowed !== undefined ? profile.micAllowed : true, true);
    }
}

async function saveSettings() {
    const profile = window.AustroXFirebase.getCurrentProfile();
    const user = window.AustroXFirebase.getCurrentUser();
    if (!profile || !user) return;

    const getValue = (id, isChecked = false) => {
        const element = document.getElementById(id);
        if (!element) return undefined;
        return isChecked ? element.checked : element.value;
    };

    const newProfile = {
        displayName: (getValue("settings-username") || customUsername).toString().trim(),
        memory: (getValue("settings-memory") || "").toString().trim(),
        historyEnabled: getValue("perm-history", true),
        micAllowed: getValue("perm-mic", true),
        preferredTone: getValue("settings-tone") || "friendly",
        responseLength: getValue("settings-length") || "balanced",
        assistantStyle: getValue("settings-style") || "balanced",
        useEmojis: getValue("setting-emojis", true),
        useMarkdown: getValue("setting-markdown", true),
        factualMode: getValue("setting-facts", true)
    };

    await window.AustroXFirestore.updateUserProfile(user.uid, newProfile);
    window.AustroXFirebase.setCurrentProfile({ ...profile, ...newProfile });

    try {
        await fetch(PROFILE_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uid: user.uid,
                profile: { ...profile, ...newProfile },
                settings: newProfile
            })
        });
    } catch (error) {
        console.warn("Could not sync settings to backend profile endpoint:", error);
    }

    customUsername = newProfile.displayName;
    customMemory = newProfile.memory;
    saveHistoryOnServer = newProfile.historyEnabled;
    preferredTone = newProfile.preferredTone;
    responseLength = newProfile.responseLength;
    assistantStyle = newProfile.assistantStyle;
    useEmojis = newProfile.useEmojis;
    useMarkdown = newProfile.useMarkdown;
    factualMode = newProfile.factualMode;

    window.AustroXUtils.showToast("Settings saved.", "success");
    closeSettings();
    renderMessages();
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

    if (window.AustroXFirestore?.saveChat) {
        try {
            await window.AustroXFirestore.saveChat(
                currentChatId,
                messages[0]?.content?.slice(0, 40) || "Untitled Chat",
                messages
            );
        } catch (error) {
            console.warn("Could not sync conversation to Firestore:", error);
        }
    }

    if (saveHistoryOnServer) {
        try {
            await fetch(HISTORY_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: currentUser,
                    username: currentUser,
                    chatId: currentChatId,
                    messages: messages,
                    title: messages[0]?.content?.slice(0, 40) || "Untitled Chat",
                    profile: {
                        displayName: customUsername,
                        memory: customMemory,
                        historyEnabled: saveHistoryOnServer
                    },
                    settings: {
                        preferredTone,
                        responseLength,
                        assistantStyle,
                        useEmojis,
                        useMarkdown,
                        factualMode,
                        historyEnabled: saveHistoryOnServer
                    }
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
    const welcomeBanner = document.getElementById("welcome-banner");
    const welcomeName = document.getElementById("welcome-name");

    chatBox.innerHTML = "";
    chatBox.appendChild(welcomeBanner);
    welcomeName.textContent = customUsername || "there";
    chatBox.classList.toggle("has-messages", messages.length > 0);

    if (messages.length === 0) {
        welcomeBanner.style.display = "flex";
        chatBox.scrollTop = 0;
        return;
    }

    welcomeBanner.style.display = "none";

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
                model: currentModel,
                tone: preferredTone,
                length: responseLength,
                style: assistantStyle,
                useEmojis,
                useMarkdown,
                factualMode
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
    const profile = window.AustroXFirebase.getCurrentProfile();
    const micAllowed = profile?.micAllowed !== undefined ? profile.micAllowed : true;

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
