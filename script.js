import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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

// 1. Clock Engine
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Multi-Note Hub Engine (Create, Switch, Edit & Delete Notes)
let notesList = JSON.parse(localStorage.getItem("liquid_multi_notes") || "null") || [
  { id: "note_1", title: "AP Chem Cheat Sheet", body: "PV = nRT\nMolarity = moles / liters\npH = -log[H+]" },
  { id: "note_2", title: "History Essay Outline", body: "1. Thesis statement\n2. Industrial revolution impacts\n3. Primary source quotes" }
];
let activeNoteId = notesList[0]?.id || "note_1";

const tabStrip = document.getElementById("notes-tab-strip");
const noteTitleInput = document.getElementById("active-note-title");
const noteBodyInput = document.getElementById("active-note-body");

function saveNotesToStorage() {
  localStorage.setItem("liquid_multi_notes", JSON.stringify(notesList));
}

function renderNotesHub() {
  tabStrip.innerHTML = "";
  notesList.forEach(note => {
    const pill = document.createElement("button");
    pill.className = `note-pill ${note.id === activeNoteId ? "active" : ""}`;
    pill.textContent = note.title || "Untitled Note";
    pill.addEventListener("click", () => {
      activeNoteId = note.id;
      renderNotesHub();
    });
    tabStrip.appendChild(pill);
  });

  const activeNote = notesList.find(n => n.id === activeNoteId);
  if (activeNote) {
    noteTitleInput.value = activeNote.title;
    noteBodyInput.value = activeNote.body;
  } else {
    noteTitleInput.value = "";
    noteBodyInput.value = "";
  }
}

document.getElementById("create-new-note-btn").addEventListener("click", () => {
  const newId = "note_" + Date.now();
  const newNote = { id: newId, title: "New Note", body: "" };
  notesList.push(newNote);
  activeNoteId = newId;
  saveNotesToStorage();
  renderNotesHub();
});

noteTitleInput.addEventListener("input", (e) => {
  const activeNote = notesList.find(n => n.id === activeNoteId);
  if (activeNote) {
    activeNote.title = e.target.value;
    saveNotesToStorage();
    // Update strip pill without full re-render
    const activePill = tabStrip.querySelector(".note-pill.active");
    if (activePill) activePill.textContent = e.target.value || "Untitled Note";
  }
});

noteBodyInput.addEventListener("input", (e) => {
  const activeNote = notesList.find(n => n.id === activeNoteId);
  if (activeNote) {
    activeNote.body = e.target.value;
    saveNotesToStorage();
  }
});

document.getElementById("delete-active-note-btn").addEventListener("click", () => {
  if (notesList.length <= 1) {
    alert("You must keep at least one note.");
    return;
  }
  notesList = notesList.filter(n => n.id !== activeNoteId);
  activeNoteId = notesList[0].id;
  saveNotesToStorage();
  renderNotesHub();
});

renderNotesHub();

// 3. XP & Gamified Streak System
let userXP = parseInt(localStorage.getItem("user_xp") || "350");

function updateXP(amount) {
  userXP += amount;
  localStorage.setItem("user_xp", userXP);
  
  const xpBar = document.getElementById("xp-progress-bar");
  const xpText = document.getElementById("xp-text");
  const rankBadge = document.getElementById("rank-badge");

  const levelXP = 500;
  const currentLevelProgress = userXP % levelXP;
  const percentage = (currentLevelProgress / levelXP) * 100;
  
  xpBar.style.width = `${percentage}%`;
  xpText.textContent = `${currentLevelProgress} / ${levelXP} XP`;

  if (userXP >= 1000) rankBadge.textContent = "Academic Legend 👑";
  else if (userXP >= 500) rankBadge.textContent = "Grindmaster ⚡";
  else rankBadge.textContent = "Scholar Elite 🎓";
}

document.querySelectorAll(".quest-check").forEach(chk => {
  chk.addEventListener("change", (e) => {
    const xpVal = parseInt(e.target.dataset.xp || "50");
    if (e.target.checked) {
      updateXP(xpVal);
    } else {
      updateXP(-xpVal);
    }
  });
});

// 4. Adjustable Custom Timer Logic
let timerInterval = null;
let timeRemaining = 1500;

function renderTimer() {
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, "0");
  const secs = (timeRemaining % 60).toString().padStart(2, "0");
  document.getElementById("timer-display").textContent = `${mins}:${secs}`;
}

function setTimerMinutes(mins) {
  clearInterval(timerInterval);
  timerInterval = null;
  timeRemaining = Math.max(1, parseInt(mins)) * 60;
  renderTimer();
}

document.querySelectorAll(".preset-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    const mins = parseInt(e.target.dataset.mins);
    document.getElementById("custom-minutes-input").value = mins;
    setTimerMinutes(mins);
  });
});

document.getElementById("apply-custom-time-btn").addEventListener("click", () => {
  const customMins = document.getElementById("custom-minutes-input").value;
  setTimerMinutes(customMins);
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
      updateXP(100); // Reward XP on completion
      alert("Focus Session Complete! +100 XP Earned ⚡");
    }
  }, 1000);
});

document.getElementById("pause-timer-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

document.getElementById("reset-timer-btn").addEventListener("click", () => {
  const mins = document.getElementById("custom-minutes-input").value || 25;
  setTimerMinutes(mins);
});

// 5. Exam Countdown Radar
const examForm = document.getElementById("add-exam-form");
const examsList = document.getElementById("exams-list");

onSnapshot(collection(db, "exams"), (snapshot) => {
  examsList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const exam = docSnap.data();
    const today = new Date();
    const targetDate = new Date(exam.date);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const div = document.createElement("div");
    div.className = "exam-card";
    div.innerHTML = `
      <div>
        <strong>${exam.title}</strong>
        <div class="muted-text-sm">${exam.date}</div>
      </div>
      <span class="liquid-pill">${diffDays >= 0 ? `${diffDays} Days` : 'Passed'}</span>
    `;
    examsList.appendChild(div);
  });
});

examForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("exam-title-input").value;
  const date = document.getElementById("exam-date-input").value;
  await addDoc(collection(db, "exams"), { title, date });
  e.target.reset();
});

// 6. Flashcard Deck
const flashcard = document.getElementById("flashcard");
document.getElementById("flip-card-btn").addEventListener("click", () => flashcard.classList.toggle("flipped"));
flashcard.addEventListener("click", () => flashcard.classList.toggle("flipped"));

// 7. Dock View Controller
const dockItems = document.querySelectorAll(".dock-item");
dockItems.forEach(item => {
  item.addEventListener("click", (e) => {
    dockItems.forEach(i => i.classList.remove("active"));
    const target = e.currentTarget;
    target.classList.add("active");
    document.getElementById("dashboard").className = `dashboard-container ${target.dataset.view}`;
  });
});