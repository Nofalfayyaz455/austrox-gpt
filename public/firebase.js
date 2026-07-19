(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyCB_USnsslqnLR4BQ4w8_6XYbynxz-OxHk",
        authDomain: "austrox-gpt-1.firebaseapp.com",
        projectId: "austrox-gpt-1",
        storageBucket: "austrox-gpt-1.firebasestorage.app",
        messagingSenderId: "1002485175461",
        appId: "1:1002485175461:web:5205217c4e7c111304694c",
        measurementId: "G-ZHSJ5WQJE1"
    };

    const state = {
        initialized: false,
        readyPromise: null,
        app: null,
        auth: null,
        firestore: null,
        storage: null,
        currentUser: null,
        currentProfile: null
    };

    function initializeFirebase() {
        if (state.readyPromise) {
            return state.readyPromise;
        }

        state.readyPromise = new Promise((resolve, reject) => {
            if (typeof window.firebase === "undefined" || !window.firebase.apps) {
                reject(new Error("Firebase SDK failed to load."));
                return;
            }

            if (!window.firebase.apps.length) {
                state.app = window.firebase.initializeApp(firebaseConfig);
            } else {
                state.app = window.firebase.apps[0];
            }

            state.auth = window.firebase.auth();
            state.firestore = window.firebase.firestore();
            state.storage = window.firebase.storage();
            state.initialized = true;
            resolve(state);
        });

        return state.readyPromise;
    }

    async function getAuth() {
        await initializeFirebase();
        return state.auth;
    }

    async function getFirestore() {
        await initializeFirebase();
        return state.firestore;
    }

    async function getStorage() {
        await initializeFirebase();
        return state.storage;
    }

    function setCurrentUser(user) {
        state.currentUser = user;
        if (user) {
            localStorage.setItem("austroxCurrentUid", user.uid);
        } else {
            localStorage.removeItem("austroxCurrentUid");
        }
    }

    function setCurrentProfile(profile) {
        state.currentProfile = profile;
    }

    function getCurrentUser() {
        return state.currentUser;
    }

    function getCurrentProfile() {
        return state.currentProfile;
    }

    window.AustroXFirebase = {
        config: firebaseConfig,
        initializeFirebase,
        getAuth,
        getFirestore,
        getStorage,
        setCurrentUser,
        setCurrentProfile,
        getCurrentUser,
        getCurrentProfile
    };

    window.addEventListener("DOMContentLoaded", () => {
        initializeFirebase().catch((error) => {
            console.error("Firebase initialization failed:", error);
        });
    });
})();
