// auth.js

function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (username && password) {
    const user = {
      name: username,
      email: username + "@local",
      picture: "https://ui-avatars.com/api/?name=" + encodeURIComponent(username),
      type: "local",
    };
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location.href = "index.html";
  } else {
    alert("Invalid login");
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle("light");
  localStorage.setItem("theme", document.documentElement.classList.contains("light") ? "light" : "dark");
}

function logout() {
  import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js")
    .then(({ getAuth, signOut }) => {
      const auth = getAuth();
      signOut(auth).catch(() => {});
    })
    .finally(() => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    });
}

function toggleProfileDropdown() {
  const menu = document.getElementById("profile-dropdown");
  menu.classList.toggle("show");
}

window.login = login;
window.logout = logout;
window.toggleTheme = toggleTheme;
window.toggleProfileDropdown = toggleProfileDropdown;
