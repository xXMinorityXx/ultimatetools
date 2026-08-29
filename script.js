import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// =========================================================================
// 1. DOCK VIEW NAVIGATION ENGINE
// =========================================================================
function initDockNavigation() {
  const dockItems = document.querySelectorAll(".dock-item");
  const dashboard = document.getElementById("dashboard");
  if (!dockItems.length || !dashboard) return;

  dockItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetBtn = e.currentTarget;
      const targetView = targetBtn.getAttribute("data-view");

      dockItems.forEach(btn => btn.classList.remove("active"));
      targetBtn.classList.add("active");
      dashboard.className = `dashboard-container ${targetView}`;
    });
  });
}
initDockNavigation();

// =========================================================================
// 2. THEME SWITCHER ENGINE
// =========================================================================
const themeDots = document.querySelectorAll(".theme-dot");
const savedTheme = localStorage.getItem("liquid_theme") || "cyber";
document.documentElement.setAttribute("data-theme", savedTheme);

themeDots.forEach(dot => {
  if (dot.dataset.theme === savedTheme) dot.classList.add("active");
  else dot.classList.remove("active");

  dot.addEventListener("click", (e) => {
    themeDots.forEach(d => d.classList.remove("active"));
    const selectedTheme = e.target.dataset.theme;
    e.target.classList.add("active");
    document.documentElement.setAttribute("data-theme", selectedTheme);
    localStorage.setItem("liquid_theme", selectedTheme);
    playSynthSound("click");
  });
});

// =========================================================================
// 3. SYNTH AUDIO FX & AMBIENT NOISE GENERATOR ENGINE
// =========================================================================
let audioCtx = null;
let ambientNoiseNode = null;
let isAudioPlaying = false;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSynthSound(type) {
  try {
    initAudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "click") {
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === "chime") {
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === "levelup") {
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }
  } catch (e) {
    console.warn("AudioContext blocked or unavailable:", e);
  }
}

// Synthesized Ambient Rain (Pink/Brown Noise)
function toggleAmbientNoise() {
  initAudioContext();
  const audioBtn = document.getElementById("ambient-audio-btn");
  const audioStatus = document.getElementById("audio-status");

  if (isAudioPlaying) {
    if (ambientNoiseNode) ambientNoiseNode.stop();
    isAudioPlaying = false;
    audioStatus.textContent = "OFF";
    audioBtn.classList.remove("btn-primary");
    audioBtn.classList.add("btn-glass");
  } else {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02; // Brown noise filter logic
      lastOut = output[i];
    }

    ambientNoiseNode = audioCtx.createBufferSource();
    ambientNoiseNode.buffer = noiseBuffer;
    ambientNoiseNode.loop = true;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);

    ambientNoiseNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    ambientNoiseNode.start();

    isAudioPlaying = true;
    audioStatus.textContent = "ON";
    audioBtn.classList.remove("btn-glass");
    audioBtn.classList.add("btn-primary");
  }
}

document.getElementById("ambient-audio-btn")?.addEventListener("click", toggleAmbientNoise);

// =========================================================================
// 4. CLOCK ENGINE
// =========================================================================
function updateClock() {
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");
  if (!clockEl || !dateEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString();
  dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// =========================================================================
// 5. MULTI-NOTE VAULT WITH SEARCH, TAGS & LIVE MARKDOWN
// =========================================================================
let notesList = JSON.parse(localStorage.getItem("liquid_multi_notes") || "null") || [
  { id: "note_1", title: "AP Chem Cheat Sheet", tags: "#chemistry, #formulas", body: "## Ideal Gas Law\n`PV = nRT`\n- **Molarity**: moles / liters\n- **pH**: -log[H+]" },
  { id: "note_2", title: "History Essay Outline", tags: "#history, #essay", body: "# Industrial Revolution\n1. **Thesis**: Urbanization shaped labor laws.\n2. Primary source quotes." }
];
let activeNoteId = notesList[0]?.id || "note_1";

const tabStrip = document.getElementById("notes-tab-strip");
const noteTitleInput = document.getElementById("active-note-title");
const noteTagsInput = document.getElementById("active-note-tags");
const noteBodyInput = document.getElementById("active-note-body");
const notePreviewBox = document.getElementById("active-note-preview");
const noteSearchInput = document.getElementById("note-search-input");
let isMarkdownPreview = false;

function parseMarkdown(text) {
  let html = text
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`(.*)`/gim, '<code>$1</code>')
    .replace(/^\- (.*$)/gim, '• $1<br/>');
  return html.replace(/\n/g, '<br/>');
}

function saveNotesToStorage() {
  localStorage.setItem("liquid_multi_notes", JSON.stringify(notesList));
}

function renderNotesHub() {
  if (!tabStrip) return;
  tabStrip.innerHTML = "";
  const query = noteSearchInput?.value.toLowerCase() || "";

  const filtered = notesList.filter(n => 
    n.title.toLowerCase().includes(query) || 
    n.tags.toLowerCase().includes(query) || 
    n.body.toLowerCase().includes(query)
  );

  filtered.forEach(note => {
    const pill = document.createElement("button");
    pill.className = `note-pill ${note.id === activeNoteId ? "active" : ""}`;
    pill.textContent = note.title || "Untitled Note";
    pill.addEventListener("click", () => {
      activeNoteId = note.id;
      playSynthSound("click");
      renderNotesHub();
    });
    tabStrip.appendChild(pill);
  });

  const activeNote = notesList.find(n => n.id === activeNoteId);
  if (activeNote) {
    if (noteTitleInput) noteTitleInput.value = activeNote.title;
    if (noteTagsInput) noteTagsInput.value = activeNote.tags;
    if (noteBodyInput) noteBodyInput.value = activeNote.body;
    if (notePreviewBox) notePreviewBox.innerHTML = parseMarkdown(activeNote.body);
  }
}

document.getElementById("toggle-markdown-btn")?.addEventListener("click", (e) => {
  isMarkdownPreview = !isMarkdownPreview;
  if (isMarkdownPreview) {
    e.target.textContent = "Edit Raw";
    noteBodyInput.classList.add("hidden");
    notePreviewBox.classList.remove("hidden");
    const activeNote = notesList.find(n => n.id === activeNoteId);
    if (activeNote) notePreviewBox.innerHTML = parseMarkdown(activeNote.body);
  } else {
    e.target.textContent = "Preview Markdown";
    noteBodyInput.classList.remove("hidden");
    notePreviewBox.classList.add("hidden");
  }
});

document.getElementById("create-new-note-btn")?.addEventListener("click", () => {
  const newId = "note_" + Date.now();
  notesList.push({ id: newId, title: "New Note", tags: "#general", body: "" });
  activeNoteId = newId;
  saveNotesToStorage();
  renderNotesHub();
  playSynthSound("chime");
});

noteTitleInput?.addEventListener("input", (e) => {
  const activeNote = notesList.find(n => n.id === activeNoteId);
  if (activeNote) {
    activeNote.title = e.target.value;
    saveNotesToStorage();
    const activePill = tabStrip.querySelector(".note-pill.active");
    if (activePill) activePill.textContent = e.target.value || "Untitled Note";
  }
});

noteTagsInput?.addEventListener("input", (e) => {
  const activeNote = notesList.find(n => n.id === activeNoteId);
  if (activeNote) {
    activeNote.tags = e.target.value;
    saveNotesToStorage();
  }
});

noteBodyInput?.addEventListener("input", (e) => {
  const activeNote = notesList.find(n => n.id === activeNoteId);
  if (activeNote) {
    activeNote.body = e.target.value;
    saveNotesToStorage();
  }
});

noteSearchInput?.addEventListener("input", renderNotesHub);

document.getElementById("delete-active-note-btn")?.addEventListener("click", () => {
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

// =========================================================================
// 6. MULTI-DECK FLASHCARDS WITH MASTERY SCORING
// =========================================================================
let decks = JSON.parse(localStorage.getItem("liquid_decks") || "null") || {
  bio: {
    title: "Biology 101",
    cards: [
      { front: "Mitochondria Function", back: "Powerhouse of the cell; produces ATP via respiration.", mastery: 80 },
      { front: "Ribosome", back: "Site of protein synthesis.", mastery: 70 }
    ]
  },
  history: {
    title: "AP US History",
    cards: [
      { front: "19th Amendment", back: "Granted women the right to vote in 1920.", mastery: 90 },
      { front: "New Deal", back: "FDR policies to recover from the Great Depression.", mastery: 60 }
    ]
  }
};

let currentDeckId = "bio";
let currentCardIndex = 0;

const deckSelector = document.getElementById("deck-selector-dropdown");
const cardFront = document.getElementById("card-front");
const cardBack = document.getElementById("card-back");
const cardCounter = document.getElementById("card-counter");
const deckMasteryBadge = document.getElementById("deck-mastery-badge");

function renderDeck() {
  const deck = decks[currentDeckId];
  if (!deck || !deck.cards.length) {
    if (cardFront) cardFront.textContent = "Deck Empty";
    if (cardBack) cardBack.textContent = "Add a new card below!";
    if (cardCounter) cardCounter.textContent = "0 / 0";
    if (deckMasteryBadge) deckMasteryBadge.textContent = "Mastery: 0%";
    return;
  }

  if (currentCardIndex >= deck.cards.length) currentCardIndex = 0;
  const card = deck.cards[currentCardIndex];

  if (cardFront) cardFront.textContent = card.front;
  if (cardBack) cardBack.textContent = card.back;
  if (cardCounter) cardCounter.textContent = `Card ${currentCardIndex + 1} / ${deck.cards.length}`;

  const avgMastery = Math.round(deck.cards.reduce((acc, c) => acc + (c.mastery || 50), 0) / deck.cards.length);
  if (deckMasteryBadge) deckMasteryBadge.textContent = `Mastery: ${avgMastery}%`;
}

deckSelector?.addEventListener("change", (e) => {
  currentDeckId = e.target.value;
  currentCardIndex = 0;
  renderDeck();
});

document.getElementById("flip-card-btn")?.addEventListener("click", () => {
  document.getElementById("flashcard")?.classList.toggle("flipped");
  playSynthSound("click");
});

document.getElementById("next-card-btn")?.addEventListener("click", () => {
  document.getElementById("flashcard")?.classList.remove("flipped");
  currentCardIndex++;
  renderDeck();
  playSynthSound("click");
});

document.getElementById("prev-card-btn")?.addEventListener("click", () => {
  document.getElementById("flashcard")?.classList.remove("flipped");
  currentCardIndex = Math.max(0, currentCardIndex - 1);
  renderDeck();
  playSynthSound("click");
});

document.querySelectorAll(".rate-card-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const rating = e.target.dataset.rating;
    const card = decks[currentDeckId]?.cards[currentCardIndex];
    if (!card) return;

    if (rating === "easy") { card.mastery = Math.min(100, (card.mastery || 50) + 15); updateXP(25); }
    else if (rating === "good") { card.mastery = Math.min(100, (card.mastery || 50) + 5); updateXP(15); }
    else { card.mastery = Math.max(0, (card.mastery || 50) - 10); updateXP(5); }

    localStorage.setItem("liquid_decks", JSON.stringify(decks));
    renderDeck();
    playSynthSound("chime");
  });
});

document.getElementById("add-card-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const front = document.getElementById("new-card-front")?.value;
  const back = document.getElementById("new-card-back")?.value;
  if (front && back && decks[currentDeckId]) {
    decks[currentDeckId].cards.push({ front, back, mastery: 50 });
    localStorage.setItem("liquid_decks", JSON.stringify(decks));
    e.target.reset();
    renderDeck();
    playSynthSound("chime");
  }
});

renderDeck();

// =========================================================================
// 7. TASK DRAG-AND-DROP REORDERING & PRIORITY ENGINE
// =========================================================================
let taskListArray = JSON.parse(localStorage.getItem("liquid_tasks") || "null") || [
  { id: "task_1", text: "AP European History DBQ Essay", priority: "high", completed: false },
  { id: "task_2", text: "Chemistry Lab Report", priority: "medium", completed: false },
  { id: "task_3", text: "Math Exercises 4.1", priority: "low", completed: true }
];

const taskListContainer = document.getElementById("task-list");

function saveTasks() {
  localStorage.setItem("liquid_tasks", JSON.stringify(taskListArray));
}

function renderTasks() {
  if (!taskListContainer) return;
  taskListContainer.innerHTML = "";

  taskListArray.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = `task-item task-priority-${task.priority}`;
    li.draggable = true;
    li.dataset.index = index;

    li.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <input type="checkbox" class="task-check" ${task.completed ? "checked" : ""} />
        <span style="${task.completed ? "text-decoration: line-through; opacity:0.5;" : ""}">${task.text}</span>
      </div>
      <span class="muted-text-sm" style="cursor:grab;">⋮⋮</span>
    `;

    // Checkbox toggle
    li.querySelector(".task-check").addEventListener("change", (e) => {
      task.completed = e.target.checked;
      if (task.completed) updateXP(30);
      saveTasks();
      renderTasks();
    });

    // Drag events
    li.addEventListener("dragstart", (e) => {
      li.classList.add("dragging");
      e.dataTransfer.setData("text/plain", index);
    });

    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    taskListContainer.appendChild(li);
  });
}

taskListContainer?.addEventListener("dragover", (e) => {
  e.preventDefault();
  const draggingItem = taskListContainer.querySelector(".dragging");
  const siblings = [...taskListContainer.querySelectorAll(".task-item:not(.dragging)")];
  const nextSibling = siblings.find(sibling => e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2);
  taskListContainer.insertBefore(draggingItem, nextSibling);
});

taskListContainer?.addEventListener("drop", (e) => {
  e.preventDefault();
  const newOrder = [];
  taskListContainer.querySelectorAll(".task-item").forEach(el => {
    const oldIdx = parseInt(el.dataset.index);
    newOrder.push(taskListArray[oldIdx]);
  });
  taskListArray = newOrder;
  saveTasks();
  renderTasks();
});

document.getElementById("add-task-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const textInput = document.getElementById("task-input");
  const priorityInput = document.getElementById("task-priority-input");
  if (textInput && textInput.value) {
    taskListArray.push({ id: "task_" + Date.now(), text: textInput.value, priority: priorityInput.value, completed: false });
    textInput.value = "";
    saveTasks();
    renderTasks();
    playSynthSound("chime");
  }
});

renderTasks();

// =========================================================================
// 8. XP, GAMIFIED STREAK & LEVEL-UP MODAL ENGINE
// =========================================================================
let userXP = parseInt(localStorage.getItem("user_xp") || "350");

function updateXP(amount) {
  const oldLevel = Math.floor(userXP / 500);
  userXP += amount;
  localStorage.setItem("user_xp", userXP);

  const newLevel = Math.floor(userXP / 500);
  const xpBar = document.getElementById("xp-progress-bar");
  const xpText = document.getElementById("xp-text");
  const rankBadge = document.getElementById("rank-badge");

  const currentLevelProgress = userXP % 500;
  if (xpBar) xpBar.style.width = `${(currentLevelProgress / 500) * 100}%`;
  if (xpText) xpText.textContent = `${currentLevelProgress} / 500 XP`;

  let rankName = "Scholar Elite 🎓";
  if (userXP >= 1000) rankName = "Academic Legend 👑";
  else if (userXP >= 500) rankName = "Grindmaster ⚡";
  if (rankBadge) rankBadge.textContent = rankName;

  if (newLevel > oldLevel) {
    playSynthSound("levelup");
    const modal = document.getElementById("level-up-modal");
    const modalTitle = document.getElementById("level-up-title");
    if (modalTitle) modalTitle.textContent = `You reached ${rankName}!`;
    modal?.classList.remove("hidden");
  }
}

document.getElementById("close-level-up-btn")?.addEventListener("click", () => {
  document.getElementById("level-up-modal")?.classList.add("hidden");
});

document.querySelectorAll(".quest-check").forEach(chk => {
  chk.addEventListener("change", (e) => {
    const xpVal = parseInt(e.target.dataset.xp || "50");
    updateXP(e.target.checked ? xpVal : -xpVal);
    if (e.target.checked) playSynthSound("chime");
  });
});

// =========================================================================
// 9. FOCUS TIMER ENGINE
// =========================================================================
let timerInterval = null;
let timeRemaining = 1500;

function renderTimer() {
  const timerDisplay = document.getElementById("timer-display");
  if (!timerDisplay) return;
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, "0");
  const secs = (timeRemaining % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${mins}:${secs}`;
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
    const customInput = document.getElementById("custom-minutes-input");
    if (customInput) customInput.value = mins;
    setTimerMinutes(mins);
    playSynthSound("click");
  });
});

document.getElementById("apply-custom-time-btn")?.addEventListener("click", () => {
  const customMins = document.getElementById("custom-minutes-input")?.value || 25;
  setTimerMinutes(customMins);
});

document.getElementById("start-timer-btn")?.addEventListener("click", () => {
  if (timerInterval) return;
  playSynthSound("click");
  timerInterval = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--;
      renderTimer();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      updateXP(100);
      playSynthSound("levelup");
      alert("Focus Session Complete! +100 XP Earned ⚡");
    }
  }, 1000);
});

document.getElementById("pause-timer-btn")?.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  playSynthSound("click");
});

document.getElementById("reset-timer-btn")?.addEventListener("click", () => {
  const mins = document.getElementById("custom-minutes-input")?.value || 25;
  setTimerMinutes(mins);
  playSynthSound("click");
});

// =========================================================================
// 10. FIREBASE EXAM RADAR INTEGRATION
// =========================================================================
try {
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

  const examForm = document.getElementById("add-exam-form");
  const examsList = document.getElementById("exams-list");

  if (examsList) {
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
  }

  examForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("exam-title-input")?.value;
    const date = document.getElementById("exam-date-input")?.value;
    if (title && date) {
      await addDoc(collection(db, "exams"), { title, date });
      e.target.reset();
      playSynthSound("chime");
    }
  });
} catch (error) {
  console.warn("Firebase offline or awaiting rules configuration:", error);
}