/* STATE MANAGEMENT */
let currentPage = 'home';
let tasks = JSON.parse(localStorage.getItem("ut_tasks_v4")) || [];
let history = JSON.parse(localStorage.getItem("ut_history_v1")) || [];

/* NAVIGATION */
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.dock-tile').forEach(b => b.classList.remove('active'));
  
  document.getElementById(pageId).classList.add('active-page');
  document.getElementById(`btn-${pageId}`).classList.add('active');
  currentPage = pageId;
}

/* CLOCK WIDGET */
let is24Hour = false;
function toggleTimeFormat() { is24Hour = !is24Hour; updateClock(); }
function updateClock() {
  const now = new Date();
  document.getElementById('clock-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour });
  document.getElementById('clock-date').innerText = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000); updateClock();

/* 8-FIELD TASK SYSTEM */
function addTask() {
  const name = document.getElementById("task-name").value.trim();
  const subject = document.getElementById("task-subject").value;
  const type = document.getElementById("task-type").value;
  const tier = document.getElementById("task-tier").value;
  const date = document.getElementById("task-date").value || "No date set";
  const diff = document.getElementById("task-difficulty").value;
  const estTime = document.getElementById("task-est-time").value;
  const notes = document.getElementById("task-notes").value;

  if (!name || !subject || !estTime) {
    alert("Please fill in at least the Name, Subject, and Estimated Time!");
    return;
  }

  const newTask = {
    id: Date.now(), // This acts as the unique ID AND the created timestamp!
    name, subject, type, tier, date, diff,
    estTime: parseInt(estTime),
    notes
  };

  tasks.push(newTask);
  saveData();
  renderTasks();
  
  // Clear inputs
  document.getElementById("task-name").value = "";
  document.getElementById("task-est-time").value = "";
  document.getElementById("task-notes").value = "";
}

function completeTask(id) {
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return;
  
  const task = tasks[taskIndex];
  const completedAt = Date.now();
  
  // Calculate Time
  const elapsedMs = completedAt - task.id; // time since created
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000)); // convert to minutes
  
  const historyEntry = { ...task, elapsedMinutes, completedAt };
  history.unshift(historyEntry); // Add to top of history
  
  tasks.splice(taskIndex, 1); // Remove from active planner
  saveData();
  renderTasks();
  renderHistory();
}

/* SAVING & RENDERING */
function saveData() {
  localStorage.setItem("ut_tasks_v4", JSON.stringify(tasks));
  localStorage.setItem("ut_history_v1", JSON.stringify(history));
}

function renderTasks() {
  const board = document.getElementById("tiered-task-board");
  if (tasks.length === 0) {
    board.innerHTML = "<p>No active assignments.</p>";
    return;
  }
  
  board.innerHTML = tasks.map(t => `
    <div class="task-item">
      <div>
        <strong>${t.name}</strong> (${t.tier})
        <div class="task-details">
          <span class="task-tag">${t.subject}</span>
          <span class="task-tag">${t.type}</span>
          Est: ${t.estTime}m | Due: ${t.date}
        </div>
        ${t.notes ? `<div style="font-size:0.8rem; margin-top:4px; font-style:italic;">Note: ${t.notes}</div>` : ''}
      </div>
      <button class="action-btn" onclick="completeTask(${t.id})">✓ Complete</button>
    </div>
  `).join('');
}

function renderHistory() {
  const board = document.getElementById("history-board");
  if (history.length === 0) {
    board.innerHTML = "<p>No completed assignments yet.</p>";
    return;
  }

  board.innerHTML = history.map(h => {
    const timeDiff = h.elapsedMinutes - h.estTime;
    let perfText = timeDiff > 0 ? `${timeDiff}m Over Target` : `${Math.abs(timeDiff)}m Under Target`;
    if (timeDiff === 0) perfText = "Exactly on target!";

    return `
    <div class="task-item" style="border-left: 4px solid ${timeDiff > 0 ? '#ef4444' : '#10b981'}">
      <div>
        <strong>${h.name}</strong>
        <div class="task-details">
          Target Time: <b>${h.estTime}m</b> | Actual Time: <b>${h.elapsedMinutes}m</b>
        </div>
        <div style="font-size:0.8rem; color: ${timeDiff > 0 ? '#fca5a5' : '#a7f3d0'}; mt-1;">
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

// Initial render
window.onload = () => {
  renderTasks();
  renderHistory();
};