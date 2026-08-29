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

// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyA3RzJKp5gq6a3JhYsI0D4jK3goBKm87go",
  authDomain: "student-dashboard-41b98.firebaseapp.com",
  projectId: "student-dashboard-41b98",
  storageBucket: "student-dashboard-41b98.firebasestorage.app",
  messagingSenderId: "908791794286",
  appId: "1:908791794286:web:1a432119daf9d61772f47f",
  measurementId: "G-Y39RMFW2W9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Precise ODD / EVEN Schedule Radar Engine
// Schedule breakdown according to provided table:
// ODD (Mon/Wed/Fri): Per 1, Recess, Per 3, Per 5, Lunch, Per 7
// EVEN (Tue/Thu):    Per 2, Recess, Per 4, Adv, Lunch, Per 6

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
  const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  
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

  // Weekend Mode (Sat / Sun)
  if (day === 0 || day === 6) {
    document.getElementById("schedule-day-type").textContent = "Weekend";
    document.getElementById("current-period").textContent = "Weekend Mode - Recharge & Review";
    document.getElementById("period-time-remaining").textContent = "Free Time";
    document.getElementById("schedule-progress").style.width = "100%";
    return;
  }

  // Determine ODD vs EVEN Day
  const isOddDay = (day === 1 || day === 3 || day === 5); // Mon, Wed, Fri
  const activeSchedule = isOddDay ? oddSchedule : evenSchedule;
  
  document.getElementById("schedule-day-type").textContent = isOddDay ? "ODD Day" : "EVEN Day";

  let currentBlock = null;

  for (let block of activeSchedule) {
    const [sH, sM] = block.start.split(":").map(Number);
    const [eH, eM] = block.end.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      currentBlock = block;
      const duration = endMins - startMins;
      const elapsed = currentMinutes - startMins;
      const percent = (elapsed / duration) * 100;

      document.getElementById("current-period").textContent = block.name;
      document.getElementById("period-time-remaining").textContent = `${endMins - currentMinutes}m remaining`;
      document.getElementById("schedule-progress").style.width = `${percent}%`;
      break;
    }
  }

  if (!currentBlock) {
    if (currentMinutes < 475) { // Before 7:55 AM
      document.getElementById("current-period").textContent = "Before School";
      document.getElementById("period-time-remaining").textContent = "Starts at 7:55 AM";
      document.getElementById("schedule-progress").style.width = "0%";
    } else { // After 1:57 PM
      document.getElementById("current-period").textContent = "School Dismissed";
      document.getElementById("period-time-remaining").textContent = "Free Time";
      document.getElementById("schedule-progress").style.width = "100%";
    }
  }
}

setInterval(updateClockAndSchedule, 1000);
updateClockAndSchedule();

// 2. Apple Magnifying Proximity Dock Logic
const dock = document.getElementById("liquid-dock");
const dockItems = document.querySelectorAll(".dock-item");

dock.addEventListener("mousemove", (e) => {
  const mouseX = e.clientX;

  dockItems.forEach((item) => {
    const itemRect = item.getBoundingClientRect();
    const itemCenter = itemRect.left + itemRect.width / 2;
    const distance = Math.abs(mouseX - itemCenter);
    
    const maxScale = 1.4;
    const effectRange = 110;
    
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

// 3. Web Audio Synth Ambient Noise Generator
let audioCtx, noiseNode;

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
  
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.04;
  
  noiseNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();
  return true;
}

document.getElementById("audio-white-noise").addEventListener("click", (e) => {
  const active = playNoise("white");
  e.target.classList.toggle("active", active);
});

document.getElementById("audio-pink-noise").addEventListener("click", (e) => {
  const active = playNoise("pink");
  e.target.classList.toggle("active", active);
});

// 4. Focus Timer & Study Log Sync
let timerInterval = null;
let timeRemaining = 1500;

const timerDisplay = document.getElementById("timer-display");

function renderTimer() {
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, "0");
  const secs = (timeRemaining % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${mins}:${secs}`;
}

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
  timeRemaining = 1500;
  renderTimer();
});

onSnapshot(collection(db, "study_logs"), (snapshot) => {
  let total = 0;
  snapshot.forEach(doc => total += (doc.data().durationMinutes || 0));
  document.getElementById("total-focus-time").textContent = total;
  document.getElementById("stat-weekly-focus").textContent = total;
});

// 5. Cloud Task Tracker & Weekly Overview Intelligence
const taskForm = document.getElementById("add-task-form");
const taskList = document.getElementById("task-list");
let activeFilter = "all";

onSnapshot(query(collection(db, "tasks"), orderBy("createdAt", "desc")), (snapshot) => {
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

    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.innerHTML = `
      <div>
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
});

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("task-input");
  const category = document.getElementById("task-category-select").value;
  await addDoc(collection(db, "tasks"), {
    text: input.value,
    category,
    completed: false,
    createdAt: serverTimestamp()
  });
  input.value = "";
});

// Task Filter Buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    activeFilter = e.target.dataset.filter;
  });
});

// 6. Quick Links Portal Deck
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

// 7. Cloud Scratchpad with Realtime Debounce
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