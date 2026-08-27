/* NAVIGATION */
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.dock-tile').forEach(b => b.classList.remove('active'));
  document.getElementById(pageId).classList.add('active-page');
  document.getElementById(`btn-${pageId}`).classList.add('active');
}

/* NUDGE POPUP */
function hideNudge() { document.getElementById('focus-nudge-popup').style.display = 'none'; }

/* CLOCK */
let is24Hour = false;
function toggleTimeFormat() { is24Hour = !is24Hour; updateClock(); }
function updateClock() {
  const now = new Date();
  document.getElementById('clock-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
  document.getElementById('clock-date').innerText = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);

/* TIMER */
let timeLeft = 25 * 60;
let timerInt = null;
function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  document.getElementById('home-timer-val').innerText = `${m}:${s}`;
}
function startTimer() {
  if (timerInt) return;
  timerInt = setInterval(() => { if (timeLeft > 0) { timeLeft--; updateTimerDisplay(); } }, 1000);
}
function pauseTimer() { clearInterval(timerInt); timerInt = null; }
function resetTimer() { pauseTimer(); timeLeft = 25 * 60; updateTimerDisplay(); }

/* NOTES */
function saveQuickNote() { localStorage.setItem('ut_note', document.getElementById('quick-note').value); }

/* CALCULATOR */
let calcString = "";
function pressCalc(val) { calcString += val; document.getElementById('calc-display').innerText = calcString; }
function clearCalc() { calcString = ""; document.getElementById('calc-display').innerText = "0"; }
function backspaceCalc() { calcString = calcString.slice(0, -1); document.getElementById('calc-display').innerText = calcString || "0"; }
function solveCalc() {
  try {
    let result = eval(calcString);
    document.getElementById('calc-history').innerHTML += `<div>${calcString} = ${result}</div>`;
    calcString = result.toString();
    document.getElementById('calc-display').innerText = calcString;
  } catch (e) {
    document.getElementById('calc-display').innerText = "Error";
    calcString = "";
  }
}

/* TASKS & HISTORY */
let tasks = JSON.parse(localStorage.getItem("ut_tasks")) || [];
let history = JSON.parse(localStorage.getItem("ut_history")) || [];

function addTask() {
  const name = document.getElementById("task-name").value;
  const est = document.getElementById("task-est-time").value;
  if (!name || !est) return alert("Need name and estimated time!");
  
  tasks.push({ id: Date.now(), name, estTime: parseInt(est), tier: document.getElementById("task-tier").value });
  saveTasks(); renderTasks();
}

function completeTask(id) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  
  const elapsed = Math.max(1, Math.round((Date.now() - tasks[idx].id) / 60000));
  history.unshift({ ...tasks[idx], elapsed });
  tasks.splice(idx, 1);
  saveTasks(); renderTasks(); renderHistory();
}

function saveTasks() {
  localStorage.setItem("ut_tasks", JSON.stringify(tasks));
  localStorage.setItem("ut_history", JSON.stringify(history));
}

function renderTasks() {
  const board = document.getElementById("tiered-task-board");
  board.innerHTML = tasks.map(t => `<div class="task-item"><span>${t.name} (Est: ${t.estTime}m)</span> <button class="action-btn" onclick="completeTask(${t.id})">Done</button></div>`).join('');
  document.getElementById("home-priority-tasks").innerHTML = board.innerHTML || "No tasks!";
}

function renderHistory() {
  document.getElementById("history-board").innerHTML = history.map(h => `<div class="task-item"><span>${h.name} - Est: ${h.estTime}m | Actual: ${h.elapsed}m</span></div>`).join('');
}
function clearHistory() { history = []; saveTasks(); renderHistory(); }

/* INITIALIZE */
window.onload = () => {
  updateClock(); updateTimerDisplay(); renderTasks(); renderHistory();
  document.getElementById('quick-note').value = localStorage.getItem('ut_note') || "";
};