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
  appId: "1:908791794286:web:1a432119daf9d61772f47f",
  measurementId: "G-Y39RMFW2W9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Live Clock & Class Schedule Engine
const schoolSchedule = [
  { name: "Period 1: CS / Tech", start: "08:00", end: "09:15" },
  { name: "Period 2: Math", start: "09:20", end: "10:35" },
  { name: "Period 3: Science", start: "10:40", end: "11:55" },
  { name: "Lunch Break", start: "11:55", end: "12:40" },
  { name: "Period 4: English", start: "12:45", end: "14:00" },
  { name: "Focus & Self Study", start: "14:00", end: "17:00" }
];

function updateClockAndSchedule() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, { 
    weekday: 'short', month: 'short', day: 'numeric' 
  });

  const hours = now.getHours();
  let greeting = "Good Evening";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";
  document.getElementById("greeting").textContent = greeting;

  // Calculate Schedule Position
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let activePeriod = null;

  for (let p of schoolSchedule) {
    const [sH, sM] = p.start.split(":").map(Number);
    const [eH, eM] = p.end.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      activePeriod = p;
      const totalDuration = endMins - startMins;
      const elapsed = currentMinutes - startMins;
      const progressPercent = (elapsed / totalDuration) * 100;

      document.getElementById("current-period").textContent = p.name;
      document.getElementById("period-time-remaining").textContent = `${endMins - currentMinutes}m left`;
      document.getElementById("schedule-progress").style.width = `${progressPercent}%`;
      break;
    }
  }

  if (!activePeriod) {
    document.getElementById("current-period").textContent = "Classes Done for Today";
    document.getElementById("period-time-remaining").textContent = "Free Time";
    document.getElementById("schedule-progress").style.width = "100%";
  }
}
setInterval(updateClockAndSchedule, 1000);
updateClockAndSchedule();

// 2. Liquid Proximity Dock Magnification Effect (macOS style)
const dock = document.getElementById("liquid-dock");
const dockItems = document.querySelectorAll(".dock-item");

dock.addEventListener("mousemove", (e) => {
  const dockRect = dock.getBoundingClientRect();
  const mouseX = e.clientX;

  dockItems.forEach((item) => {
    const itemRect = item.getBoundingClientRect();
    const itemCenter = itemRect.left + itemRect.width / 2;
    const distance = Math.abs(mouseX - itemCenter);
    
    // Proximity scaling formula
    const maxScale = 1.45;
    const effectRange = 120;
    
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

// View Toggle Engine
dockItems.forEach(item => {
  item.addEventListener("click", (e) => {
    dockItems.forEach(i => i.classList.remove("active"));
    const target = e.currentTarget;
    target.classList.add("active");
    document.getElementById("dashboard").className = `dashboard-container ${target.dataset.view}`;
  });
});

// 3. Web Audio Synth Noise Generator (Ambient Audio Player)
let audioCtx, noiseNode;

function playWhiteNoise(type = "white") {
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
    output[i] = type === "white" ? Math.random() * 2 - 1 : (Math.random() * 2 - 1) * 0.3;
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.05; // Low comfortable volume
  
  noiseNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();
  return true;
}

document.getElementById("audio-white-noise").addEventListener("click", (e) => {
  const playing = playWhiteNoise("white");
  e.target.classList.toggle("active", playing);
});

document.getElementById("audio-pink-noise").addEventListener("click", (e) => {
  const playing = playWhiteNoise("pink");
  e.target.classList.toggle("active", playing);
});

// 4. Focus Timer Engine
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
});

// 5. Cloud Scratchpad with Word Counter
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

// 6. Firestore Task Tracker & Quick Links
const taskForm = document.getElementById("add-task-form");
const taskList = document.getElementById("task-list");
let activeFilter = "all";

onSnapshot(query(collection(db, "tasks"), orderBy("createdAt", "desc")), (snapshot) => {
  taskList.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const task = docSnap.data();
    const id = docSnap.id;

    if (activeFilter === "active" && task.completed) return;
    if (activeFilter === "completed" && !task.completed) return;

    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.innerHTML = `
      <div>
        <input type="checkbox" ${task.completed ? "checked" : ""} class="toggle-task" data-id="${id}">
        <span>${task.text}</span>
      </div>
      <button class="delete-btn" data-id="${id}">×</button>
    `;
    taskList.appendChild(li);
  });

  document.querySelectorAll(".toggle-task").forEach(chk => {
    chk.addEventListener("change", async (e) => {
      await updateDoc(doc(db, "tasks", e.target.dataset.id), { completed: e.target.checked });
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
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

// Quick Links
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