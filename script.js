import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyA3RzJKp5gq6a3JhYsI0D4jK3goBKm87go",
  authDomain: "student-dashboard-41b98.firebaseapp.com",
  projectId: "student-dashboard-41b98",
  storageBucket: "student-dashboard-41b98.firebasestorage.app",
  messagingSenderId: "908791794286",
  appId: "1:908791794286:web:1a432119daf9d61772f47f",
  measurementId: "G-Y39RMFW2W9"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


// ============================================================
// DOM HELPERS
// ============================================================

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [...document.querySelectorAll(selector)];


const els = {
  dayLabel: $("#dayLabel"),
  greeting: $("#greeting"),
  syncStatus: $("#syncStatus"),

  signInBtn: $("#signInBtn"),
  signOutBtn: $("#signOutBtn"),
  userChip: $("#userChip"),
  userAvatar: $("#userAvatar"),
  userName: $("#userName"),

  clockTime: $("#clockTime"),
  clockAmPm: $("#clockAmPm"),
  clockDate: $("#clockDate"),
  clockToday: $("#clockToday"),
  clockDone: $("#clockDone"),

  timerDisplay: $("#timerDisplay"),
  timerCaption: $("#timerCaption"),
  timerModePill: $("#timerModePill"),
  timerStart: $("#timerStart"),
  timerReset: $("#timerReset"),

  focusToday: $("#focusToday"),
  focusStreak: $("#focusStreak"),
  focusSessions: $("#focusSessions"),

  analyticsToday: $("#analyticsToday"),
  analyticsWeek: $("#analyticsWeek"),
  analyticsStreak: $("#analyticsStreak"),
  analyticsCompletion: $("#analyticsCompletion"),
  nextMilestone: $("#nextMilestone"),
  clearStudyLogsBtn: $("#clearStudyLogsBtn"),

  linkGrid: $("#linkGrid"),
  addLinkBtn: $("#addLinkBtn"),

  scratchpad: $("#scratchpad"),
  noteSaveState: $("#noteSaveState"),
  noteCount: $("#noteCount"),
  clearNotesBtn: $("#clearNotesBtn"),

  taskForm: $("#taskForm"),
  taskText: $("#taskText"),
  taskCategory: $("#taskCategory"),
  taskPriority: $("#taskPriority"),
  taskDue: $("#taskDue"),
  taskList: $("#taskList"),
  taskCountBadge: $("#taskCountBadge"),
  categoryFilter: $("#categoryFilter"),

  modalBackdrop: $("#modalBackdrop"),
  linkModal: $("#linkModal"),
  linkForm: $("#linkForm"),
  linkTitle: $("#linkTitle"),
  linkUrl: $("#linkUrl"),
  linkColor: $("#linkColor"),
  closeLinkModal: $("#closeLinkModal"),
  cancelLinkBtn: $("#cancelLinkBtn"),

  toast: $("#toast"),
  navSlider: $("#navSlider")
};


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;

let unsubscribeFns = [];

let tasks = [];
let studyLogs = [];
let quickLinks = [];

let taskStatusFilter = "active";
let taskCategoryFilter = "all";

let noteSaveTimer = null;


// ============================================================
// DEFAULT QUICK LINKS
// ============================================================

const defaultLinks = [
  {
    title: "Classroom",
    url: "https://classroom.google.com/",
    color: "blue",
    icon: "C"
  },
  {
    title: "Docs",
    url: "https://docs.google.com/document/",
    color: "pink",
    icon: "D"
  },
  {
    title: "Slides",
    url: "https://slides.google.com/",
    color: "orange",
    icon: "S"
  },
  {
    title: "Gmail",
    url: "https://mail.google.com/",
    color: "green",
    icon: "G"
  }
];


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function showToast(message) {
  if (!els.toast) return;

  els.toast.textContent = message;
  els.toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2600);
}


function setSyncStatus(message, good = false) {
  if (!els.syncStatus) return;

  els.syncStatus.textContent = message;

  els.syncStatus.style.color = good
    ? "var(--green)"
    : "";
}


function userCollection(name) {
  if (!currentUser) {
    throw new Error("You must be signed in.");
  }

  return collection(
    db,
    "users",
    currentUser.uid,
    name
  );
}


function userDoc(collectionName, id) {
  if (!currentUser) {
    throw new Error("You must be signed in.");
  }

  return doc(
    db,
    "users",
    currentUser.uid,
    collectionName,
    id
  );
}


function localDateKey(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function parseStoredDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function niceDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}


// ============================================================
// LIVE CLOCK
// ============================================================

function updateClock() {
  const now = new Date();

  const hour = now.getHours();

  const hour12 = hour % 12 || 12;

  const minute = String(
    now.getMinutes()
  ).padStart(2, "0");

  els.clockTime.textContent =
    `${hour12}:${minute}`;

  els.clockAmPm.textContent =
    hour >= 12 ? "PM" : "AM";

  els.clockDate.textContent =
    niceDate(now);

  els.dayLabel.textContent =
    new Intl.DateTimeFormat(undefined, {
      weekday: "long"
    })
      .format(now)
      .toUpperCase();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  }

  els.greeting.textContent = greeting;
}

updateClock();

setInterval(updateClock, 1000);


// ============================================================
// POMODORO TIMER
// ============================================================

const timerConfig = {
  focus: {
    seconds: 25 * 60,
    label: "Deep work",
    pill: "FOCUS"
  },

  short: {
    seconds: 5 * 60,
    label: "Reset your brain",
    pill: "SHORT BREAK"
  },

  long: {
    seconds: 15 * 60,
    label: "Long recovery",
    pill: "LONG BREAK"
  }
};

let timerMode = "focus";

let timerSeconds =
  timerConfig.focus.seconds;

let timerRunning = false;

let timerInterval = null;


function renderTimer() {
  const minutes =
    Math.floor(timerSeconds / 60);

  const seconds =
    timerSeconds % 60;

  els.timerDisplay.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  els.timerCaption.textContent =
    timerConfig[timerMode].label;

  els.timerModePill.textContent =
    timerConfig[timerMode].pill;

  $$("[data-timer-mode]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.timerMode === timerMode
    );
  });

  els.timerStart.textContent =
    timerRunning ? "Pause" : "Start";
}


function setTimerMode(mode) {
  timerRunning = false;

  clearInterval(timerInterval);

  timerInterval = null;

  timerMode = mode;

  timerSeconds =
    timerConfig[mode].seconds;

  renderTimer();
}


async function finishTimer() {
  timerRunning = false;

  clearInterval(timerInterval);

  timerInterval = null;

  renderTimer();


  // Only log completed Focus sessions.
  if (
    timerMode === "focus" &&
    currentUser
  ) {
    try {
      await addDoc(
        userCollection("study_logs"),
        {
          duration: 25,
          timestamp: serverTimestamp()
        }
      );

      showToast(
        "Focus session saved to your cloud history."
      );

    } catch (error) {
      console.error(error);

      showToast(
        "Session finished, but the cloud log failed."
      );
    }
  }


  // Automatically switch to a short break.
  if (timerMode === "focus") {
    setTimerMode("short");
  } else {
    setTimerMode("focus");
  }
}


function toggleTimer() {
  timerRunning = !timerRunning;

  clearInterval(timerInterval);

  timerInterval = null;


  if (timerRunning) {

    timerInterval = setInterval(() => {

      timerSeconds--;

      if (timerSeconds <= 0) {

        timerSeconds = 0;

        renderTimer();

        finishTimer();

      } else {

        renderTimer();

      }

    }, 1000);
  }


  renderTimer();
}


function resetTimer() {
  timerRunning = false;

  clearInterval(timerInterval);

  timerInterval = null;

  timerSeconds =
    timerConfig[timerMode].seconds;

  renderTimer();
}


$$("[data-timer-mode]").forEach(button => {

  button.addEventListener(
    "click",
    () => {
      setTimerMode(
        button.dataset.timerMode
      );
    }
  );

});


els.timerStart.addEventListener(
  "click",
  toggleTimer
);


els.timerReset.addEventListener(
  "click",
  resetTimer
);


renderTimer();


// ============================================================
// BOTTOM NAVIGATION
// ============================================================

function setView(view) {

  const panels = $$(".view-panel");

  panels.forEach(panel => {

    const panelName =
      panel.dataset.panel;

    let shouldShow = false;


    if (view === "overview") {
      shouldShow = true;
    }


    if (
      view === "focus" &&
      ["focus", "analytics"].includes(panelName)
    ) {
      shouldShow = true;
    }


    if (
      view === "tasks" &&
      panelName === "tasks"
    ) {
      shouldShow = true;
    }


    if (
      view === "notes" &&
      panelName === "notes"
    ) {
      shouldShow = true;
    }


    panel.classList.toggle(
      "hidden",
      !shouldShow
    );
  });


  $$(".nav-item").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.view === view
    );

  });


  requestAnimationFrame(() => {

    const active =
      document.querySelector(
        ".nav-item.active"
      );

    if (!active) return;


    els.navSlider.style.left =
      `${active.offsetLeft}px`;

    els.navSlider.style.width =
      `${active.offsetWidth}px`;
  });
}


$$(".nav-item").forEach(button => {

  button.addEventListener(
    "click",
    () => {
      setView(
        button.dataset.view
      );
    }
  );

});


window.addEventListener(
  "resize",
  () => {

    const activeView =
      document.querySelector(
        ".nav-item.active"
      )?.dataset.view ||
      "overview";

    setView(activeView);

  }
);


setView("overview");


// ============================================================
// QUICK LINKS
// ============================================================

function renderQuickLinks() {

  els.linkGrid.innerHTML = "";


  for (const link of quickLinks) {

    const card =
      document.createElement("div");

    card.className = "link-card";

    card.style.position = "relative";


    const anchor =
      document.createElement("a");

    anchor.href = link.url;

    anchor.target = "_blank";

    anchor.rel =
      "noopener noreferrer";

    anchor.setAttribute(
      "aria-label",
      `Open ${link.title}`
    );

    anchor.style.cssText = `
      position:absolute;
      inset:0;
      z-index:1;
    `;


    const content =
      document.createElement("div");

    content.style.cssText = `
      position:relative;
      z-index:2;
      pointer-events:none;
      height:100%;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
    `;


    content.innerHTML = `
      <div class="link-top">
        <div class="link-icon ${escapeHtml(
          link.color || "blue"
        )}">
          ${escapeHtml(
            link.icon ||
            link.title?.[0]?.toUpperCase() ||
            "↗"
          )}
        </div>

        <button
          class="delete-link"
          title="Delete link"
          aria-label="Delete ${escapeHtml(link.title)}"
          data-delete-link="${escapeHtml(link.id)}"
          style="pointer-events:auto;"
        >
          ×
        </button>
      </div>

      <div>
        <div class="link-name">
          ${escapeHtml(link.title)}
        </div>

        <div class="link-url">
          ${escapeHtml(
            link.url.replace(
              /^https?:\/\//,
              ""
            )
          )}
        </div>
      </div>
    `;


    card.appendChild(anchor);

    card.appendChild(content);

    els.linkGrid.appendChild(card);
  }
}


els.linkGrid.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "[data-delete-link]"
      );

    if (!button) return;

    event.preventDefault();

    event.stopPropagation();


    const id =
      button.dataset.deleteLink;


    try {

      await deleteDoc(
        userDoc(
          "quick_links",
          id
        )
      );

      showToast(
        "Link removed."
      );

    } catch (error) {

      console.error(error);

      showToast(
        "Could not remove that link."
      );
    }
  }
);


// ============================================================
// LINK MODAL
// ============================================================

function openLinkModal() {

  els.linkForm.reset();

  els.linkModal.querySelector("h2")
    .textContent =
    "Add a quick link";

  els.modalBackdrop
    .classList.remove("hidden");

  els.linkTitle.focus();
}


function closeLinkModal() {

  els.modalBackdrop
    .classList.add("hidden");
}


els.addLinkBtn.addEventListener(
  "click",
  () => {

    if (!currentUser) {

      showToast(
        "Sign in first to customize your cloud links."
      );

      return;
    }

    openLinkModal();
  }
);


els.closeLinkModal.addEventListener(
  "click",
  closeLinkModal
);


els.cancelLinkBtn.addEventListener(
  "click",
  closeLinkModal
);


els.modalBackdrop.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      els.modalBackdrop
    ) {
      closeLinkModal();
    }

  }
);


els.linkForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!currentUser) {
      return;
    }


    const title =
      els.linkTitle.value.trim();

    const url =
      els.linkUrl.value.trim();

    const color =
      els.linkColor.value;

    const icon =
      title[0]?.toUpperCase() ||
      "↗";


    if (!title || !url) {
      return;
    }


    try {

      await addDoc(
        userCollection("quick_links"),
        {
          title,
          url,
          color,
          icon,
          createdAt:
            serverTimestamp()
        }
      );


      closeLinkModal();

      showToast(
        "Quick link saved."
      );

    } catch (error) {

      console.error(error);

      showToast(
        "Could not save the link."
      );
    }

  }
);


// ============================================================
// SCRATCHPAD
// ============================================================

window._scratchpadContent = "";


function renderScratchpad() {

  const content =
    window._scratchpadContent ||
    "";

  if (
    els.scratchpad.value !==
    content
  ) {
    els.scratchpad.value =
      content;
  }


  els.noteCount.textContent =
    `${content.length.toLocaleString()} characters`;
}


els.scratchpad.addEventListener(
  "input",
  () => {

    const content =
      els.scratchpad.value;

    window._scratchpadContent =
      content;

    els.noteCount.textContent =
      `${content.length.toLocaleString()} characters`;


    if (!currentUser) {
      return;
    }


    els.noteSaveState.textContent =
      "Unsaved…";


    clearTimeout(noteSaveTimer);


    noteSaveTimer =
      setTimeout(
        async () => {

          try {

            await setDoc(
              userDoc(
                "scratchpad",
                "main"
              ),
              {
                content,
                updatedAt:
                  serverTimestamp()
              },
              {
                merge: true
              }
            );


            els.noteSaveState.textContent =
              "Saved to cloud";

          } catch (error) {

            console.error(error);

            els.noteSaveState.textContent =
              "Save failed";
          }

        },
        550
      );
  }
);


els.clearNotesBtn.addEventListener(
  "click",
  async () => {

    els.scratchpad.value = "";

    window._scratchpadContent = "";

    els.noteCount.textContent =
      "0 characters";


    if (!currentUser) {
      return;
    }


    try {

      await setDoc(
        userDoc(
          "scratchpad",
          "main"
        ),
        {
          content: "",
          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );


      els.noteSaveState.textContent =
        "Saved to cloud";

    } catch (error) {

      console.error(error);

      showToast(
        "Could not clear cloud notes."
      );
    }

  }
);


// ============================================================
// TASKS
// ============================================================

function renderTasks() {

  const activeCount =
    tasks.filter(
      task => !task.completed
    ).length;


  const doneCount =
    tasks.filter(
      task => task.completed
    ).length;


  els.taskCountBadge.textContent =
    activeCount;


  els.clockToday.textContent =
    `${tasks.length} ${
      tasks.length === 1
        ? "task"
        : "tasks"
    }`;


  els.clockDone.textContent =
    `${doneCount} ${
      doneCount === 1
        ? "task"
        : "tasks"
    }`;


  const visibleTasks =
    tasks.filter(task => {

      let statusMatches = true;

      let categoryMatches = true;


      if (
        taskStatusFilter ===
        "active"
      ) {
        statusMatches =
          !task.completed;
      }


      if (
        taskStatusFilter ===
        "completed"
      ) {
        statusMatches =
          task.completed;
      }


      if (
        taskCategoryFilter !==
        "all"
      ) {
        categoryMatches =
          task.category ===
          taskCategoryFilter;
      }


      return (
        statusMatches &&
        categoryMatches
      );
    });


  if (!visibleTasks.length) {

    els.taskList.innerHTML = `
      <div class="empty-state">
        ${
          currentUser
            ? "Nothing here yet."
            : "Sign in to load your cloud tasks."
        }
      </div>
    `;

    renderAnalytics();

    return;
  }


  els.taskList.innerHTML =
    visibleTasks
      .map(task => {

        const due =
          parseStoredDate(
            task.dueAt
          );


        const dueLabel =
          due
            ? niceDate(due)
            : "";


        return `
          <div
            class="task-item ${
              task.completed
                ? "completed"
                : ""
            }"
          >

            <button
              class="task-check"
              data-task-toggle="${escapeHtml(
                task.id
              )}"
              aria-label="${
                task.completed
                  ? "Mark active"
                  : "Mark complete"
              }"
            ></button>


            <div class="task-copy">

              <div class="task-title">
                ${escapeHtml(
                  task.text
                )}
              </div>


              <div class="task-meta">

                <span class="task-tag">
                  ${escapeHtml(
                    task.category ||
                    "School"
                  )}
                </span>


                <span
                  class="task-tag ${
                    task.priority ||
                    "medium"
                  }"
                >
                  ${escapeHtml(
                    task.priority ||
                    "medium"
                  )}
                </span>


                ${
                  due
                    ? `
                      <span class="task-tag task-due">
                        ${escapeHtml(
                          dueLabel
                        )}
                      </span>
                    `
                    : ""
                }

              </div>

            </div>


            <button
              class="task-delete"
              data-task-delete="${escapeHtml(
                task.id
              )}"
              title="Delete task"
              aria-label="Delete task"
            >
              ×
            </button>

          </div>
        `;
      })
      .join("");


  renderAnalytics();
}


// ============================================================
// TASK CLICK HANDLING
// ============================================================

els.taskList.addEventListener(
  "click",
  async event => {

    const toggle =
      event.target.closest(
        "[data-task-toggle]"
      );

    const del =
      event.target.closest(
        "[data-task-delete]"
      );


    try {

      if (toggle) {

        const task =
          tasks.find(
            item =>
              item.id ===
              toggle.dataset.taskToggle
          );


        if (!task) return;


        await updateDoc(
          userDoc(
            "tasks",
            task.id
          ),
          {
            completed:
              !task.completed,

            completedAt:
              !task.completed
                ? serverTimestamp()
                : null
          }
        );


        return;
      }


      if (del) {

        await deleteDoc(
          userDoc(
            "tasks",
            del.dataset.taskDelete
          )
        );

        return;
      }


    } catch (error) {

      console.error(error);

      showToast(
        "Task update failed."
      );
    }

  }
);


// ============================================================
// ADD TASK
// ============================================================

els.taskForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!currentUser) {

      showToast(
        "Sign in first to add cloud tasks."
      );

      return;
    }


    const text =
      els.taskText.value.trim();


    if (!text) {
      return;
    }


    const payload = {
      text,

      category:
        els.taskCategory.value,

      priority:
        els.taskPriority.value,

      completed: false,

      createdAt:
        serverTimestamp(),

      completedAt: null,

      dueAt: null
    };


    if (els.taskDue.value) {

      payload.dueAt =
        new Date(
          `${els.taskDue.value}T23:59:59`
        );
    }


    try {

      await addDoc(
        userCollection("tasks"),
        payload
      );


      els.taskText.value = "";

      els.taskDue.value = "";

      showToast(
        "Task added."
      );


      els.taskText.focus();

    } catch (error) {

      console.error(error);

      showToast(
        "Could not save task."
      );
    }

  }
);


// ============================================================
// TASK FILTERS
// ============================================================

$$("[data-task-status]").forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        taskStatusFilter =
          button.dataset.taskStatus;


        $$("[data-task-status]")
          .forEach(other => {

            other.classList.toggle(
              "active",
              other === button
            );

          });


        renderTasks();
      }
    );

  }
);


els.categoryFilter.addEventListener(
  "change",
  () => {

    taskCategoryFilter =
      els.categoryFilter.value;

    renderTasks();
  }
);


// ============================================================
// STUDY ANALYTICS
// ============================================================

function calculateAnalytics() {

  const now = new Date();

  const todayKey =
    localDateKey(now);


  const startOfWeek =
    new Date(now);

  startOfWeek.setHours(
    0,
    0,
    0,
    0
  );


  startOfWeek.setDate(
    startOfWeek.getDate() - 6
  );


  let todayMinutes = 0;

  let weekMinutes = 0;


  const studyDays =
    new Set();


  for (const log of studyLogs) {

    const date =
      parseStoredDate(
        log.timestamp
      );


    if (!date) {
      continue;
    }


    const minutes =
      Number(
        log.duration || 0
      );


    const dateKey =
      localDateKey(date);


    if (
      dateKey ===
      todayKey
    ) {
      todayMinutes +=
        minutes;
    }


    if (
      date >= startOfWeek &&
      date <= now
    ) {
      weekMinutes +=
        minutes;
    }


    if (minutes > 0) {

      studyDays.add(
        dateKey
      );
    }
  }


  let streak = 0;

  const cursor =
    new Date(now);


  cursor.setHours(
    0,
    0,
    0,
    0
  );


  while (
    studyDays.has(
      localDateKey(cursor)
    )
  ) {

    streak++;

    cursor.setDate(
      cursor.getDate() - 1
    );
  }


  const totalTasks =
    tasks.length;


  const completedTasks =
    tasks.filter(
      task => task.completed
    ).length;


  const completion =
    totalTasks > 0
      ? Math.round(
          completedTasks /
          totalTasks *
          100
        )
      : 0;


  return {
    todayMinutes,
    weekMinutes,
    streak,
    completion
  };
}


function renderAnalytics() {

  const stats =
    calculateAnalytics();


  const sessionCount =
    studyLogs.filter(log => {

      const date =
        parseStoredDate(
          log.timestamp
        );


      return (
        date &&
        localDateKey(date) ===
          localDateKey()
      );

    }).length;


  els.focusToday.textContent =
    `${stats.todayMinutes} min`;


  els.focusStreak.textContent =
    `${stats.streak} ${
      stats.streak === 1
        ? "day"
        : "days"
    }`;


  els.focusSessions.textContent =
    String(sessionCount);


  els.analyticsToday.textContent =
    `${stats.todayMinutes} min`;


  els.analyticsWeek.textContent =
    `${stats.weekMinutes} min`;


  els.analyticsStreak.textContent =
    `${stats.streak} ${
      stats.streak === 1
        ? "day"
        : "days"
    }`;


  els.analyticsCompletion.textContent =
    `${stats.completion}%`;


  const milestones = [
    25,
    50,
    100,
    180,
    300,
    500,
    1000
  ];


  const next =
    milestones.find(
      milestone =>
        stats.todayMinutes <
        milestone
    );


  if (next) {

    els.nextMilestone.textContent =
      `${next - stats.todayMinutes} min until today's ${next}-minute milestone.`;

  } else {

    els.nextMilestone.textContent =
      "You cleared every milestone today.";
  }
}


// ============================================================
// CLEAR STUDY LOGS
// ============================================================

els.clearStudyLogsBtn.addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      studyLogs.length === 0
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        "Delete all study logs for this account?"
      );


    if (!confirmed) {
      return;
    }


    try {

      const batch =
        writeBatch(db);


      studyLogs.forEach(log => {

        batch.delete(
          userDoc(
            "study_logs",
            log.id
          )
        );

      });


      await batch.commit();


      showToast(
        "Study history cleared."
      );


    } catch (error) {

      console.error(error);

      showToast(
        "Could not clear study history."
      );
    }

  }
);


// ============================================================
// DEFAULT LINK SEEDING
// ============================================================

async function seedDefaultLinksIfNeeded() {

  const snapshot =
    await getDocs(
      query(
        userCollection("quick_links"),
        limit(1)
      )
    );


  if (!snapshot.empty) {
    return;
  }


  const batch =
    writeBatch(db);


  for (const link of defaultLinks) {

    const reference =
      doc(
        userCollection(
          "quick_links"
        )
      );


    batch.set(
      reference,
      {
        ...link,
        createdAt:
          serverTimestamp()
      }
    );
  }


  await batch.commit();
}


// ============================================================
// FIRESTORE LISTENER CLEANUP
// ============================================================

function clearListeners() {

  unsubscribeFns.forEach(
    unsubscribe => {
      unsubscribe();
    }
  );


  unsubscribeFns = [];
}


// ============================================================
// START REAL-TIME FIRESTORE LISTENERS
// ============================================================

function startRealtimeListeners() {

  clearListeners();


  if (!currentUser) {
    return;
  }


  const taskQuery =
    query(
      userCollection("tasks"),
      orderBy(
        "createdAt",
        "desc"
      ),
      limit(250)
    );


  const linkQuery =
    query(
      userCollection("quick_links"),
      orderBy(
        "createdAt",
        "asc"
      ),
      limit(100)
    );


  const logQuery =
    query(
      userCollection("study_logs"),
      orderBy(
        "timestamp",
        "desc"
      ),
      limit(500)
    );


  // TASKS

  unsubscribeFns.push(

    onSnapshot(
      taskQuery,

      snapshot => {

        tasks =
          snapshot.docs.map(
            document => ({
              id: document.id,
              ...document.data()
            })
          );


        renderTasks();
      },

      error => {

        console.error(
          "Task listener:",
          error
        );


        showToast(
          "Task listener failed. Check Firestore indexes/rules."
        );
      }
    )
  );


  // QUICK LINKS

  unsubscribeFns.push(

    onSnapshot(
      linkQuery,

      snapshot => {

        quickLinks =
          snapshot.docs.map(
            document => ({
              id: document.id,
              ...document.data()
            })
          );


        renderQuickLinks();
      },

      error => {

        console.error(
          "Quick link listener:",
          error
        );
      }
    )
  );


  // STUDY LOGS

  unsubscribeFns.push(

    onSnapshot(
      logQuery,

      snapshot => {

        studyLogs =
          snapshot.docs.map(
            document => ({
              id: document.id,
              ...document.data()
            })
          );


        renderAnalytics();
      },

      error => {

        console.error(
          "Study log listener:",
          error
        );


        showToast(
          "Study analytics listener failed."
        );
      }
    )
  );


  // SCRATCHPAD

  unsubscribeFns.push(

    onSnapshot(
      userDoc(
        "scratchpad",
        "main"
      ),

      snapshot => {

        if (!snapshot.exists()) {

          window._scratchpadContent =
            "";

          els.noteSaveState.textContent =
            "Ready";

        } else {

          window._scratchpadContent =
            snapshot.data()
              .content || "";

          els.noteSaveState.textContent =
            "Saved to cloud";
        }


        renderScratchpad();
      },

      error => {

        console.error(
          "Scratchpad listener:",
          error
        );


        els.noteSaveState.textContent =
          "Unavailable";
      }
    )
  );
}


// ============================================================
// USER WORKSPACE INITIALIZATION
// ============================================================

async function initUserWorkspace() {

  try {

    setSyncStatus(
      "Loading your cloud workspace…"
    );


    els.scratchpad.disabled =
      false;


    // Seed default quick links
    await seedDefaultLinksIfNeeded();


    // Start Firestore listeners
    startRealtimeListeners();


    setSyncStatus(
      `Synced as ${
        currentUser.displayName ||
        currentUser.email ||
        "student"
      }`,
      true
    );


  } catch (error) {

    console.error(
      "Workspace initialization:",
      error
    );


    setSyncStatus(
      "Could not load your workspace."
    );


    showToast(
      "Firebase is connected, but the workspace could not load."
    );
  }
}


// ============================================================
// SIGNED-OUT UI
// ============================================================

function setSignedOutUI() {

  clearListeners();


  currentUser = null;

  tasks = [];

  studyLogs = [];

  quickLinks = [];


  renderQuickLinks();

  renderTasks();

  renderScratchpad();


  els.scratchpad.disabled =
    true;


  els.noteSaveState.textContent =
    "Waiting for sign-in";


  els.userChip.classList.add(
    "hidden"
  );


  els.signInBtn.classList.remove(
    "hidden"
  );


  setSyncStatus(
    "Sign in to enable cloud sync."
  );
}


// ============================================================
// SIGNED-IN UI
// ============================================================

function setSignedInUI(user) {

  currentUser = user;


  els.signInBtn.classList.add(
    "hidden"
  );


  els.userChip.classList.remove(
    "hidden"
  );


  els.userName.textContent =
    user.displayName ||
    user.email ||
    "Student";


  if (user.photoURL) {

    els.userAvatar.src =
      user.photoURL;

  } else {

    els.userAvatar.removeAttribute(
      "src"
    );
  }


  initUserWorkspace();
}


// ============================================================
// GOOGLE SIGN-IN
// ============================================================

async function signIn() {

  try {

    const isMobile =
      window.matchMedia(
        "(max-width: 768px)"
      ).matches;


    if (isMobile) {

      await signInWithRedirect(
        auth,
        googleProvider
      );

    } else {

      await signInWithPopup(
        auth,
        googleProvider
      );
    }


  } catch (error) {

    console.error(
      "Sign-in error:",
      error
    );


    if (
      error.code ===
      "auth/popup-blocked"
    ) {

      await signInWithRedirect(
        auth,
        googleProvider
      );

      return;
    }


    showToast(
      `Sign-in failed: ${
        error.code ||
        "unknown error"
      }`
    );
  }
}


els.signInBtn.addEventListener(
  "click",
  signIn
);


// ============================================================
// SIGN OUT
// ============================================================

els.signOutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      showToast(
        "Signed out."
      );

    } catch (error) {

      console.error(error);

      showToast(
        "Sign out failed."
      );
    }
  }
);


// ============================================================
// FIREBASE REDIRECT RESULT
// ============================================================

getRedirectResult(auth)
  .catch(error => {

    if (
      error &&
      error.code !==
        "auth/popup-closed-by-user"
    ) {
      console.error(
        "Redirect sign-in:",
        error
      );
    }

  });


// ============================================================
// AUTH STATE LISTENER
// ============================================================

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      setSignedInUI(user);

    } else {

      setSignedOutUI();

    }

  }
);


// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

window.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {
      closeLinkModal();
    }

  }
);