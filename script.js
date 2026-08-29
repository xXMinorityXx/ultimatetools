import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp 
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

// 1. Clock & Schedule Engine
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Adjustable Custom Focus Timer
let timerInterval = null;
let timeRemaining = 1500; // default 25m

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
      alert("Focus Session Complete!");
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

// 3. FUNCTION 1: Exam & Test Countdown Radar
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
      <div class="exam-days-badge">${diffDays >= 0 ? `${diffDays} Days Left` : 'Passed'}</div>
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

// 4. FUNCTION 2: Active Recall Flashcards Deck
let flashcards = [
  { front: "Quadratic Formula", back: "x = (-b ± √(b² - 4ac)) / 2a" },
  { front: "Cellular Respiration Equation", back: "C6H12O6 + 6O2 → 6CO2 + 6H2O + ATP" }
];
let currentCardIndex = 0;

const flashcard = document.getElementById("flashcard");
const cardFront = document.getElementById("card-front");
const cardBack = document.getElementById("card-back");
const cardCounter = document.getElementById("card-counter");

function renderCard() {
  if (flashcards.length === 0) {
    cardFront.textContent = "No cards added yet.";
    cardBack.textContent = "Add a card below!";
    cardCounter.textContent = "0 / 0";
    return;
  }
  flashcard.classList.remove("flipped");
  setTimeout(() => {
    cardFront.textContent = flashcards[currentCardIndex].front;
    cardBack.textContent = flashcards[currentCardIndex].back;
    cardCounter.textContent = `${currentCardIndex + 1} / ${flashcards.length}`;
  }, 150);
}

document.getElementById("flip-card-btn").addEventListener("click", () => flashcard.classList.toggle("flipped"));
flashcard.addEventListener("click", () => flashcard.classList.toggle("flipped"));

document.getElementById("next-card-btn").addEventListener("click", () => {
  if (flashcards.length > 0) {
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    renderCard();
  }
});

document.getElementById("prev-card-btn").addEventListener("click", () => {
  if (flashcards.length > 0) {
    currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
    renderCard();
  }
});

document.getElementById("add-card-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const front = document.getElementById("card-front-input").value;
  const back = document.getElementById("card-back-input").value;
  flashcards.push({ front, back });
  currentCardIndex = flashcards.length - 1;
  renderCard();
  e.target.reset();
});

renderCard();

// 5. FUNCTION 3: Daily Hydration & Habit Tracker
const waterContainer = document.getElementById("water-cups-container");
let filledCups = parseInt(localStorage.getItem("water_count") || "0");

function renderWaterCups() {
  waterContainer.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const cup = document.createElement("div");
    cup.className = `water-cup ${i < filledCups ? "filled" : ""}`;
    cup.addEventListener("click", () => {
      filledCups = (i + 1 === filledCups) ? i : i + 1;
      localStorage.setItem("water_count", filledCups);
      document.getElementById("water-count-text").textContent = `${filledCups} / 8 Cups`;
      renderWaterCups();
    });
    waterContainer.appendChild(cup);
  }
  document.getElementById("water-count-text").textContent = `${filledCups} / 8 Cups`;
}
renderWaterCups();

// 6. Dock View Controller
const dockItems = document.querySelectorAll(".dock-item");
dockItems.forEach(item => {
  item.addEventListener("click", (e) => {
    dockItems.forEach(i => i.classList.remove("active"));
    const target = e.currentTarget;
    target.classList.add("active");
    document.getElementById("dashboard").className = `dashboard-container ${target.dataset.view}`;
  });
});