(function () {
    const toastStack = [];
    const COUNTRY_OPTIONS = [
        "United States",
        "United Kingdom",
        "Canada",
        "Australia",
        "India",
        "Pakistan",
        "Germany",
        "France",
        "Spain",
        "Italy",
        "Netherlands",
        "Sweden",
        "Norway",
        "Denmark",
        "United Arab Emirates",
        "Saudi Arabia",
        "Turkey",
        "Brazil",
        "Mexico",
        "Japan",
        "South Korea",
        "Singapore",
        "Indonesia",
        "Malaysia",
        "South Africa",
        "Nigeria",
        "Egypt",
        "Other"
    ];
    const LANGUAGE_OPTIONS = [
        "English",
        "Arabic",
        "Bulgarian",
        "Chinese",
        "Dutch",
        "French",
        "German",
        "Hindi",
        "Indonesian",
        "Italian",
        "Japanese",
        "Korean",
        "Portuguese",
        "Russian",
        "Spanish",
        "Turkish",
        "Urdu",
        "Vietnamese"
    ];

    function isStrongPassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
    }

    function slugify(value) {
        return (value || "")
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "") || "user";
    }

    function getCountryOptions() {
        return COUNTRY_OPTIONS;
    }

    function getLanguageOptions() {
        return LANGUAGE_OPTIONS;
    }

    function detectTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }

    function sanitizeText(value) {
        return (value || "").toString().replace(/[<>]/g, "").trim();
    }

    function validateUsername(value) {
        return /^[a-z0-9_]{3,20}$/.test(value || "");
    }

    function buildUsernameSuggestions(email, displayName) {
        const base = (displayName || email || "user")
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_]+/g, "")
            .slice(0, 12);
        const seed = base || "user";
        const prefix = seed.replace(/_+/g, "").slice(0, 10);
        return [prefix, `${prefix}01`, `${prefix}_ai`, `${prefix}_pk`].filter((value, index, arr) => value && arr.indexOf(value) === index).slice(0, 4);
    }

    function showToast(message, type = "info") {
        const containerId = "austrox-toast-container";
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.style.position = "fixed";
            container.style.top = "16px";
            container.style.right = "16px";
            container.style.zIndex = "99999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "8px";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.style.padding = "12px 16px";
        toast.style.borderRadius = "8px";
        toast.style.color = "#fff";
        toast.style.minWidth = "260px";
        toast.style.maxWidth = "320px";
        toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)";
        toast.style.background = type === "error" ? "#ff4d4f" : type === "success" ? "#20c997" : "#1f6feb";
        toast.textContent = message;
        container.appendChild(toast);
        toastStack.push(toast);

        setTimeout(() => {
            toast.remove();
            const index = toastStack.indexOf(toast);
            if (index >= 0) {
                toastStack.splice(index, 1);
            }
        }, 4000);
    }

    function setLoading(button, isLoading, label = "Please wait...") {
        if (!button) return;
        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = label;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    function getPreferredTheme() {
        return localStorage.getItem("theme") || "dark";
    }

    function setPreferredTheme(theme) {
        document.documentElement.classList.toggle("light", theme === "light");
        document.body.classList.toggle("light", theme === "light");
        localStorage.setItem("theme", theme);
    }

    window.AustroXUtils = {
        isStrongPassword,
        slugify,
        getCountryOptions,
        getLanguageOptions,
        detectTimezone,
        sanitizeText,
        validateUsername,
        buildUsernameSuggestions,
        showToast,
        setLoading,
        getPreferredTheme,
        setPreferredTheme
    };
})();
