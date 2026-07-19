(function () {
    async function uploadFile(file, path) {
        const storage = await window.AustroXFirebase.getStorage();
        const user = window.AustroXFirebase.getCurrentUser();
        if (!user) throw new Error("You must be signed in first.");

        const storageRef = storage.ref();
        const uploadRef = storageRef.child(`users/${user.uid}/${path}/${file.name}`);
        await uploadRef.put(file);
        return uploadRef.getDownloadURL();
    }

    window.AustroXStorage = {
        uploadFile
    };
})();
