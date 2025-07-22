function register() {
  const u = document.getElementById("register-username").value.trim();
  const p = document.getElementById("register-password").value.trim();
  if (!u||!p){alert("Enter both!");return;}
  let users=JSON.parse(localStorage.getItem("users")||"{}");
  if(users[u]){alert("Exists!");return;}
  users[u]=p;localStorage.setItem("users",JSON.stringify(users));
  alert("Registered! Now login.");window.location.href="login.html";
}

function login() {
  const u=document.getElementById("login-username").value.trim();
  const p=document.getElementById("login-password").value.trim();
  let users=JSON.parse(localStorage.getItem("users")||"{}");
  if(users[u]===p){
    localStorage.setItem("currentUser",u);
    window.location.href="index.html";
  } else alert("Wrong credentials!");
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href="login.html";
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme",document.body.classList.contains("light")?"light":"dark");
}
