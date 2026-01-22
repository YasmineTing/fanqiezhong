const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const workTimeInput = document.getElementById("workTime");
const restTimeInput = document.getElementById("restTime");
const longRestTimeInput = document.getElementById("longRestTime");
const cyclesCountInput = document.getElementById("cyclesCount");
const modeSelect = document.getElementById("modeSelect");
const timerCard = document.querySelector(".timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const tasksList = document.getElementById("tasksList");
const completedRoundsEl = document.getElementById("completedRounds");
const focusMinutesEl = document.getElementById("focusMinutes");
const focusChart = document.getElementById("focusChart");
const achievementsList = document.getElementById("achievementsList");

let remainingSeconds = 25 * 60;
let timerId = null;
let isRunning = false;
let isLongRest = false;
let workSessionsCompleted = 0;

const statsKey = "pomodoroStats";

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

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const getDefaultStats = () => ({
  date: getTodayKey(),
  completedRounds: 0,
  focusMinutes: 0,
  focusByHour: Array.from({ length: 24 }, () => 0),
});

const loadStats = () => {
  const raw = localStorage.getItem(statsKey);
  if (!raw) return getDefaultStats();
  const parsed = JSON.parse(raw);
  if (parsed.date !== getTodayKey()) {
    return getDefaultStats();
  }
  return parsed;
};

const saveStats = (stats) => {
  localStorage.setItem(statsKey, JSON.stringify(stats));
};

const achievementsConfig = [
  {
    id: "first-round",
    title: "第一轮完成",
    description: "完成 1 轮番茄钟",
    check: (statsValue) => statsValue.completedRounds >= 1,
  },
  {
    id: "four-rounds",
    title: "四轮达人",
    description: "累计完成 4 轮番茄钟",
    check: (statsValue) => statsValue.completedRounds >= 4,
  },
  {
    id: "ten-rounds",
    title: "专注达人",
    description: "累计完成 10 轮番茄钟",
    check: (statsValue) => statsValue.completedRounds >= 10,
  },
  {
    id: "hour-focus",
    title: "一小时专注",
    description: "累计专注时长达到 60 分钟",
    check: (statsValue) => statsValue.focusMinutes >= 60,
  },
];

let stats = loadStats();

const renderStats = () => {
  completedRoundsEl.textContent = stats.completedRounds;
  focusMinutesEl.textContent = stats.focusMinutes;
  drawChart();
  renderAchievements();
};

const renderAchievements = () => {
  achievementsList.innerHTML = "";
  achievementsConfig.forEach((achievement) => {
    const unlocked = achievement.check(stats);
    const card = document.createElement("div");
    card.className = "achievement-card";
    if (!unlocked) {
      card.classList.add("locked");
    }

    const title = document.createElement("div");
    title.className = "achievement-card__title";
    title.textContent = unlocked ? `✅ ${achievement.title}` : achievement.title;

    const desc = document.createElement("div");
    desc.className = "achievement-card__desc";
    desc.textContent = achievement.description;

    card.append(title, desc);
    achievementsList.append(card);
  });
};

const drawChart = () => {
  const ctx = focusChart.getContext("2d");
  const width = focusChart.width;
  const height = focusChart.height;
  ctx.clearRect(0, 0, width, height);

  const maxValue = Math.max(1, ...stats.focusByHour);
  const barWidth = width / stats.focusByHour.length;

  ctx.fillStyle = "#ffe4e6";
  ctx.fillRect(0, 0, width, height);

  stats.focusByHour.forEach((value, index) => {
    const barHeight = (value / maxValue) * (height - 30);
    const x = index * barWidth + 2;
    const y = height - barHeight - 20;
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(x, y, barWidth - 4, barHeight);
  });

  ctx.fillStyle = "#7f3a45";
  ctx.font = "12px sans-serif";
  ctx.fillText("专注分钟分布（按小时）", 12, height - 6);
};

const updateDisplay = () => {
  timerDisplay.textContent = formatDisplay(remainingSeconds);
};

const updateStatus = () => {
  if (modeSelect.value === "work") {
    timerStatus.textContent = "工作模式";
    return;
  }
  timerStatus.textContent = isLongRest ? "长休息模式" : "休息模式";
};

const getRestSeconds = () =>
  isLongRest ? toSeconds(longRestTimeInput.value) : toSeconds(restTimeInput.value);

const syncRemainingWithMode = () => {
  remainingSeconds =
    modeSelect.value === "work" ? toSeconds(workTimeInput.value) : getRestSeconds();
  updateDisplay();
  updateStatus();
};

const triggerShake = () => {
  if (!timerCard) return;
  timerCard.classList.remove("shake");
  void timerCard.offsetWidth;
  timerCard.classList.add("shake");
};

const addFocusStats = (seconds) => {
  const minutes = Math.round(seconds / 60);
  stats.completedRounds += 1;
  stats.focusMinutes += minutes;
  const hour = new Date().getHours();
  stats.focusByHour[hour] += minutes;
  saveStats(stats);
  renderStats();
};

const createTaskItem = (taskText) => {
  const item = document.createElement("li");
  item.className = "task-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const text = document.createElement("span");
  text.textContent = taskText;

  const completion = document.createElement("select");
  ["0%", "25%", "50%", "75%", "100%"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    completion.append(option);
  });

  const updateTaskState = () => {
    const isDone = checkbox.checked || completion.value === "100%";
    item.classList.toggle("completed", isDone);
  };

  checkbox.addEventListener("change", updateTaskState);
  completion.addEventListener("change", updateTaskState);

  item.append(checkbox, text, completion);
  tasksList.prepend(item);
  updateTaskState();

  return item;
};

const handleSessionComplete = () => {
  pauseTimer();
  if (modeSelect.value === "work") {
    workSessionsCompleted += 1;
    addFocusStats(toSeconds(workTimeInput.value));

    const cycleTarget = Math.max(1, Number(cyclesCountInput.value) || 1);
    isLongRest = workSessionsCompleted % cycleTarget === 0;

    modeSelect.value = "rest";
    syncRemainingWithMode();
    triggerShake();
    startTimer();
    return;
  }

  isLongRest = false;
  modeSelect.value = "work";
  syncRemainingWithMode();
  startTimer();
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
  if (modeSelect.value === "work") {
    const taskText = taskInput.value.trim();
    if (taskText) {
      createTaskItem(taskText);
      taskInput.value = "";
    }
  }
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

addTaskBtn.addEventListener("click", () => {
  const taskText = taskInput.value.trim();
  if (!taskText) return;
  createTaskItem(taskText);
  taskInput.value = "";
});

workTimeInput.addEventListener("change", () => {
  if (modeSelect.value === "work" && !isRunning) {
    syncRemainingWithMode();
  }
});

restTimeInput.addEventListener("change", () => {
  if (modeSelect.value === "rest" && !isRunning && !isLongRest) {
    syncRemainingWithMode();
  }
});

longRestTimeInput.addEventListener("change", () => {
  if (modeSelect.value === "rest" && !isRunning && isLongRest) {
    syncRemainingWithMode();
  }
});

cyclesCountInput.addEventListener("change", () => {
  const value = Number(cyclesCountInput.value) || 1;
  cyclesCountInput.value = Math.max(1, Math.min(12, value));
});

modeSelect.addEventListener("change", () => {
  isLongRest = false;
  resetTimer();
});

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

syncRemainingWithMode();
renderStats();
