let currentMode="quick",currentModel="meta-llama/llama-3-70b-instruct";
let chatHistory=JSON.parse(localStorage.getItem("chatHistory")||"[]");
let currentChatName="",isFirstMessage=true;

document.title="AustroX-GPT";

document.addEventListener("DOMContentLoaded",()=>{
  if(localStorage.getItem("theme")==="light")document.body.classList.add("light");
  if(!localStorage.getItem("currentUser"))window.location.href="login.html";
  loadChatHistory();
  attachMenuToggle();
});

async function sendMessage() {
  const inp=document.getElementById("user-input");
  const msg=inp.value.trim(); if(!msg)return;
  addMessage("user",msg); inp.value="";
  if(isFirstMessage){
    currentChatName=msg.slice(0,20);
    addToHistory(currentChatName);
    isFirstMessage=false;
  }
  const ai=await getAIResponse(msg);
  addMessage("ai",ai);
}

function addMessage(s,t) {
  const cb=document.getElementById("chat-box"),
    m=document.createElement("div");
  m.className="msg "+s;
  m.innerHTML=`<span class="${s}">${s==="user"?"You":"AustroX"}:</span> ${t}`;
  cb.appendChild(m);
  cb.scrollTop=cb.scrollHeight;
}

async function getAIResponse(msg){
  return fetch("https://austrox-backend-production.up.railway.app/api/chat",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({message:msg,mode:currentMode,model:currentModel})
  }).then(r=>r.json()).then(d=>d.reply)
    .catch(_=>"⚠️ Error: Unable to get response.");
}

function toggleTheme(){
  document.body.classList.toggle("light");
  localStorage.setItem("theme",document.body.classList.contains("light")?"light":"dark");
}

function startNewChat(){
  currentChatName="";isFirstMessage=true;
  document.getElementById("chat-box").innerHTML="";
}

function setMode(m){
  currentMode=m;
  document.getElementById("quickBtn").classList.toggle("active-mode",m==="quick");
  document.getElementById("deeperBtn").classList.toggle("active-mode",m==="deep");
}

function setModel(m){
  currentModel=m;
}

function loadChatHistory(){
  const ul=document.getElementById("chat-history-list");
  ul.innerHTML="";
  chatHistory.forEach((name,i)=>{
    const li=document.createElement("li");
    li.className="history-item";
    li.innerHTML=`
      <span onclick="loadChat(${i})">${name}</span>
      <button class="delete-history-btn" onclick="deleteChat(${i})">🗑</button>`;
    ul.appendChild(li);
  });
}

function addToHistory(name){
  chatHistory.unshift(name);
  localStorage.setItem("chatHistory",JSON.stringify(chatHistory));
  loadChatHistory();
}

function deleteChat(i){
  chatHistory.splice(i,1);
  localStorage.setItem("chatHistory",JSON.stringify(chatHistory));
  loadChatHistory();
}

function loadChat(i){
  alert("Load chat: "+chatHistory[i]);
}

function attachMenuToggle(){
  const btn=document.getElementById("menu-toggle");
  const sb=document.getElementById("sidebar");
  if(btn)btn.addEventListener("click",()=>sb.classList.toggle("open"));
}

function startVoiceInput(){
  const btn=document.getElementById("mic-btn");
  btn.classList.add("mic-active");
  if(!('webkitSpeechRecognition' in window)){
    alert("Voice not supported");btn.classList.remove("mic-active");return;
  }
  const rec=new webkitSpeechRecognition();
  rec.lang="en-US";rec.interimResults=false;rec.continuous=false;
  rec.onresult=e=>{
    document.getElementById("user-input").value=e.results[0][0].transcript;
    btn.classList.remove("mic-active");
    sendMessage();
    rec.stop();
  };
  rec.onerror=rec.onend=()=>btn.classList.remove("mic-active");
  rec.start();
}
