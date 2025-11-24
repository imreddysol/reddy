// ===============================
// Contract Address Copy Logic
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const caSpan = document.getElementById("contractAddress");
  const copyBtn = document.getElementById("copyCaBtn");
  const copyStatus = document.getElementById("copyStatus");

  copyBtn.addEventListener("click", async () => {
    const ca = caSpan.getAttribute("data-address") || caSpan.textContent.trim();
    try {
      await navigator.clipboard.writeText(ca);
      copyStatus.textContent = "Copied!";
    } catch (err) {
      console.error(err);
      copyStatus.textContent = "Copy failed.";
    }
    setTimeout(() => {
      copyStatus.textContent = "";
    }, 1500);
  });
});

// ===============================
// Reddy Catch Game
// ===============================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const multiplierEl = document.getElementById("multiplier");
const statusMessageEl = document.getElementById("statusMessage");
const startBtn = document.getElementById("startGameBtn");

// ----- Player (Reddy) -----
const player = {
  x: canvas.width / 2,
  y: canvas.height - 70,
  width: 80,
  height: 80,
  speed: 600,
  isDragging: false
};

// Optional Reddy image (put images/reddy.png in your project)
const reddyImg = new Image();
reddyImg.src = "images/reddy.png"; // <-- replace with your real path
let reddyImgLoaded = false;
reddyImg.onload = () => {
  reddyImgLoaded = true;
};

// Optional background image (green bamboo art)
// If you want a static background, drop a PNG in images/background.png
const bgImg = new Image();
bgImg.src = "images/background.png"; // <-- replace or remove if you don't use it
let bgLoaded = false;
bgImg.onload = () => {
  bgLoaded = true;
};

// ----- Game State -----
let items = []; // falling objects
let score = 0;
let gameOver = false;
let lastTime = 0;

let spawnTimer = 0;
let spawnInterval = 0.9; // seconds; will decrease over time

let multiplier = 1;
let multiplierTimeLeft = 0; // seconds of 2x left

// ----- Falling Object Types -----
// type: "bamboo" (good), "bomb", "knife", "rock" (bad), "power2x" (good)
function spawnItem() {
  const x = Math.random() * (canvas.width - 40) + 20;
  const y = -20;
  const roll = Math.random();

  let type;
  if (roll < 0.6) {
    type = "bamboo";
  } else if (roll < 0.75) {
    type = "bomb";
  } else if (roll < 0.9) {
    type = "knife";
  } else if (roll < 0.95) {
    type = "rock";
  } else {
    type = "power2x";
  }

  const baseSpeed = 160 + score * 2; // speeds up with score
  const speed = baseSpeed + Math.random() * 80;

  items.push({
    x,
    y,
    radius: type === "bamboo" ? 18 : 16,
    vy: speed,
    type
  });
}

// ----- Collision Helpers -----
function rectCircleColliding(circle, rect) {
  const distX = Math.abs(circle.x - rect.x);
  const distY = Math.abs(circle.y - rect.y);

  if (distX > rect.width / 2 + circle.radius) return false;
  if (distY > rect.height / 2 + circle.radius) return false;

  if (distX <= rect.width / 2) return true;
  if (distY <= rect.height / 2) return true;

  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

// ----- Game Loop -----
function resetGame() {
  score = 0;
  items = [];
  gameOver = false;
  spawnInterval = 0.9;
  spawnTimer = 0;
  multiplier = 1;
  multiplierTimeLeft = 0;
  lastTime = 0;
  player.x = canvas.width / 2;
  statusMessageEl.textContent = "Catch bamboo, dodge danger. GLHF.";
  scoreEl.textContent = score;
  multiplierEl.textContent = "x" + multiplier;
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  draw();

  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  } else {
    statusMessageEl.textContent = "Game over! Press Start / Restart.";
  }
}

function update(dt) {
  // Spawn objects
  spawnTimer += dt;
  if (spawnTimer >= spawnInterval) {
    spawnItem();
    spawnTimer = 0;

    // Slightly reduce interval over time to make game harder
    spawnInterval = Math.max(0.35, spawnInterval - 0.008);
  }

  // Update multiplier timer
  if (multiplierTimeLeft > 0) {
    multiplierTimeLeft -= dt;
    if (multiplierTimeLeft <= 0) {
      multiplier = 1;
      multiplierTimeLeft = 0;
      statusMessageEl.textContent = "Back to normal points.";
    }
  }

  // Move items
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += it.vy * dt;

    // Out of screen bottom => remove
    if (it.y - it.radius > canvas.height) {
      items.splice(i, 1);
      continue;
    }

    // Collision with player
    const circle = { x: it.x, y: it.y, radius: it.radius };
    const rect = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height
    };

    if (rectCircleColliding(circle, rect)) {
      handleCollision(it, i);
    }
  }

  scoreEl.textContent = score;
  multiplierEl.textContent = "x" + multiplier;
}

function handleCollision(item, index) {
  if (item.type === "bamboo") {
    score += 1 * multiplier;
    items.splice(index, 1);
  } else if (item.type === "power2x") {
    multiplier = 2;
    multiplierTimeLeft = 5; // seconds
    statusMessageEl.textContent = "2x activated!";
    items.splice(index, 1);
  } else {
    // Bomb / knife / rock
    gameOver = true;
  }
}

// ----- Drawing -----
function drawBackground() {
  if (bgLoaded) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    // fallback background (already set in CSS for canvas)
    // we can clear here to avoid ghosting
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPlayer() {
  const px = player.x;
  const py = player.y;
  const w = player.width;
  const h = player.height;

  if (reddyImgLoaded) {
    ctx.drawImage(reddyImg, px - w / 2, py - h / 2, w, h);
  } else {
    // fallback: simple round body
    ctx.fillStyle = "#ff7b4a";
    ctx.beginPath();
    ctx.arc(px, py, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b1f14";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("R", px, py + 4);
  }
}

function drawItems() {
  for (const it of items) {
    switch (it.type) {
      case "bamboo":
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.roundRect(it.x - 10, it.y - 20, 20, 40, 4);
        ctx.fill();
        ctx.fillStyle = "#1f7f45";
        ctx.fillRect(it.x - 5, it.y - 18, 10, 3);
        break;
      case "bomb":
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#555";
        ctx.beginPath();
        ctx.moveTo(it.x, it.y - it.radius);
        ctx.lineTo(it.x, it.y - it.radius - 8);
        ctx.stroke();
        break;
      case "knife":
        ctx.fillStyle = "#d8d8d8";
        ctx.beginPath();
        ctx.moveTo(it.x, it.y - 18);
        ctx.lineTo(it.x + 8, it.y);
        ctx.lineTo(it.x - 8, it.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(it.x - 3, it.y, 6, 10);
        break;
      case "rock":
        ctx.fillStyle = "#7a7a7a";
        ctx.beginPath();
        ctx.ellipse(it.x, it.y, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "power2x":
        ctx.fillStyle = "#f9e66a";
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f5b800";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.radius - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#b07000";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("2x", it.x, it.y + 1);
        ctx.lineWidth = 1;
        break;
    }
  }
}

function drawGameOverOverlay() {
  if (!gameOver) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "32px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);

  ctx.font = "18px system-ui";
  ctx.fillText("Press Start / Restart to play again", canvas.width / 2, canvas.height / 2 + 24);
}

function draw() {
  drawBackground();
  drawPlayer();
  drawItems();
  drawGameOverOverlay();
}

// ----- Input: drag / mouse / touch -----
function canvasToLocalX(event) {
  const rect = canvas.getBoundingClientRect();
  let clientX = 0;
  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
  } else {
    clientX = event.clientX;
  }
  const x = clientX - rect.left;
  return x;
}

canvas.addEventListener("mousedown", (e) => {
  player.isDragging = true;
  player.x = clampX(canvasToLocalX(e));
});

canvas.addEventListener("mousemove", (e) => {
  if (!player.isDragging) return;
  player.x = clampX(canvasToLocalX(e));
});

canvas.addEventListener("mouseup", () => {
  player.isDragging = false;
});

canvas.addEventListener("mouseleave", () => {
  player.isDragging = false;
});

// touch
canvas.addEventListener("touchstart", (e) => {
  player.isDragging = true;
  player.x = clampX(canvasToLocalX(e));
  e.preventDefault();
});

canvas.addEventListener("touchmove", (e) => {
  if (!player.isDragging) return;
  player.x = clampX(canvasToLocalX(e));
  e.preventDefault();
});

canvas.addEventListener("touchend", () => {
  player.isDragging = false;
});

function clampX(x) {
  const half = player.width / 2;
  if (x < half) return half;
  if (x > canvas.width - half) return canvas.width - half;
  return x;
}

// ----- Start button -----
startBtn.addEventListener("click", () => {
  resetGame();
});

