// ==========================================
// 1. FIREBASE INITIALIZATION
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, setDoc, updateDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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


// ==========================================
// 2. LIVE CLOCK & DYNAMIC GREETING ENGINE
// ==========================================
function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    
    // Dynamic Greeting
    let greeting = "Good Morning";
    if (hours >= 12 && hours < 17) greeting = "Good Afternoon";
    else if (hours >= 17 && hours < 22) greeting = "Good Evening";
    else if (hours >= 22 || hours < 5) greeting = "Night Owls Focus";
    document.getElementById('greeting-display').innerText = greeting;

    // Time & Date
    document.getElementById('time-display').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date-display').innerText = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
updateClock();
setInterval(updateClock, 1000);


// ==========================================
// 3. POMODORO TIMER & STUDY STATS LOGS
// ==========================================
let timerInterval = null;
let timeLeft = 25 * 60;
let isRunning = false;

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const statsTimeDisplay = document.getElementById('stats-time');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

startBtn.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerInterval);
        startBtn.innerText = "Start";
        isRunning = false;
    } else {
        startBtn.innerText = "Pause";
        isRunning = true;
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                logStudySession(25);
                alert("Pomodoro complete! Great focus session.");
                timeLeft = 25 * 60;
                startBtn.innerText = "Start";
                isRunning = false;
                updateTimerDisplay();
            }
        }, 1000);
    }
});

resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timeLeft = 25 * 60;
    isRunning = false;
    startBtn.innerText = "Start";
    updateTimerDisplay();
});

// Save completed session to Firestore
async function logStudySession(minutes) {
    await addDoc(collection(db, 'study_logs'), {
        duration: minutes,
        createdAt: new Date()
    });
}

// Calculate total focus minutes for today
onSnapshot(collection(db, 'study_logs'), (snapshot) => {
    let totalMinutes = 0;
    const todayStr = new Date().toDateString();

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.createdAt && new Date(data.createdAt.toDate()).toDateString() === todayStr) {
            totalMinutes += data.duration || 0;
        }
    });

    statsTimeDisplay.innerText = totalMinutes;
});


// ==========================================
// 4. CLOUD SCRATCHPAD (DEBOUNCED AUTO-SAVE)
// ==========================================
const scratchpad = document.getElementById('scratchpad-input');
const saveStatus = document.getElementById('save-status');
let saveTimeout = null;

// Listen to changes in Cloud
onSnapshot(doc(db, 'scratchpad', 'main_note'), (docSnap) => {
    if (docSnap.exists() && document.activeElement !== scratchpad) {
        scratchpad.value = docSnap.data().content || "";
    }
});

// Save to Cloud when user types
scratchpad.addEventListener('input', () => {
    saveStatus.innerText = "Typing...";
    clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
        saveStatus.innerText = "Saving...";
        await setDoc(doc(db, 'scratchpad', 'main_note'), {
            content: scratchpad.value,
            updatedAt: new Date()
        });
        saveStatus.innerText = "Synced";
    }, 800);
});


// ==========================================
// 5. TASK TRACKER & FILTER ENGINE
// ==========================================
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    if (!text) return;
    
    taskInput.value = "";
    await addDoc(collection(db, 'tasks'), {
        text: text,
        category: taskCategory.value,
        completed: false,
        createdAt: new Date()
    });
});

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTaskBtn.click();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks(latestTaskSnapshot);
    });
});

let latestTaskSnapshot = null;

onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snapshot) => {
    latestTaskSnapshot = snapshot;
    renderTasks(snapshot);
});

function renderTasks(snapshot) {
    if (!snapshot) return;
    taskList.innerHTML = "";

    snapshot.forEach(docSnap => {
        const task = docSnap.data();
        const id = docSnap.id;

        if (currentFilter === 'active' && task.completed) return;
        if (currentFilter === 'done' && !task.completed) return;

        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        li.innerHTML = `
            <div class="task-left">
                <input type="checkbox" ${task.completed ? 'checked' : ''} class="task-check">
                <span class="task-text">${task.text}</span>
                <span class="task-tag">${task.category}</span>
            </div>
            <button class="delete-link" title="Delete">✕</button>
        `;

        // Toggle Done
        li.querySelector('.task-check').addEventListener('change', async (e) => {
            await updateDoc(doc(db, 'tasks', id), { completed: e.target.checked });
        });

        // Delete Task
        li.querySelector('.delete-link').addEventListener('click', async () => {
            await deleteDoc(doc(db, 'tasks', id));
        });

        taskList.appendChild(li);
    });
}


// ==========================================
// 6. DYNAMIC QUICK LINKS MANAGER
// ==========================================
const linkContainer = document.getElementById('link-buttons');
const addLinkBtn = document.getElementById('add-link-btn');

const defaultLinks = [
    { title: "Classroom", url: "https://classroom.google.com", color: "blue" },
    { title: "Docs", url: "https://docs.google.com", color: "pink" },
    { title: "Slides", url: "https://slides.google.com", color: "orange" },
    { title: "Gmail", url: "https://mail.google.com", color: "green" }
];

onSnapshot(collection(db, 'quick_links'), async (snapshot) => {
    // Initialize default links if collection is brand new
    if (snapshot.empty) {
        for (let l of defaultLinks) {
            await addDoc(collection(db, 'quick_links'), l);
        }
        return;
    }

    linkContainer.innerHTML = "";
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;

        const div = document.createElement('div');
        div.className = "link-card";
        div.innerHTML = `
            <a href="${data.url}" target="_blank" class="vivid-btn ${data.color || 'purple'}" style="flex:1;">${data.title}</a>
            <button class="delete-link" title="Remove Link">✕</button>
        `;

        div.querySelector('.delete-link').addEventListener('click', async () => {
            await deleteDoc(doc(db, 'quick_links', id));
        });

        linkContainer.appendChild(div);
    });
});

addLinkBtn.addEventListener('click', async () => {
    const title = prompt("Enter site name (e.g., GitHub):");
    let url = prompt("Enter URL (e.g., https://github.com):");
    if (!title || !url) return;
    if (!url.startsWith('http')) url = 'https://' + url;

    const colors = ["blue", "pink", "orange", "green", "purple"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    await addDoc(collection(db, 'quick_links'), { title, url, color: randomColor });
});


// ==========================================
// 7. FLOATING BOTTOM DOCK NAVIGATION
// ==========================================
const dockTabs = document.querySelectorAll('.dock-tab');
const glassPanels = document.querySelectorAll('.glass-panel');

dockTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        dockTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const selectedTab = tab.dataset.tab;

        glassPanels.forEach(panel => {
            if (selectedTab === 'all') {
                panel.style.display = 'flex';
            } else {
                panel.style.display = panel.dataset.panel === selectedTab ? 'flex' : 'none';
            }
        });
    });
});