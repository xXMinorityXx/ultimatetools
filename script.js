// ==========================================
// 1. FIREBASE SETUP
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your exact Firebase project settings
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
// 2. CLOUD TASK TRACKER
// ==========================================
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

const tasksCollection = collection(db, 'tasks');
const tasksQuery = query(tasksCollection, orderBy('createdAt', 'desc'));

// Save a task to Firebase Firestore
addTaskBtn.addEventListener('click', async function() {
    let newTaskText = taskInput.value.trim();
    if (newTaskText !== "") {
        taskInput.value = "";
        
        await addDoc(tasksCollection, {
            text: newTaskText,
            createdAt: new Date()
        });
    }
});

taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addTaskBtn.click();
});

// Sync data automatically in real time
onSnapshot(tasksQuery, (snapshot) => {
    taskList.innerHTML = "";
    
    snapshot.forEach((firebaseDoc) => {
        const taskData = firebaseDoc.data();
        const taskId = firebaseDoc.id;
        
        let li = document.createElement('li');
        li.innerText = taskData.text;

        let deleteBtn = document.createElement('button');
        deleteBtn.innerText = "X";
        deleteBtn.className = "delete-btn";
        
        deleteBtn.addEventListener('click', async function() {
            await deleteDoc(doc(db, 'tasks', taskId));
        });

        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
});


// ==========================================
// 3. LIVE CLOCK ENGINE
// ==========================================
function updateClock() {
    const now = new Date();
    
    let timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('time-display').innerText = timeString;

    let dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    document.getElementById('date-display').innerText = dateString;
}
updateClock();
setInterval(updateClock, 1000);


// ==========================================
// 4. POMODORO TIMER ENGINE
// ==========================================
let timerInterval;
let timeLeft = 25 * 60;
let isRunning = false;

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    if (seconds < 10) seconds = "0" + seconds; 
    timerDisplay.innerText = `${minutes}:${seconds}`;
}

startBtn.addEventListener('click', function() {
    if (isRunning) {
        clearInterval(timerInterval);
        startBtn.innerText = "Start";
        isRunning = false;
    } else {
        timerInterval = setInterval(function() {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                alert("Time for a break!");
            }
        }, 1000);
        startBtn.innerText = "Pause";
        isRunning = true;
    }
});

resetBtn.addEventListener('click', function() {
    clearInterval(timerInterval);
    timeLeft = 25 * 60;
    isRunning = false;
    startBtn.innerText = "Start";
    updateTimerDisplay();
});