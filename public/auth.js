
// Advanced Password Rule Validations
function isPasswordStrong(password) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
}

function register() {
  const u = document.getElementById("register-username").value.trim();
  const p = document.getElementById("register-password").value.trim();
  
  if (!u || !p) {
    alert("Please fill out both fields.");
    return;
  }

  // Password Complexity Enforcement
  if (!isPasswordStrong(p)) {
    alert("Password is weak! It must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users[u]) {
    alert("Username is already registered.");
    return;
  }

  // Store profile custom settings along with user
  users[u] = {
    password: p,
    displayUsername: u,
    memory: "",
    micAllowed: true,
    historyAllowed: true
  };
  
  localStorage.setItem("users", JSON.stringify(users));
  alert("Account securely initialized! Proceed to Login.");
  window.location.href = "login.html";
}

function login() {
  const u = document.getElementById("login-username").value.trim();
  const p = document.getElementById("login-password").value.trim();
  
  let users = JSON.parse(localStorage.getItem("users") || "{}");
  
  if (users[u]) {
    // Handling legacy plain string formats vs objects
    const userObj = typeof users[u] === "object" ? users[u] : { password: users[u] };
    
    if (userObj.password === p) {
      localStorage.setItem("currentUser", u);
      window.location.href = "index.html";
      return;
    }
  }
  alert("Invalid verification credentials.");
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}
