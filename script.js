// COPY CONTRACT
document.getElementById("copyCA").addEventListener("click", () => {
    navigator.clipboard.writeText("YOUR_CA_HERE");
    const msg = document.getElementById("copied");
    msg.style.opacity = "1";
    setTimeout(() => (msg.style.opacity = "0"), 1200);
});

// SOUND TOGGLE
const video = document.getElementById("reddyVideo");
const toggle = document.getElementById("soundToggle");

toggle.addEventListener("click", () => {
    video.muted = !video.muted;
    toggle.textContent = video.muted ? "🔇 Sound Off" : "🔊 Sound On";
});
