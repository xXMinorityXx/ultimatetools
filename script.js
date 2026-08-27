/* NAVIGATION */
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.dock-tile').forEach(b => b.classList.remove('active'));
  document.getElementById(pageId).classList.add('active-page');
  document.getElementById(`btn-${pageId}`).classList.add('active');
}

/* NUDGE */
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
function saveQuickNote() { localStorage.setItem('ut_note_v2', document.getElementById('quick-note').value); }

/* CALCULATOR */
let calcString = "";
function pressCalc(val) { calcString += val; document.getElementById('calc-display').innerText = calcString; }
function clearCalc() { calcString = ""; document.getElementById('calc-display').innerText = "0"; }
function backspaceCalc() { calcString = calcString.slice(0, -1); document.getElementById('calc-display').innerText = calcString || "0"; }
function solveCalc() {
  try {
    let result = eval(calcString);
    document.getElementById('calc-history').innerHTML += `<div style="margin-bottom:8px;">${calcString} = <b>${result}</b></div>`;
    calcString = result.toString();
    document.getElementById('calc-display').innerText = calcString;
  } catch (e) {
    document.getElementById('calc-display').innerText = "Error";
    calcString = "";
  }
}

/* 8-FIELD TASK SYSTEM & HISTORY */
let tasks = JSON.parse(localStorage.getItem("ut_tasks_v5")) || [];
let history = JSON.parse(localStorage.getItem("ut_history_v5")) || [];

function addTask() {
  // Capture all 8 fields
  const name = document.getElementById("task-name").value.trim();
  const subject = document.getElementById("task-subject").value || "General";
  const type = document.getElementById("task-type").value || "Task";
  const tier = document.getElementById("task-tier").value;
  const date = document.getElementById("task-date").value || "No date";
  const diff = document.getElementById("task-difficulty").value || "N/A";
  const estTime = document.getElementById("task-est-time").value;
  const notes = document.getElementById("task-notes").value;

  if (!name || !estTime) {
    alert("Please fill in at least the Task Name and Estimated Time!");
    return;
  }

  const newTask = {
    id: Date.now(), // Unique ID & creation timestamp
    name, subject, type, tier, date, diff, 
    estTime: parseInt(estTime), 
    notes
  };

  tasks.push(newTask);
  saveData();
  renderTasks();
  
  // Clear main inputs
  document.getElementById("task-name").value = "";
  document.getElementById("task-est-time").value = "";
  document.getElementById("task-notes").value = "";
}

function completeTask(id) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  
  const task = tasks[idx];
  // Calculate exactly how long it took in minutes (min 1 minute)
  const elapsedMs = Date.now() - task.id;
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  
  history.unshift({ ...task, elapsedMinutes });
  tasks.splice(idx, 1);
  saveData(); 
  renderTasks(); 
  renderHistory();
}

function saveData() {
  localStorage.setItem("ut_tasks_v5", JSON.stringify(tasks));
  localStorage.setItem("ut_history_v5", JSON.stringify(history));
}

function renderTasks() {
  const board = document.getElementById("tiered-task-board");
  if (tasks.length === 0) {
    board.innerHTML = "<p style='color:var(--text-sub)'>No active assignments.</p>";
    document.getElementById("home-priority-tasks").innerHTML = "No active assignments.";
    return;
  }
  
  const html = tasks.map(t => `
    <div class="task-item">
      <div>
        <strong>${t.name}</strong> <span style="font-size:0.8rem; color:var(--text-sub);">(${t.tier})</span>
        <div class="task-details">
          <span class="task-tag">${t.subject}</span>
          <span class="task-tag">${t.type}</span>
          Est: ${t.estTime}m | Due: ${t.date}
        </div>
        ${t.notes ? `<div style="font-size:0.8rem; margin-top:6px; font-style:italic; color:var(--text-sub);">📝 ${t.notes}</div>` : ''}
      </div>
      <button class="action-btn" onclick="completeTask(${t.id})">✓ Done</button>
    </div>
  `).join('');
  
  board.innerHTML = html;
  document.getElementById("home-priority-tasks").innerHTML = html;
}

function renderHistory() {
  const board = document.getElementById("history-board");
  if (history.length === 0) {
    board.innerHTML = "<p style='color:var(--text-sub)'>No completed assignments yet.</p>";
    return;
  }

  board.innerHTML = history.map(h => {
    const timeDiff = h.elapsedMinutes - h.estTime;
    let perfText = timeDiff > 0 ? `${timeDiff}m Over Target` : `${Math.abs(timeDiff)}m Under Target`;
    if (timeDiff === 0) perfText = "Exactly on target!";
    const color = timeDiff > 0 ? '#ef4444' : '#10b981';

    return `
    <div class="task-item" style="border-left: 4px solid ${color}">
      <div>
        <strong>${h.name}</strong> <span style="font-size:0.8rem; color:var(--text-sub);">(${h.subject} - ${h.type})</span>
        <div class="task-details">
          Target Time: <b>${h.estTime}m</b> | Actual Time: <b>${h.elapsedMinutes}m</b>
        </div>
        <div style="font-size:0.85rem; color: ${color}; margin-top:4px;">
          Performance: ${perfText}
        </div>
      </div>
    </div>
  `}).join('');
}

function clearHistory() { 
  history = []; 
  saveData(); 
  renderHistory(); 
}

/* INITIALIZE */
window.onload = () => {
  updateClock(); 
  updateTimerDisplay(); 
  renderTasks(); 
  renderHistory();
  document.getElementById('quick-note').value = localStorage.getItem('ut_note_v2') || "";
};