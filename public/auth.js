
(function () {
    const authState = {
        googleFlowInProgress: false,
        googleFlowToken: 0,
        googleButtonHandlerAttached: false,
        googleAuthPendingPromise: null,
        authListenerAttached: false
    };

    const isDevEnvironment = () => window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    function getFormElements() {
        return {
            registerForm: document.getElementById("register-form"),
            loginForm: document.getElementById("login-form"),
            registerUsername: document.getElementById("register-username"),
            registerDisplayName: document.getElementById("register-display-name"),
            registerFirstName: document.getElementById("register-first-name"),
            registerLastName: document.getElementById("register-last-name"),
            registerEmail: document.getElementById("register-email"),
            registerPassword: document.getElementById("register-password"),
            registerConfirmPassword: document.getElementById("register-confirm-password"),
            registerCountry: document.getElementById("register-country"),
            registerLanguage: document.getElementById("register-language"),
            registerTimezone: document.getElementById("register-timezone"),
            registerAcceptTerms: document.getElementById("register-accept-terms"),
            registerMarketing: document.getElementById("register-marketing"),
            loginEmail: document.getElementById("login-email"),
            loginPassword: document.getElementById("login-password"),
            rememberMe: document.getElementById("remember-me"),
            forgotPasswordBtn: document.getElementById("forgot-password-btn"),
            passwordStrengthFill: document.getElementById("password-strength-fill"),
            passwordStrengthText: document.getElementById("password-strength-text"),
            passwordChecklist: document.getElementById("password-checklist")
        };
    }

    function applyTheme() {
        const preferred = localStorage.getItem("theme") || "dark";
        window.AustroXUtils.setPreferredTheme(preferred);
    }

    function updatePasswordStrength() {
        const elements = getFormElements();
        if (!elements.registerPassword || !elements.passwordStrengthFill || !elements.passwordStrengthText) {
            return;
        }

        const password = elements.registerPassword.value || "";
        const score = [password.length >= 8, /[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z\d]/.test(password)].filter(Boolean).length;
        const strong = window.AustroXUtils.isStrongPassword(password);
        const percent = (score / 5) * 100;
        const color = strong ? "#20c997" : score >= 3 ? "#ffb84d" : "#ff4d4f";
        const checks = [
            { label: "At least 8 characters", ok: password.length >= 8 },
            { label: "Lowercase letter", ok: /[a-z]/.test(password) },
            { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
            { label: "Number", ok: /\d/.test(password) },
            { label: "Symbol", ok: /[^A-Za-z\d]/.test(password) }
        ];

        elements.passwordStrengthFill.style.width = `${percent}%`;
        elements.passwordStrengthFill.style.background = color;
        elements.passwordStrengthText.textContent = strong ? "Strong password" : score >= 3 ? "Fair password" : "Weak password";
        elements.passwordStrengthText.style.color = color;
        if (elements.passwordChecklist) {
            elements.passwordChecklist.innerHTML = checks.map(check => `<div class="${check.ok ? "ok" : "bad"}">${check.ok ? "✓" : "•"} ${check.label}</div>`).join("");
        }
    }

    function attachPasswordToggles() {
        document.querySelectorAll("[data-password-toggle]").forEach((button) => {
            button.addEventListener("click", () => {
                const target = document.getElementById(button.getAttribute("data-password-toggle"));
                if (!target) return;
                const isHidden = target.type === "password";
                target.type = isHidden ? "text" : "password";
                button.textContent = isHidden ? "🙈" : "👁";
                button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
            });
        });
    }

    function attachUiHandlers() {
        const elements = getFormElements();

        if (elements.registerPassword) {
            elements.registerPassword.addEventListener("input", updatePasswordStrength);
        }

        if (elements.registerConfirmPassword) {
            elements.registerConfirmPassword.addEventListener("input", () => {
                const same = elements.registerConfirmPassword.value === (elements.registerPassword?.value || "");
                elements.registerConfirmPassword.style.borderColor = same ? "" : "#ff4d4f";
            });
        }

        if (elements.registerForm) {
            elements.registerForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                await handleRegister();
            });
        }

        if (elements.loginForm) {
            elements.loginForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                await handleLogin();
            });
        }

        if (elements.forgotPasswordBtn) {
            elements.forgotPasswordBtn.addEventListener("click", handleForgotPassword);
        }

        attachPasswordToggles();
    }

    async function ensureAuthReady() {
        await window.AustroXFirebase.initializeFirebase();
    }

    async function handleRegister() {
        const elements = getFormElements();
        const username = (elements.registerUsername?.value || "").trim().toLowerCase();
        const displayName = window.AustroXUtils.sanitizeText(elements.registerDisplayName?.value || "");
        const firstName = window.AustroXUtils.sanitizeText(elements.registerFirstName?.value || "");
        const lastName = window.AustroXUtils.sanitizeText(elements.registerLastName?.value || "");
        const email = (elements.registerEmail?.value || "").trim();
        const password = elements.registerPassword?.value || "";
        const confirmPassword = elements.registerConfirmPassword?.value || "";
        const country = window.AustroXUtils.sanitizeText(elements.registerCountry?.value || "");
        const language = window.AustroXUtils.sanitizeText(elements.registerLanguage?.value || "English");
        const timezone = window.AustroXUtils.sanitizeText(elements.registerTimezone?.value || window.AustroXUtils.detectTimezone());
        const acceptTerms = elements.registerAcceptTerms?.checked;
        const marketing = elements.registerMarketing?.checked;

        if (!username || !email || !password || !confirmPassword) {
            window.AustroXUtils.showToast("Please complete the required fields.", "error");
            return;
        }

        if (!window.AustroXUtils.validateUsername(username)) {
            window.AustroXUtils.showToast("Username must be 3-20 lowercase letters, numbers, or underscores.", "error");
            return;
        }

        if (password !== confirmPassword) {
            window.AustroXUtils.showToast("Passwords do not match.", "error");
            return;
        }

        if (!window.AustroXUtils.isStrongPassword(password)) {
            window.AustroXUtils.showToast("Use a stronger password with uppercase, lowercase, number, and symbol.", "error");
            return;
        }

        if (!acceptTerms) {
            window.AustroXUtils.showToast("Please accept the terms and privacy policy.", "error");
            return;
        }

        const button = elements.registerForm?.querySelector("button[type='submit']");
        window.AustroXUtils.setLoading(button, true, "Creating account...");

        try {
            await ensureAuthReady();
            const firestore = await window.AustroXFirebase.getFirestore();
            const existing = await firestore.collection("users").where("username", "==", username).limit(1).get();
            if (!existing.empty) {
                window.AustroXUtils.showToast("That username is already taken.", "error");
                return;
            }

            const auth = await window.AustroXFirebase.getAuth();
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await user.updateProfile({ displayName: displayName || username });
            await user.sendEmailVerification();

            const profile = await window.AustroXFirestore.createUserProfile(user, {
                username,
                displayName: displayName || username,
                firstName,
                lastName,
                country,
                timezone,
                language,
                provider: "email",
                marketing,
                termsAccepted: true
            });

            window.AustroXFirebase.setCurrentUser(user);
            window.AustroXFirebase.setCurrentProfile(profile);
            window.AustroXUtils.showToast("Please verify your email before logging in.", "success");
            elements.registerForm.reset();
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);
        } catch (error) {
            window.AustroXUtils.showToast(mapAuthError(error), "error");
        } finally {
            window.AustroXUtils.setLoading(button, false);
        }
    }

    async function handleLogin() {
        const elements = getFormElements();
        const email = (elements.loginEmail?.value || "").trim();
        const password = elements.loginPassword?.value || "";

        if (!email || !password) {
            window.AustroXUtils.showToast("Enter your email and password.", "error");
            return;
        }

        const button = elements.loginForm?.querySelector("button[type='submit']");
        window.AustroXUtils.setLoading(button, true, "Signing in...");

        try {
            await ensureAuthReady();
            const auth = await window.AustroXFirebase.getAuth();
            const persistenceMode = elements.rememberMe?.checked ? "local" : "session";
            await auth.setPersistence(persistenceMode === "local"
                ? window.firebase.auth.Auth.Persistence.LOCAL
                : window.firebase.auth.Auth.Persistence.SESSION);

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await auth.signOut();
                window.AustroXUtils.showToast("Please verify your email before logging in.", "error");
                return;
            }

            const profile = await window.AustroXFirestore.getUserProfile(user.uid);
            const finalProfile = profile || await window.AustroXFirestore.createUserProfile(user, {
                username: window.AustroXUtils.slugify(user.email || user.displayName || user.uid),
                displayName: user.displayName || user.email || "AustroX User",
                provider: "email"
            });

            await window.AustroXFirestore.updateLastLogin(user.uid, "email");
            window.AustroXFirebase.setCurrentUser(user);
            window.AustroXFirebase.setCurrentProfile(finalProfile);
            window.AustroXUtils.showToast("Welcome back!", "success");
            window.location.href = "index.html";
        } catch (error) {
            window.AustroXUtils.showToast(mapAuthError(error), "error");
        } finally {
            window.AustroXUtils.setLoading(button, false);
        }
    }

    async function handleResendVerification() {
        const email = prompt("Enter the email address for your account:");
        if (!email) return;
        try {
            await ensureAuthReady();
            const auth = await window.AustroXFirebase.getAuth();
            const user = await auth.fetchSignInMethodsForEmail(email.trim());
            if (!user.length) {
                window.AustroXUtils.showToast("No account found for that email.", "error");
                return;
            }
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email === email.trim()) {
                await currentUser.sendEmailVerification();
            }
            window.AustroXUtils.showToast("Verification email sent.", "success");
        } catch (error) {
            window.AustroXUtils.showToast(mapAuthError(error), "error");
        }
    }

    function setGoogleButtonState(button, isLoading) {
        if (!button) return;
        button.disabled = isLoading;
        button.dataset.loading = isLoading ? "true" : "false";
        button.style.opacity = isLoading ? "0.8" : "1";
        button.textContent = isLoading ? "Connecting..." : "🔵 Continue with Google";
    }

    function resetGoogleAuthFlow(button, message, type = "info") {
        authState.googleFlowInProgress = false;
        authState.googleFlowToken += 1;
        authState.googleAuthPendingPromise = null;
        setGoogleButtonState(button, false);
        if (message) {
            window.AustroXUtils.showToast(message, type);
        }
    }

    async function handleGoogleLogin() {
        const button = document.querySelector(".google-btn");
        if (!button) return;
        if (authState.googleFlowInProgress) {
            if (isDevEnvironment()) {
                console.info("[GoogleAuth] Ignoring duplicate click because a Google sign-in is already in progress.");
            }
            return;
        }

        if (authState.googleAuthPendingPromise) {
            return authState.googleAuthPendingPromise;
        }

        authState.googleFlowInProgress = true;
        authState.googleFlowToken += 1;
        const flowToken = authState.googleFlowToken;
        setGoogleButtonState(button, true);
        console.log("[GoogleAuth] starting flow", { flowToken, hostname: window.location.hostname, pathname: window.location.pathname });

        const runGoogleFlow = async () => {
            try {
                if (isDevEnvironment()) {
                    console.info("[GoogleAuth] Starting Google sign-in flow.");
                }

                await ensureAuthReady();
                const auth = await window.AustroXFirebase.getAuth();
                const provider = new window.firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({ prompt: "select_account" });
                console.log("[GoogleAuth] popup provider ready", { flowToken });

                const result = await auth.signInWithPopup(provider);

                if (authState.googleFlowToken !== flowToken) {
                    if (isDevEnvironment()) {
                        console.info("[GoogleAuth] Stale flow completed after reset; ignoring.");
                    }
                    return;
                }

                console.log("[GoogleAuth] popup resolved", { flowToken, uid: result?.user?.uid });
                const user = result.user;
                const profile = await window.AustroXFirestore.getUserProfile(user.uid);
                const finalProfile = profile || await window.AustroXFirestore.createUserProfile(user, {
                    username: window.AustroXUtils.slugify(user.email || user.displayName || user.uid),
                    displayName: user.displayName || user.email || "AustroX User",
                    provider: "google"
                });

                await window.AustroXFirestore.updateLastLogin(user.uid, "google");
                window.AustroXFirebase.setCurrentUser(user);
                window.AustroXFirebase.setCurrentProfile(finalProfile);
                console.log("[GoogleAuth] success branch reached", { flowToken, uid: user.uid });
                resetGoogleAuthFlow(button, "Signed in with Google.", "success");
                console.log("[GoogleAuth] redirecting to index", { flowToken });
                window.location.href = "index.html";
            } catch (error) {
                if (authState.googleFlowToken !== flowToken) {
                    return;
                }

                const code = error?.code || error?.message || "";
                if (code === "auth/network-request-failed") {
                    console.error("[GoogleAuth] Network request failed:", error);
                    resetGoogleAuthFlow(button, "Network request failed. Please try again.", "error");
                } else if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
                    console.warn("[GoogleAuth] Popup was blocked or closed.");
                    resetGoogleAuthFlow(button, "Google popup was blocked or closed. Please allow popups and try again.", "error");
                    if (window.matchMedia("(max-width: 768px)").matches || /android|iphone|ipad|mobile/i.test(navigator.userAgent)) {
                        try {
                            const auth = await window.AustroXFirebase.getAuth();
                            const provider = new window.firebase.auth.GoogleAuthProvider();
                            provider.setCustomParameters({ prompt: "select_account" });
                            await auth.signInWithRedirect(provider);
                            console.info("[GoogleAuth] Redirect flow started for mobile fallback.");
                        } catch (redirectError) {
                            console.error("[GoogleAuth] Redirect fallback failed:", redirectError);
                            resetGoogleAuthFlow(button, mapAuthError(redirectError), "error");
                        }
                    }
                } else if (code === "auth/account-exists-with-different-credential") {
                    console.error("[GoogleAuth] Account conflict:", error);
                    resetGoogleAuthFlow(button, "That email is already linked to another sign-in method.", "error");
                } else if (code === "auth/operation-not-allowed") {
                    console.error("[GoogleAuth] Google sign-in not enabled:", error);
                    resetGoogleAuthFlow(button, "Google sign-in is not enabled for this project.", "error");
                } else if (code === "auth/unauthorized-domain") {
                    console.error("[GoogleAuth] Unauthorized domain:", error);
                    resetGoogleAuthFlow(button, "This domain is not authorized for Google sign-in.", "error");
                } else {
                    console.error("[GoogleAuth] Google sign-in failed:", error);
                    resetGoogleAuthFlow(button, mapAuthError(error), "error");
                }
            }
        };

        authState.googleAuthPendingPromise = runGoogleFlow();
        try {
            await authState.googleAuthPendingPromise;
        } finally {
            console.log("[GoogleAuth] finally reached", { flowToken, inProgress: authState.googleFlowInProgress });
            if (authState.googleFlowInProgress && authState.googleFlowToken === flowToken) {
                setGoogleButtonState(button, false);
            }
            authState.googleFlowInProgress = false;
            authState.googleAuthPendingPromise = null;
        }
    }

    async function handleForgotPassword() {
        const email = prompt("Enter your email address to receive a reset link:");
        if (!email) return;

        try {
            await ensureAuthReady();
            const auth = await window.AustroXFirebase.getAuth();
            await auth.sendPasswordResetEmail(email.trim());
            window.AustroXUtils.showToast("Password reset email sent.", "success");
        } catch (error) {
            window.AustroXUtils.showToast(mapAuthError(error), "error");
        }
    }

    function mapAuthError(error) {
        const code = error?.code || "";
        switch (code) {
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/weak-password":
                return "Password is too weak. Use at least 8 characters with mixed case, a number, and a symbol.";
            case "auth/email-already-in-use":
                return "An account with that email already exists.";
            case "auth/user-not-found":
            case "auth/wrong-password":
                return "Incorrect email or password.";
            case "auth/network-request-failed":
                return "Network error. Please try again.";
            case "auth/popup-blocked":
                return "Google sign-in popup was blocked. Please allow popups and try again.";
            case "auth/popup-closed-by-user":
                return "Google sign-in was cancelled.";
            case "auth/too-many-requests":
                return "Too many attempts. Please wait a moment and try again.";
            default:
                return error?.message || "Authentication failed.";
        }
    }

    function setupAuthListener() {
        if (authState.authListenerAttached) return;

        authState.authListenerAttached = true;
        window.AustroXFirebase.initializeFirebase().then(async () => {
            const auth = await window.AustroXFirebase.getAuth();
            auth.onAuthStateChanged(async (user) => {
                console.log("[GoogleAuth] auth state changed", { hasUser: !!user, flowInProgress: authState.googleFlowInProgress, pathname: window.location.pathname });
                if (user) {
                    const profile = await window.AustroXFirestore.getUserProfile(user.uid);
                    const finalProfile = profile || await window.AustroXFirestore.createUserProfile(user, {
                        username: window.AustroXUtils.slugify(user.email || user.displayName || user.uid),
                        displayName: user.displayName || user.email || "AustroX User",
                        provider: user.providerData?.[0]?.providerId || "email"
                    });
                    window.AustroXFirebase.setCurrentUser(user);
                    window.AustroXFirebase.setCurrentProfile(finalProfile);

                    if (!authState.googleFlowInProgress && (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html"))) {
                        if (user.emailVerified || user.providerData?.some((entry) => entry.providerId === "google.com")) {
                            console.log("[GoogleAuth] redirecting from auth page", { uid: user.uid });
                            window.location.href = "index.html";
                        }
                    }
                } else {
                    window.AustroXFirebase.setCurrentUser(null);
                    window.AustroXFirebase.setCurrentProfile(null);
                }
            });
        });
    }

    function init() {
        const elements = getFormElements();
        applyTheme();
        attachUiHandlers();
        updatePasswordStrength();
        setupAuthListener();

        const googleButton = document.querySelector(".google-btn");
        if (googleButton && !authState.googleButtonHandlerAttached) {
            googleButton.addEventListener("click", handleGoogleLogin);
            authState.googleButtonHandlerAttached = true;
        }

        window.continueWithGoogle = handleGoogleLogin;
        window.register = handleRegister;
        window.login = handleLogin;
        window.resendVerification = handleResendVerification;

        const resendButton = document.getElementById("resend-verification-btn");
        if (resendButton) {
            resendButton.addEventListener("click", handleResendVerification);
        }
        window.logout = async function () {
            const auth = await window.AustroXFirebase.getAuth();
            await auth.signOut();
            window.AustroXFirebase.setCurrentUser(null);
            window.AustroXFirebase.setCurrentProfile(null);
            window.location.href = "login.html";
        };
        window.toggleTheme = () => {
            const nextTheme = localStorage.getItem("theme") === "light" ? "dark" : "light";
            window.AustroXUtils.setPreferredTheme(nextTheme);
        };

        if (elements.registerCountry) {
            const countries = window.AustroXUtils.getCountryOptions();
            elements.registerCountry.innerHTML = ['<option value="">Select country</option>', ...countries.map(country => `<option value="${country}">${country}</option>`)].join('');
        }
        if (elements.registerLanguage) {
            const languages = window.AustroXUtils.getLanguageOptions();
            elements.registerLanguage.innerHTML = ['<option value="">Select language</option>', ...languages.map(language => `<option value="${language}">${language}</option>`)].join('');
        }
        if (elements.registerTimezone) {
            elements.registerTimezone.value = window.AustroXUtils.detectTimezone();
        }
        if (elements.registerUsername) {
            elements.registerUsername.addEventListener("input", () => {
                const value = elements.registerUsername.value.trim().toLowerCase();
                const suggestionBox = document.getElementById("username-suggestion");
                if (!suggestionBox) return;
                suggestionBox.textContent = window.AustroXUtils.validateUsername(value) ? `Username ${value} looks good.` : "Use 3-20 lowercase letters, numbers, or underscores.";
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
