const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const workTimeInput = document.getElementById("workTime");
const restTimeInput = document.getElementById("restTime");
const modeSelect = document.getElementById("modeSelect");
const timerCard = document.querySelector(".timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

let remainingSeconds = 25 * 60;
let timerId = null;
let isRunning = false;

const pad = (value) => String(value).padStart(2, "0");

const toSeconds = (timeValue) => {
  if (!timeValue) return 0;
  const [hours, minutes, seconds] = timeValue.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const formatDisplay = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
};

const updateDisplay = () => {
  timerDisplay.textContent = formatDisplay(remainingSeconds);
};

const updateStatus = () => {
  timerStatus.textContent = modeSelect.value === "work" ? "工作模式" : "休息模式";
};

const syncRemainingWithMode = () => {
  remainingSeconds =
    modeSelect.value === "work"
      ? toSeconds(workTimeInput.value)
      : toSeconds(restTimeInput.value);
  updateDisplay();
  updateStatus();
};

const triggerShake = () => {
  if (!timerCard) return;
  timerCard.classList.remove("shake");
  void timerCard.offsetWidth;
  timerCard.classList.add("shake");
};

const handleSessionComplete = () => {
  pauseTimer();
  if (modeSelect.value === "work") {
    modeSelect.value = "rest";
    syncRemainingWithMode();
    triggerShake();
    startTimer();
    return;
  }
  updateStatus();
};

const tick = () => {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    updateDisplay();
    return;
  }
  handleSessionComplete();
};

const startTimer = () => {
  if (isRunning) return;
  if (remainingSeconds <= 0) {
    syncRemainingWithMode();
  }
  isRunning = true;
  timerId = setInterval(tick, 1000);
};

const pauseTimer = () => {
  if (!isRunning) return;
  clearInterval(timerId);
  timerId = null;
  isRunning = false;
};

const resetTimer = () => {
  pauseTimer();
  syncRemainingWithMode();
};

workTimeInput.addEventListener("change", () => {
  if (modeSelect.value === "work" && !isRunning) {
    syncRemainingWithMode();
  }
});

restTimeInput.addEventListener("change", () => {
  if (modeSelect.value === "rest" && !isRunning) {
    syncRemainingWithMode();
  }
});

modeSelect.addEventListener("change", () => {
  resetTimer();
});

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

syncRemainingWithMode();
