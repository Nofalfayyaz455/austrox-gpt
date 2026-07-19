(function () {
    async function getUserDocRef(uid) {
        const firestore = await window.AustroXFirebase.getFirestore();
        return firestore.collection("users").doc(uid);
    }

    async function createUserProfile(user, profileData) {
        const firestore = await window.AustroXFirebase.getFirestore();
        const now = new Date();
        const payload = {
            uid: user.uid,
            username: profileData.username || window.AustroXUtils.slugify(user.email || user.displayName || user.uid),
            displayName: profileData.displayName || user.displayName || profileData.username || "AustroX User",
            email: user.email || "",
            photoURL: user.photoURL || "",
            provider: profileData.provider || "email",
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            lastLogin: now.toISOString(),
            theme: profileData.theme || "dark",
            language: profileData.language || "en",
            historyEnabled: profileData.historyEnabled !== false,
            memoryEnabled: profileData.memoryEnabled !== false,
            premium: false,
            subscription: null,
            country: profileData.country || "",
            timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || ""
        };

        await firestore.collection("users").doc(user.uid).set(payload, { merge: true });
        return payload;
    }

    async function updateUserProfile(uid, data) {
        const firestore = await window.AustroXFirebase.getFirestore();
        const payload = {
            ...data,
            updatedAt: new Date().toISOString()
        };
        await firestore.collection("users").doc(uid).set(payload, { merge: true });
        return payload;
    }

    async function getUserProfile(uid) {
        const firestore = await window.AustroXFirebase.getFirestore();
        const snapshot = await firestore.collection("users").doc(uid).get();
        return snapshot.exists ? snapshot.data() : null;
    }

    async function updateLastLogin(uid, provider) {
        const firestore = await window.AustroXFirebase.getFirestore();
        await firestore.collection("users").doc(uid).set({
            lastLogin: new Date().toISOString(),
            provider,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }

    async function saveChat(chatId, title, messages) {
        const firestore = await window.AustroXFirebase.getFirestore();
        const user = window.AustroXFirebase.getCurrentUser();
        if (!user) return null;
        const payload = {
            chatId,
            title: title || "Untitled Chat",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages
        };
        await firestore.collection("users").doc(user.uid).collection("chats").doc(chatId).set(payload, { merge: true });
        return payload;
    }

    window.AustroXFirestore = {
        createUserProfile,
        updateUserProfile,
        getUserProfile,
        updateLastLogin,
        saveChat,
        getUserDocRef
    };
})();
