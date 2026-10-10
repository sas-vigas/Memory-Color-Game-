

const pads = [...document.querySelectorAll(".pad")];
const startBtn = document.getElementById("start");
const message = document.getElementById("message");
const levelText = document.getElementById("level");
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");

let sequence = [];
let playerIndex = 0;
let level = 0;
let score = 0;
let best = 0;
let acceptingInput = false;
let gameToken = 0;
let audioContext;

try {
  best = Number(localStorage.getItem("memoryBest")) || 0;
} catch (error) {}

bestText.textContent = best;

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

function setEnabled(enabled) {
  pads.forEach(pad => {
    pad.disabled = !enabled;
  });
}

function playSound(index) {
  try {
    audioContext ??= new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const frequencies = [330, 260, 390, 490];
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequencies[index];

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.15, audioContext.currentTime + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001, audioContext.currentTime + 0.25
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.26);
  } catch (error) {}
}

async function flash(index, duration = 400) {
  pads[index].classList.add("active");
  playSound(index);

  await sleep(duration);

  pads[index].classList.remove("active");
}

async function showSequence(token) {
  acceptingInput = false;
  setEnabled(false);

  message.textContent = "👀 Watch the colors...";

  await sleep(650);

  for (const color of sequence) {
    if (token !== gameToken) return;

    await flash(color);
    await sleep(180);
  }

  if (token !== gameToken) return;

  message.textContent = "🎯 Your turn!";
  acceptingInput = true;
  setEnabled(true);
}

async function nextLevel(token) {
  if (token !== gameToken) return;

  level++;
  levelText.textContent = level;

  sequence.push(Math.floor(Math.random() * pads.length));
  playerIndex = 0;

  await showSequence(token);
}

function endGame() {
  acceptingInput = false;
  setEnabled(false);

  message.textContent = `💥 Game Over! Score: ${score}`;
  startBtn.textContent = "↻ PLAY AGAIN";

  if (score > best) {
    best = score;
    bestText.textContent = best;

    try {
      localStorage.setItem("memoryBest", best);
    } catch (error) {}

    message.textContent = `🏆 NEW RECORD! Score: ${score}`;
  }
}

pads.forEach((pad, index) => {
  pad.addEventListener("click", async () => {
    if (!acceptingInput) return;

    acceptingInput = false;
    await flash(index, 180);

    if (sequence[playerIndex] !== index) {
      endGame();
      return;
    }

    playerIndex++;
    score += 10;
    scoreText.textContent = score;

    if (playerIndex === sequence.length) {
      setEnabled(false);
      message.textContent = "✅ Perfect! Next level...";

      const token = gameToken;
      await sleep(650);

      if (token === gameToken) {
        await nextLevel(token);
      }
    } else {
      acceptingInput = true;
    }
  });
});

startBtn.addEventListener("click", async () => {
  const token = ++gameToken;

  sequence = [];
  playerIndex = 0;
  level = 0;
  score = 0;

  levelText.textContent = "0";
  scoreText.textContent = "0";

  pads.forEach(pad => pad.classList.remove("active"));

  startBtn.textContent = "🎮 GAME RUNNING";

  await nextLevel(token);
});
