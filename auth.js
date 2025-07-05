// 🔐 Register user
function register() {
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value.trim();

  if (!username || !password) {
    alert("Please enter username and password.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[username]) {
    alert("Username already exists!");
    return;
  }

  users[username] = password;
  localStorage.setItem("users", JSON.stringify(users));
  alert("✅ Registered! Now login.");
  window.location.href = "login.html";
}

// 🔐 Login user
function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[username] && users[username] === password) {
    localStorage.setItem("currentUser", username);
    window.location.href = "index.html";
  } else {
    alert("❌ Incorrect username or password.");
  }
}

// 🚪 Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// 🧠 Helper (load user in index.html)
function getLoggedInUser() {
  return localStorage.getItem("currentUser");
}
// 👇 Include in auth.js or shared JS
function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

// Apply saved theme
window.onload = () => {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
  }
};
