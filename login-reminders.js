(function() {
    "use strict";

    const ENABLED_KEY = "kw_login_reminders_enabled";
    const LAST_KEY = "kw_login_reminder_last";
    const AUTO_DELAY = 15 * 60 * 1000;
    const COOLDOWN = 6 * 60 * 60 * 1000;
    let reminderTimer = 0;

    const roasts = [
        "Log in, coward. Your typing speed is developing abandonment issues.",
        "Your keyboard asked where you went. I told it you were scared.",
        "Your coins called. They are tired of waiting for you to earn them.",
        "Log in before your streak files an abandonment complaint.",
        "Your high score is collecting dust. Fix that embarrassing situation.",
        "Come back and type. Those excuses are not going to misspell themselves."
    ];

    function isEnabled() {
        return localStorage.getItem(ENABLED_KEY) === "1";
    }

    function setStatus(message) {
        const status = document.getElementById("loginReminderStatus");
        if (status) status.textContent = message;
    }

    function syncControls() {
        const toggle = document.getElementById("loginReminderToggle");
        const supported = "Notification" in window;
        if (toggle) toggle.checked = supported && isEnabled() && Notification.permission === "granted";
        if (!supported) {
            if (toggle) toggle.disabled = true;
            setStatus("System notifications are unavailable in this browser.");
        } else if (Notification.permission === "denied") {
            if (toggle) toggle.checked = false;
            setStatus("Notifications are blocked. Allow them in your browser's site settings.");
        } else if (isEnabled()) {
            setStatus("Armed. Your keyboard will complain when you disappear.");
        } else {
            setStatus("Off. Enable this if your typing streak needs aggressive supervision.");
        }
    }

    async function showReminder(force) {
        if (!("Notification" in window) || Notification.permission !== "granted") return false;
        if (!force && !isEnabled()) return false;

        const last = Number(localStorage.getItem(LAST_KEY) || 0);
        if (!force && Date.now() - last < COOLDOWN) return false;

        const message = roasts[Math.floor(Math.random() * roasts.length)];
        const options = {
            body: message,
            icon: "./icon-192.png",
            badge: "./icon-192.png",
            tag: "kw-login-reminder",
            renotify: true,
            data: { url: "./" }
        };

        try {
            const registration = await navigator.serviceWorker?.ready;
            if (registration) await registration.showNotification("Keyboard Warrior demands attendance", options);
            else new Notification("Keyboard Warrior demands attendance", options);
            localStorage.setItem(LAST_KEY, String(Date.now()));
            return true;
        } catch (error) {
            console.warn("Could not show login reminder:", error);
            return false;
        }
    }

    function refresh() {
        clearTimeout(reminderTimer);
        reminderTimer = 0;
        syncControls();
        if (!isEnabled() || Notification.permission !== "granted") return;
        reminderTimer = window.setTimeout(function() {
            showReminder(false).finally(refresh);
        }, AUTO_DELAY);
    }

    async function toggleReminders(event) {
        const toggle = event.currentTarget;
        if (!toggle.checked) {
            localStorage.setItem(ENABLED_KEY, "0");
            refresh();
            return;
        }

        if (!("Notification" in window)) {
            toggle.checked = false;
            syncControls();
            return;
        }

        const permission = Notification.permission === "default"
            ? await Notification.requestPermission()
            : Notification.permission;
        const allowed = permission === "granted";
        localStorage.setItem(ENABLED_KEY, allowed ? "1" : "0");
        toggle.checked = allowed;
        if (allowed) {
            setStatus("Armed. Your first roast is ready; use TEST ROAST to preview it.");
            refresh();
        } else {
            syncControls();
        }
    }

    async function testReminder() {
        const toggle = document.getElementById("loginReminderToggle");
        if (!("Notification" in window)) return syncControls();
        if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return syncControls();
        }
        if (Notification.permission !== "granted") return syncControls();
        localStorage.setItem(ENABLED_KEY, "1");
        if (toggle) toggle.checked = true;
        const shown = await showReminder(true);
        setStatus(shown ? "Roast delivered. Your keyboard has made its demands." : "The notification could not be shown.");
        refresh();
    }

    function mount() {
        const toggle = document.getElementById("loginReminderToggle");
        const test = document.getElementById("testLoginReminder");
        if (toggle) toggle.addEventListener("change", toggleReminders);
        if (test) test.addEventListener("click", testReminder);
        document.addEventListener("visibilitychange", function() {
            if (!document.hidden) refresh();
        });
        refresh();
    }

    window.KWLoginReminders = { refresh: refresh };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
})();
