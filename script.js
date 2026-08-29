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

// 1. Live Clock Engine
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  
  let greeting = "Good Evening";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";

  document.getElementById("greeting").textContent = greeting;
  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
  });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Pomodoro Focus Timer
let timerInterval = null;
let timeRemaining = 1500; // 25 minutes

const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-timer-btn");
const pauseBtn = document.getElementById("pause-timer-btn");
const resetBtn = document.getElementById("reset-timer-btn");

function renderTimer() {
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, "0");
  const secs = (timeRemaining % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${mins}:${secs}`;
}

startBtn.addEventListener("click", () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--;
      renderTimer();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      alert("Pomodoro complete! Focus time logged.");
      addDoc(collection(db, "study_logs"), { durationMinutes: 25, timestamp: serverTimestamp() });
    }
  }, 1000);
});

pauseBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

resetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timeRemaining = 1500;
  renderTimer();
});

// Sync Total Focus Minutes
onSnapshot(collection(db, "study_logs"), (snapshot) => {
  let total = 0;
  snapshot.forEach(doc => total += (doc.data().durationMinutes || 0));
  document.getElementById("total-focus-time").textContent = total;
});

// 3. Quick Links Manager
const linksGrid = document.getElementById("links-grid");
const linkForm = document.getElementById("add-link-form");

onSnapshot(collection(db, "quick_links"), (snapshot) => {
  linksGrid.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const linkEl = document.createElement("div");
    linkEl.className = "link-tile";
    linkEl.innerHTML = `
      <a href="${data.url}" target="_blank" style="color: inherit; text-decoration: none;">${data.title}</a>
      <button class="delete-link-btn" data-id="${docSnap.id}">×</button>
    `;
    linksGrid.appendChild(linkEl);
  });

  document.querySelectorAll(".delete-link-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      await deleteDoc(doc(db, "quick_links", e.target.dataset.id));
    });
  });
});

linkForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("link-title").value;
  const url = document.getElementById("link-url").value;
  await addDoc(collection(db, "quick_links"), { title, url });
  linkForm.reset();
});

// 4. Cloud Scratchpad (Realtime + Auto-save)
const scratchpad = document.getElementById("scratchpad");
const scratchpadStatus = document.getElementById("scratchpad-status");
const scratchpadRef = doc(db, "scratchpad", "main_note");

onSnapshot(scratchpadRef, (snapshot) => {
  if (snapshot.exists() && document.activeElement !== scratchpad) {
    scratchpad.value = snapshot.data().content || "";
  }
});

let debounceTimer;
scratchpad.addEventListener("input", () => {
  scratchpadStatus.textContent = "Saving...";
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await setDoc(scratchpadRef, { content: scratchpad.value, updatedAt: serverTimestamp() }, { merge: true });
    scratchpadStatus.textContent = "Synced";
  }, 1000);
});

// 5. Cloud Task Tracker
const taskForm = document.getElementById("add-task-form");
const taskList = document.getElementById("task-list");
let activeFilter = "all";

const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

onSnapshot(tasksQuery, (snapshot) => {
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
        <span class="task-tag">${task.category}</span>
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
    category: category,
    completed: false,
    createdAt: serverTimestamp()
  });
  input.value = "";
});

// Task Filter Switching
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    activeFilter = e.target.dataset.filter;
  });
});

// 6. Navigation Dock View Manager
const dashboard = document.getElementById("dashboard");
document.querySelectorAll(".dock-item").forEach(item => {
  item.addEventListener("click", (e) => {
    const targetView = e.currentTarget.dataset.view;
    
    document.querySelectorAll(".dock-item").forEach(i => i.classList.remove("active"));
    e.currentTarget.classList.add("active");

    dashboard.className = `dashboard-container ${targetView}`;
  });
});