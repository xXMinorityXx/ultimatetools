import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA3RzJKp5gq6a3JhYsI0D4jK3goBKm87go",
  authDomain: "student-dashboard-41b98.firebaseapp.com",
  projectId: "student-dashboard-41b98",
  storageBucket: "student-dashboard-41b98.firebasestorage.app",
  messagingSenderId: "908791794286",
  appId: "1:908791794286:web:1a432119daf9d61772f47f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. ODD / EVEN Bell Schedule Engine
const oddSchedule = [
  { name: "Passing Period", start: "07:55", end: "08:00" },
  { name: "Period 1", start: "08:00", end: "09:17" },
  { name: "Recess", start: "09:17", end: "09:27" },
  { name: "Period 3", start: "09:32", end: "10:47" },
  { name: "Period 5", start: "10:52", end: "12:07" },
  { name: "Lunch", start: "12:07", end: "12:37" },
  { name: "Period 7", start: "12:42", end: "13:57" }
];

const evenSchedule = [
  { name: "Passing Period", start: "07:55", end: "08:00" },
  { name: "Period 2", start: "08:00", end: "09:17" },
  { name: "Recess", start: "09:17", end: "09:27" },
  { name: "Period 4", start: "09:32", end: "10:47" },
  { name: "Advisory", start: "10:52", end: "12:07" },
  { name: "Lunch", start: "12:07", end: "12:37" },
  { name: "Period 6", start: "12:42", end: "13:57" }
];

function updateClockAndSchedule() {
  const now = new Date();
  const day = now.getDay();
  
  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, { 
    weekday: 'short', month: 'short', day: 'numeric' 
  });

  const hours = now.getHours();
  let greeting = "Good Evening";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";
  document.getElementById("greeting").textContent = greeting;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (day === 0 || day === 6) {
    document.getElementById("schedule-day-type").textContent = "Weekend";
    document.getElementById("current-period").textContent = "Weekend Mode - Free Time";
    document.getElementById("period-time-remaining").textContent = "Weekend";
    document.getElementById("schedule-progress").style.width = "100%";
    document.getElementById("next-period-preview").textContent = "Next: Monday Period 1";
    return;
  }

  const isOddDay = (day === 1 || day === 3 || day === 5);
  const activeSchedule = isOddDay ? oddSchedule : evenSchedule;
  
  document.getElementById("schedule-day-type").textContent = isOddDay ? "ODD Day" : "EVEN Day";

  let currentBlockIndex = -1;

  for (let i = 0; i < activeSchedule.length; i++) {
    const block = activeSchedule[i];
    const [sH, sM] = block.start.split(":").map(Number);
    const [eH, eM] = block.end.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      currentBlockIndex = i;
      const duration = endMins - startMins;
      const elapsed = currentMinutes - startMins;
      const percent = (elapsed / duration) * 100;

      document.getElementById("current-period").textContent = block.name;
      document.getElementById("period-time-remaining").textContent = `${endMins - currentMinutes}m left`;
      document.getElementById("schedule-progress").style.width = `${percent}%`;

      if (i + 1 < activeSchedule.length) {
        document.getElementById("next-period-preview").textContent = `Next: ${activeSchedule[i + 1].name} (${activeSchedule[i + 1].start})`;
      } else {
        document.getElementById("next-period-preview").textContent = "Next: Dismissal / Free Time";
      }
      break;
    }
  }

  if (currentBlockIndex === -1) {
    if (currentMinutes < 475) {
      document.getElementById("current-period").textContent = "Before School";
      document.getElementById("period-time-remaining").textContent = "Starts 7:55 AM";
      document.getElementById("schedule-progress").style.width = "0%";
      document.getElementById("next-period-preview").textContent = `Next: ${activeSchedule[0].name}`;
    } else {
      document.getElementById("current-period").textContent = "Classes Done for Today";
      document.getElementById("period-time-remaining").textContent = "Free Time";
      document.getElementById("schedule-progress").style.width = "100%";
      document.getElementById("next-period-preview").textContent = "All classes completed";
    }
  }
}

setInterval(updateClockAndSchedule, 1000);
updateClockAndSchedule();

// 2. Grade Hub & Unweighted GPA Engine
const defaultClasses = [
  { name: "Period 1", grade: "A" },
  { name: "Period 2", grade: "A-" },
  { name: "Period 3", grade: "B+" },
  { name: "Period 4", grade: "A" },
  { name: "Period 5 / Adv", grade: "A" },
  { name: "Period 6", grade: "A-" },
  { name: "Period 7", grade: "A" }
];

const gradePoints = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0, "F": 0.0
};

function renderGrades() {
  const container = document.getElementById("grades-grid");
  const stored = JSON.parse(localStorage.getItem("student_grades") || JSON.stringify(defaultClasses));
  
  container.innerHTML = "";
  let totalPts = 0;

  stored.forEach((item, index) => {
    totalPts += gradePoints[item.grade] || 4.0;
    const row = document.createElement("div");
    row.className = "grade-row";
    row.innerHTML = `
      <span class="grade-row-title">${item.name}</span>
      <select class="grade-select" data-index="${index}">
        ${Object.keys(gradePoints).map(g => `<option value="${g}" ${g === item.grade ? 'selected' : ''}>${g}</option>`).join('')}
      </select>
    `;
    container.appendChild(row);
  });

  const gpa = (totalPts / stored.length).toFixed(2);
  document.getElementById("gpa-val").textContent = gpa;

  document.querySelectorAll(".grade-select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const idx = e.target.dataset.index;
      stored[idx].grade = e.target.value;
      localStorage.setItem("student_grades", JSON.stringify(stored));
      renderGrades();
    });
  });
}

renderGrades();

// 3. Apple Magnifying Dock Logic
const dock = document.getElementById("liquid-dock");
const dockItems = document.querySelectorAll(".dock-item");

dock.addEventListener("mousemove", (e) => {
  const mouseX = e.clientX;
  dockItems.forEach((item) => {
    const itemRect = item.getBoundingClientRect();
    const itemCenter = itemRect.left + itemRect.width / 2;
    const distance = Math.abs(mouseX - itemCenter);
    const maxScale = 1.35;
    const effectRange = 100;
    
    if (distance < effectRange) {
      const scale = 1 + (maxScale - 1) * Math.cos((distance / effectRange) * (Math.PI / 2));
      item.style.transform = `scale(${scale})`;
    } else {
      item.style.transform = "scale(1)";
    }
  });
});

dock.addEventListener("mouseleave", () => {
  dockItems.forEach(item => item.style.transform = "scale(1)");
});

dockItems.forEach(item => {
  item.addEventListener("click", (e) => {
    dockItems.forEach(i => i.classList.remove("active"));
    const target = e.currentTarget;
    target.classList.add("active");
    document.getElementById("dashboard").className = `dashboard-container ${target.dataset.view}`;
  });
});

// 4. Ambient Web Audio Synthesizer Engine with Volume Control
let audioCtx, noiseNode, gainNode;

function playNoise(type = "white") {
  if (noiseNode) {
    noiseNode.stop();
    noiseNode = null;
    return false;
  }
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = type === "white" ? Math.random() * 2 - 1 : (Math.random() * 2 - 1) * 0.35;
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  
  gainNode = audioCtx.createGain();
  const vol = document.getElementById("volume-slider").value;
  gainNode.gain.value = parseFloat(vol);
  
  noiseNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();
  return true;
}

document.getElementById("volume-slider").addEventListener("input", (e) => {
  if (gainNode) {
    gainNode.gain.value = parseFloat(e.target.value);
  }
});

document.getElementById("audio-white-noise").addEventListener("click", (e) => {
  document.getElementById("audio-pink-noise").classList.remove("active");
  const active = playNoise("white");
  e.target.classList.toggle("active", active);
});

document.getElementById("audio-pink-noise").addEventListener("click", (e) => {
  document.getElementById("audio-white-noise").classList.remove("active");
  const active = playNoise("pink");
  e.target.classList.toggle("active", active);
});

// 5. Pomodoro Focus Timer
let timerInterval = null;
let timeRemaining = 1500;
const timerDisplay = document.getElementById("timer-display");

function renderTimer() {
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, "0");
  const secs = (timeRemaining % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${mins}:${secs}`;
}

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    clearInterval(timerInterval);
    timerInterval = null;
    timeRemaining = parseInt(e.target.dataset.time);
    renderTimer();
  });
});

document.getElementById("start-timer-btn").addEventListener("click", () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--;
      renderTimer();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      addDoc(collection(db, "study_logs"), { durationMinutes: 25, timestamp: serverTimestamp() });
    }
  }, 1000);
});

document.getElementById("pause-timer-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

document.getElementById("reset-timer-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  const activeMode = document.querySelector(".mode-btn.active");
  timeRemaining = activeMode ? parseInt(activeMode.dataset.time) : 1500;
  renderTimer();
});

onSnapshot(collection(db, "study_logs"), (snapshot) => {
  let total = 0;
  snapshot.forEach(doc => total += (doc.data().durationMinutes || 0));
  document.getElementById("total-focus-time").textContent = total;
  document.getElementById("stat-weekly-focus").textContent = total;
});

// 6. Mission Control Tasks & Search Engine
const taskForm = document.getElementById("add-task-form");
const taskList = document.getElementById("task-list");
const searchInput = document.getElementById("task-search-input");
let activeFilter = "all";
let searchTerm = "";

function renderTasks(snapshot) {
  taskList.innerHTML = "";
  let doneCount = 0;
  let pendingCount = 0;

  snapshot.forEach((docSnap) => {
    const task = docSnap.data();
    const id = docSnap.id;

    if (task.completed) doneCount++;
    else pendingCount++;

    if (activeFilter === "active" && task.completed) return;
    if (activeFilter === "completed" && !task.completed) return;
    if (searchTerm && !task.text.toLowerCase().includes(searchTerm)) return;

    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.innerHTML = `
      <div class="task-left">
        <span class="priority-indicator priority-${task.priority || 'medium'}"></span>
        <input type="checkbox" ${task.completed ? "checked" : ""} class="toggle-task" data-id="${id}">
        <span>${task.text}</span>
        <span class="task-tag">${task.category || 'General'}</span>
      </div>
      <button class="delete-btn" data-id="${id}">×</button>
    `;
    taskList.appendChild(li);
  });

  document.getElementById("stat-completed-tasks").textContent = doneCount;
  document.getElementById("stat-pending-tasks").textContent = pendingCount;

  const total = doneCount + pendingCount;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  document.getElementById("target-percentage-text").textContent = `${pct}%`;
  document.getElementById("weekly-progress-fill").style.width = `${pct}%`;

  document.querySelectorAll(".toggle-task").forEach(chk => {
    chk.addEventListener("change", async (e) => {
      await updateDoc(doc(db, "tasks", e.target.dataset.id), { completed: e.target.checked });
    });
  });

  document.querySelectorAll(".task-item .delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      await deleteDoc(doc(db, "tasks", e.target.dataset.id));
    });
  });
}

let latestTaskSnapshot = null;
onSnapshot(query(collection(db, "tasks"), orderBy("createdAt", "desc")), (snapshot) => {
  latestTaskSnapshot = snapshot;
  if (latestTaskSnapshot) renderTasks(latestTaskSnapshot);
});

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.toLowerCase();
  if (latestTaskSnapshot) renderTasks(latestTaskSnapshot);
});

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("task-input");
  const category = document.getElementById("task-category-select").value;
  const priority = document.getElementById("task-priority-select").value;

  await addDoc(collection(db, "tasks"), {
    text: input.value,
    category,
    priority,
    completed: false,
    createdAt: serverTimestamp()
  });
  input.value = "";
});

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    activeFilter = e.target.dataset.filter;
    if (latestTaskSnapshot) renderTasks(latestTaskSnapshot);
  });
});

// 7. Quick Link Portals
const linksGrid = document.getElementById("links-grid");
onSnapshot(collection(db, "quick_links"), (snapshot) => {
  linksGrid.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const linkEl = document.createElement("div");
    linkEl.className = "link-tile";
    linkEl.innerHTML = `
      <a href="${data.url}" target="_blank" style="color: inherit; text-decoration: none;">${data.title}</a>
      <button class="delete-btn" data-id="${docSnap.id}">×</button>
    `;
    linksGrid.appendChild(linkEl);
  });

  document.querySelectorAll("#links-grid .delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      await deleteDoc(doc(db, "quick_links", e.target.dataset.id));
    });
  });
});

document.getElementById("add-link-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("link-title").value;
  const url = document.getElementById("link-url").value;
  await addDoc(collection(db, "quick_links"), { title, url });
  e.target.reset();
});

// 8. Smart Cloud Scratchpad
const scratchpad = document.getElementById("scratchpad");
const wordCountEl = document.getElementById("word-count");
const scratchpadRef = doc(db, "scratchpad", "main_note");

onSnapshot(scratchpadRef, (snapshot) => {
  if (snapshot.exists() && document.activeElement !== scratchpad) {
    scratchpad.value = snapshot.data().content || "";
    updateWordCount();
  }
});

function updateWordCount() {
  const text = scratchpad.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCountEl.textContent = `${words} words`;
}

let saveDebounce;
scratchpad.addEventListener("input", () => {
  updateWordCount();
  document.getElementById("scratchpad-status").textContent = "Saving...";
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(async () => {
    await setDoc(scratchpadRef, { content: scratchpad.value, updatedAt: serverTimestamp() }, { merge: true });
    document.getElementById("scratchpad-status").textContent = "Synced";
  }, 1000);
});

document.getElementById("clear-scratchpad-btn").addEventListener("click", async () => {
  scratchpad.value = "";
  updateWordCount();
  await setDoc(scratchpadRef, { content: "", updatedAt: serverTimestamp() }, { merge: true });
});