import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

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
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyA3RzJKp5gq6a3JhYsI0D4jK3goBKm87go",
  authDomain: "student-dashboard-41b98.firebaseapp.com",
  projectId: "student-dashboard-41b98",
  storageBucket: "student-dashboard-41b98.firebasestorage.app",
  messagingSenderId: "908791794286",
  appId: "1:908791794286:web:26f30e965d52fef572f47f",
  measurementId: "G-NHXYYGMEZX"
};

const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

const auth =
  getAuth(app);

const provider =
  new GoogleAuthProvider();


const $ =
  selector =>
    document.querySelector(selector);

const $$ =
  selector =>
    [...document.querySelectorAll(selector)];


const els = {

  greeting:
    $("#greeting"),

  heroDate:
    $("#heroDate"),

  syncStatus:
    $("#syncStatus"),

  connectionDot:
    $("#connectionDot"),

  signInBtn:
    $("#signInBtn"),

  signOutBtn:
    $("#signOutBtn"),

  userChip:
    $("#userChip"),

  userAvatar:
    $("#userAvatar"),

  userName:
    $("#userName"),

  clockTime:
    $("#clockTime"),

  clockAmPm:
    $("#clockAmPm"),

  clockDate:
    $("#clockDate"),

  clockOpen:
    $("#clockOpen"),

  clockDone:
    $("#clockDone"),

  clockFocus:
    $("#clockFocus"),

  timerOrb:
    $("#timerOrb"),

  timerDisplay:
    $("#timerDisplay"),

  timerCaption:
    $("#timerCaption"),

  timerPill:
    $("#timerPill"),

  timerStart:
    $("#timerStart"),

  timerReset:
    $("#timerReset"),

  focusToday:
    $("#focusToday"),

  focusStreak:
    $("#focusStreak"),

  focusSessions:
    $("#focusSessions"),

  analyticsToday:
    $("#analyticsToday"),

  analyticsWeek:
    $("#analyticsWeek"),

  analyticsStreak:
    $("#analyticsStreak"),

  analyticsCompletion:
    $("#analyticsCompletion"),

  nextMilestone:
    $("#nextMilestone"),

  clearStudyLogsBtn:
    $("#clearStudyLogsBtn"),

  taskForm:
    $("#taskForm"),

  taskText:
    $("#taskText"),

  taskCategory:
    $("#taskCategory"),

  taskPriority:
    $("#taskPriority"),

  taskDue:
    $("#taskDue"),

  categoryFilter:
    $("#categoryFilter"),

  taskList:
    $("#taskList"),

  taskCountBadge:
    $("#taskCountBadge"),

  scratchpad:
    $("#scratchpad"),

  noteSaveState:
    $("#noteSaveState"),

  noteCount:
    $("#noteCount"),

  clearNotesBtn:
    $("#clearNotesBtn"),

  linkGrid:
    $("#linkGrid"),

  addLinkBtn:
    $("#addLinkBtn"),

  liquidDock:
    $("#liquidDock"),

  dockGlide:
    $("#dockGlide"),

  moreBackdrop:
    $("#moreBackdrop"),

  closeMore:
    $("#closeMore"),

  themeSelect:
    $("#themeSelect"),

  accentPicker:
    $("#accentPicker"),

  layoutManager:
    $("#layoutManager"),

  resetLayoutBtn:
    $("#resetLayoutBtn"),

  focusMinutesInput:
    $("#focusMinutesInput"),

  shortMinutesInput:
    $("#shortMinutesInput"),

  longMinutesInput:
    $("#longMinutesInput"),

  modalBackdrop:
    $("#modalBackdrop"),

  closeLinkModal:
    $("#closeLinkModal"),

  cancelLinkBtn:
    $("#cancelLinkBtn"),

  linkForm:
    $("#linkForm"),

  linkTitle:
    $("#linkTitle"),

  linkUrl:
    $("#linkUrl"),

  linkColor:
    $("#linkColor"),

  toast:
    $("#toast")
};


const DEFAULT_PREFERENCES = {

  theme:
    "midnight",

  accent:
    "blue",

  widgetOrder: [
    "clock",
    "focus",
    "tasks",
    "notes",
    "links",
    "analytics"
  ],

  hiddenWidgets: [],

  focusMinutes:
    25,

  shortBreakMinutes:
    5,

  longBreakMinutes:
    15
};


const DEFAULT_LINKS = [

  {
    title: "Classroom",
    url: "https://classroom.google.com/",
    color: "blue",
    icon: "C"
  },

  {
    title: "Docs",
    url: "https://docs.google.com/document/",
    color: "rose",
    icon: "D"
  },

  {
    title: "Slides",
    url: "https://slides.google.com/",
    color: "amber",
    icon: "S"
  },

  {
    title: "Gmail",
    url: "https://mail.google.com/",
    color: "mint",
    icon: "G"
  }

];


const WIDGET_LABELS = {

  clock:
    "Clock",

  focus:
    "Focus timer",

  tasks:
    "Tasks",

  notes:
    "Notes",

  links:
    "Launchpad",

  analytics:
    "Analytics"

};


let currentUser = null;

let unsubscribeFns = [];

let tasks = [];

let studyLogs = [];

let quickLinks = [];

let preferences =
  JSON.parse(
    JSON.stringify(
      DEFAULT_PREFERENCES
    )
  );

let noteContent = "";

let noteSaveTimer = null;

let preferencesSaveTimer =
  null;

let taskStatusFilter =
  "active";

let taskCategoryFilter =
  "all";

let currentView =
  "overview";

let moreOpen =
  false;


let timerMode =
  "focus";

let timerRunning =
  false;

let timerInterval =
  null;

let timerSeconds =
  25 * 60;


// ============================================================
// HELPERS
// ============================================================

function cloneDefaults() {

  return JSON.parse(
    JSON.stringify(
      DEFAULT_PREFERENCES
    )
  );
}


function showToast(message) {

  els.toast.textContent =
    message;

  els.toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {
        els.toast.classList.remove(
          "show"
        );
      },
      2600
    );
}


function setConnectionStatus(
  message,
  good = false
) {

  els.syncStatus.textContent =
    message;

  els.connectionDot.classList.toggle(
    "good",
    good
  );
}


function localDateKey(
  date = new Date()
) {

  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    String(
      date.getDate()
    ).padStart(2, "0")

  ].join("-");
}


function parseStoredDate(value) {

  if (!value) {
    return null;
  }


  if (
    typeof value.toDate ===
    "function"
  ) {
    return value.toDate();
  }


  if (
    value instanceof Date
  ) {
    return value;
  }


  const parsed =
    new Date(value);


  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;
}


function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function formatDate(date) {

  return new Intl.DateTimeFormat(
    undefined,
    {
      weekday:
        "long",

      month:
        "long",

      day:
        "numeric"
    }
  ).format(date);
}


function userCollection(name) {

  if (!currentUser) {
    throw new Error(
      "Not signed in"
    );
  }


  return collection(
    db,

    "users",

    currentUser.uid,

    name
  );
}


function userDoc(
  collectionName,
  id
) {

  if (!currentUser) {
    throw new Error(
      "Not signed in"
    );
  }


  return doc(
    db,

    "users",

    currentUser.uid,

    collectionName,

    id
  );
}


function prefsDoc() {

  return userDoc(
    "settings",
    "preferences"
  );
}


// ============================================================
// CLOCK
// ============================================================

function updateClock() {

  const now =
    new Date();

  const hour =
    now.getHours();

  const hour12 =
    hour % 12 || 12;


  els.clockTime.textContent =
    `${hour12}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;


  els.clockAmPm.textContent =
    hour >= 12
      ? "PM"
      : "AM";


  els.clockDate.textContent =
    new Intl.DateTimeFormat(
      undefined,
      {
        weekday:
          "short",

        month:
          "short",

        day:
          "numeric"
      }
    ).format(now);


  els.heroDate.textContent =
    `${formatDate(now)} · ${
      Intl.DateTimeFormat(
        undefined,
        {
          timeZoneName:
            "short"
        }
      )
        .formatToParts(now)
        .find(
          part =>
            part.type ===
            "timeZoneName"
        )
        ?.value || "local time"
    }`;


  els.greeting.textContent =
    hour < 12
      ? "Good morning."
      : hour < 18
        ? "Good afternoon."
        : "Good evening.";
}


updateClock();


setInterval(
  updateClock,
  1000
);


// ============================================================
// TIMER
// ============================================================

function timerSecondsFor(mode) {

  if (
    mode === "short"
  ) {
    return (
      preferences.shortBreakMinutes *
      60
    );
  }


  if (
    mode === "long"
  ) {
    return (
      preferences.longBreakMinutes *
      60
    );
  }


  return (
    preferences.focusMinutes *
    60
  );
}


function timerMeta(mode) {

  if (
    mode === "short"
  ) {

    return {
      label:
        "Reset your brain",

      pill:
        "SHORT BREAK"
    };

  }


  if (
    mode === "long"
  ) {

    return {
      label:
        "Long recovery",

      pill:
        "LONG BREAK"
    };

  }


  return {
    label:
      "Deep work",

    pill:
      "FOCUS"
  };
}


function renderTimer() {

  const mins =
    Math.floor(
      timerSeconds / 60
    );

  const secs =
    timerSeconds % 60;


  const meta =
    timerMeta(
      timerMode
    );


  els.timerDisplay.textContent =
    `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;


  els.timerCaption.textContent =
    meta.label;


  els.timerPill.textContent =
    meta.pill;


  els.timerStart.textContent =
    timerRunning
      ? "Pause"
      : "Start";


  els.timerOrb.classList.toggle(
    "running",
    timerRunning
  );


  $$(
    "[data-timer-mode]"
  ).forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.timerMode ===
          timerMode
      );

    }
  );
}


function setTimerMode(mode) {

  timerRunning = false;

  clearInterval(
    timerInterval
  );

  timerInterval =
    null;

  timerMode =
    mode;

  timerSeconds =
    timerSecondsFor(mode);

  renderTimer();
}


async function completeTimer() {

  timerRunning = false;

  clearInterval(
    timerInterval
  );

  timerInterval =
    null;

  renderTimer();


  if (
    timerMode ===
    "focus"
  ) {

    if (currentUser) {

      try {

        await addDoc(
          userCollection(
            "study_logs"
          ),
          {
            duration:
              preferences.focusMinutes,

            timestamp:
              serverTimestamp()
          }
        );

        showToast(
          "Focus session saved to your cloud history."
        );

      } catch (error) {

        console.error(
          error
        );

        showToast(
          "Session finished, but the cloud log failed."
        );
      }

    } else {

      showToast(
        "Focus session finished. Sign in to save study history."
      );
    }


    setTimerMode(
      "short"
    );

  } else {

    setTimerMode(
      "focus"
    );
  }
}


function toggleTimer() {

  timerRunning =
    !timerRunning;


  clearInterval(
    timerInterval
  );


  timerInterval =
    null;


  if (timerRunning) {

    timerInterval =
      setInterval(
        () => {

          timerSeconds -=
            1;


          if (
            timerSeconds <=
            0
          ) {

            timerSeconds =
              0;

            renderTimer();

            completeTimer();

            return;
          }


          renderTimer();

        },
        1000
      );
  }


  renderTimer();
}


function resetTimer() {

  timerRunning =
    false;

  clearInterval(
    timerInterval
  );

  timerInterval =
    null;

  timerSeconds =
    timerSecondsFor(
      timerMode
    );

  renderTimer();
}


$$(
  "[data-timer-mode]"
).forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        setTimerMode(
          button.dataset
            .timerMode
        );

      }
    );

  }
);


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
// PERSONALIZATION
// ============================================================

function normalizePreferences(
  raw
) {

  const merged = {
    ...cloneDefaults(),
    ...(raw || {})
  };


  merged.widgetOrder =
    Array.from(
      new Set([
        ...(
          Array.isArray(
            raw?.widgetOrder
          )
            ? raw.widgetOrder
            : []
        ),

        ...DEFAULT_PREFERENCES
          .widgetOrder
      ])
    )
    .filter(
      id =>
        DEFAULT_PREFERENCES
          .widgetOrder
          .includes(id)
    );


  merged.hiddenWidgets =
    Array.isArray(
      raw?.hiddenWidgets
    )
      ? raw.hiddenWidgets
          .filter(
            id =>
              DEFAULT_PREFERENCES
                .widgetOrder
                .includes(id)
          )
      : [];


  merged.focusMinutes =
    Math.max(
      1,
      Math.min(
        120,
        Number(
          merged.focusMinutes
        ) || 25
      )
    );


  merged.shortBreakMinutes =
    Math.max(
      1,
      Math.min(
        60,
        Number(
          merged.shortBreakMinutes
        ) || 5
      )
    );


  merged.longBreakMinutes =
    Math.max(
      1,
      Math.min(
        90,
        Number(
          merged.longBreakMinutes
        ) || 15
      )
    );


  return merged;
}


function applyAppearance() {

  document.documentElement.dataset.theme =
    preferences.theme;


  document.documentElement.dataset.accent =
    preferences.accent;


  els.themeSelect.value =
    preferences.theme;


  $$(
    "#accentPicker button"
  ).forEach(
    button => {

      button.style.boxShadow =
        button.dataset.accent ===
        preferences.accent

          ? "0 0 0 3px rgba(255,255,255,.20)"

          : "none";

    }
  );
}


function applyLayout() {

  const visibleOrder =
    preferences.widgetOrder
      .filter(
        id =>
          !preferences
            .hiddenWidgets
            .includes(id)
      );


  const workspace =
    document.querySelector(
      "#workspace"
    );


  for (
    const widgetId
    of preferences.widgetOrder
  ) {

    const node =
      document.querySelector(
        `[data-widget-id="${widgetId}"]`
      );


    if (node) {
      workspace.appendChild(
        node
      );
    }
  }


  $$(".widget").forEach(
    node => {

      const hidden =
        !visibleOrder.includes(
          node.dataset.widgetId
        );


      node.classList.toggle(
        "hidden",
        hidden
      );

    }
  );
}


function renderLayoutManager() {

  els.layoutManager.innerHTML =
    preferences.widgetOrder
      .map(
        (
          id,
          index
        ) => {

          const hidden =
            preferences.hiddenWidgets
              .includes(id);


          return `
            <div
              class="layout-row"
              data-layout-id="${id}"
            >

              <span class="layout-name">
                ${escapeHtml(
                  WIDGET_LABELS[id]
                )}
                ${
                  hidden
                    ? " · hidden"
                    : ""
                }
              </span>

              <button
                data-layout-action="up"
                ${index === 0 ? "disabled" : ""}
              >
                ↑
              </button>

              <button
                data-layout-action="down"
                ${index === preferences.widgetOrder.length - 1 ? "disabled" : ""}
              >
                ↓
              </button>

              <button
                data-layout-action="toggle"
              >
                ${
                  hidden
                    ? "○"
                    : "●"
                }
              </button>

            </div>
          `;
        }
      )
      .join("");
}


function savePreferencesDebounced() {

  if (!currentUser) {
    return;
  }


  clearTimeout(
    preferencesSaveTimer
  );


  preferencesSaveTimer =
    setTimeout(
      async () => {

        try {

          await setDoc(
            prefsDoc(),
            {
              ...preferences,

              updatedAt:
                serverTimestamp()
            },
            {
              merge:true
            }
          );

        } catch (error) {

          console.error(
            "Preferences save:",
            error
          );

          showToast(
            "Could not save your personalization settings."
          );
        }

      },
      450
    );
}


function updatePreference(
  key,
  value
) {

  preferences =
    normalizePreferences({
      ...preferences,

      [key]:
        value
    });


  applyAppearance();

  applyLayout();

  renderLayoutManager();

  updateTimerIfIdle();

  savePreferencesDebounced();
}


function updateTimerIfIdle() {

  if (!timerRunning) {

    timerSeconds =
      timerSecondsFor(
        timerMode
      );

    renderTimer();
  }
}


els.themeSelect.addEventListener(
  "change",
  () => {

    updatePreference(
      "theme",
      els.themeSelect.value
    );

  }
);


$$(
  "#accentPicker button"
).forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        updatePreference(
          "accent",
          button.dataset.accent
        );

      }
    );

  }
);


els.layoutManager.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "button[data-layout-action]"
      );


    if (!button) {
      return;
    }


    const row =
      button.closest(
        "[data-layout-id]"
      );


    const id =
      row?.dataset.layoutId;


    if (!id) {
      return;
    }


    const index =
      preferences.widgetOrder
        .indexOf(id);


    const action =
      button.dataset
        .layoutAction;


    if (
      action ===
      "toggle"
    ) {

      const hidden =
        new Set(
          preferences.hiddenWidgets
        );


      if (
        hidden.has(id)
      ) {

        hidden.delete(id);

      } else {

        hidden.add(id);
      }


      if (
        hidden.size ===
        preferences
          .widgetOrder
          .length
      ) {

        hidden.delete(id);
      }


      updatePreference(
        "hiddenWidgets",
        [...hidden]
      );


    } else if (
      action === "up" &&
      index > 0
    ) {

      const order =
        [...preferences.widgetOrder];


      [
        order[index - 1],
        order[index]
      ] =
        [
          order[index],
          order[index - 1]
        ];


      updatePreference(
        "widgetOrder",
        order
      );


    } else if (
      action === "down" &&
      index <
        preferences
          .widgetOrder
          .length - 1
    ) {

      const order =
        [...preferences.widgetOrder];


      [
        order[index + 1],
        order[index]
      ] =
        [
          order[index],
          order[index + 1]
        ];


      updatePreference(
        "widgetOrder",
        order
      );
    }

  }
);


els.resetLayoutBtn.addEventListener(
  "click",
  () => {

    preferences =
      cloneDefaults();


    applyAppearance();

    applyLayout();

    renderLayoutManager();

    updateTimerIfIdle();

    savePreferencesDebounced();
  }
);


function syncTimerInputs() {

  els.focusMinutesInput.value =
    preferences.focusMinutes;


  els.shortMinutesInput.value =
    preferences.shortBreakMinutes;


  els.longMinutesInput.value =
    preferences.longBreakMinutes;
}


[
  els.focusMinutesInput,
  els.shortMinutesInput,
  els.longMinutesInput
].forEach(
  input => {

    input.addEventListener(
      "change",
      () => {

        const mapping = {

          focusMinutesInput:
            "focusMinutes",

          shortMinutesInput:
            "shortBreakMinutes",

          longMinutesInput:
            "longBreakMinutes"

        };


        const key =
          mapping[input.id];


        let value =
          Number(
            input.value
          );


        if (
          key ===
          "focusMinutes"
        ) {

          value =
            Math.max(
              1,
              Math.min(
                120,
                value
              )
            );
        }


        if (
          key ===
          "shortBreakMinutes"
        ) {

          value =
            Math.max(
              1,
              Math.min(
                60,
                value
              )
            );
        }


        if (
          key ===
          "longBreakMinutes"
        ) {

          value =
            Math.max(
              1,
              Math.min(
                90,
                value
              )
            );
        }


        input.value =
          value;


        updatePreference(
          key,
          value
        );

      }
    );

  }
);


// ============================================================
// NAVIGATION
// ============================================================

function moveDockGlide() {

  const active =
    document.querySelector(
      ".dock-item.active"
    );


  if (!active) {
    return;
  }


  els.dockGlide.style.left =
    `${active.offsetLeft}px`;


  els.dockGlide.style.width =
    `${active.offsetWidth}px`;
}


function applyViewState(
  view
) {

  currentView =
    view;


  const panels =
    $$(".widget");


  panels.forEach(
    panel => {

      const id =
        panel.dataset
          .widgetId;


      const userHidden =
        preferences.hiddenWidgets
          .includes(id);


      let show =
        !userHidden;


      if (
        view ===
        "overview"
      ) {

        show =
          !userHidden;

      } else if (
        view === "focus"
      ) {

        show =
          !userHidden &&
          [
            "focus",
            "analytics"
          ].includes(id);

      } else if (
        view === "tasks"
      ) {

        show =
          !userHidden &&
          id === "tasks";

      } else if (
        view === "notes"
      ) {

        show =
          !userHidden &&
          id === "notes";

      } else if (
        view === "links"
      ) {

        show =
          !userHidden &&
          id === "links";

      } else if (
        view === "analytics"
      ) {

        show =
          !userHidden &&
          id === "analytics";

      }


      panel.classList.toggle(
        "hidden",
        !show
      );

    }
  );


  $$(
    ".dock-item"
  ).forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.view ===
          view
      );

    }
  );


  requestAnimationFrame(
    moveDockGlide
  );
}


function animateViewChange(
  view
) {

  const run =
    () =>
      applyViewState(
        view
      );


  if (
    document.startViewTransition
  ) {

    document.startViewTransition(
      run
    );

  } else {

    run();
  }
}


$$(
  ".dock-item"
).forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const view =
          button.dataset
            .view;


        if (
          view ===
          "more"
        ) {

          openMoreSheet();

          return;
        }


        animateViewChange(
          view
        );
      }
    );

  }
);


window.addEventListener(
  "resize",
  moveDockGlide
);


// ============================================================
// TASKS
// ============================================================

function renderTasks() {

  const activeCount =
    tasks.filter(
      task =>
        !task.completed
    ).length;


  const doneCount =
    tasks.filter(
      task =>
        task.completed
    ).length;


  els.taskCountBadge
    .textContent =
    activeCount;


  els.clockOpen
    .textContent =
    activeCount;


  els.clockDone
    .textContent =
    doneCount;


  let visible =
    tasks.filter(
      task => {

        const statusOk =
          taskStatusFilter ===
          "all"

            ? true

            : taskStatusFilter ===
              "active"

              ? !task.completed

              : task.completed;


        const categoryOk =
          taskCategoryFilter ===
          "all"

            ? true

            : task.category ===
              taskCategoryFilter;


        return (
          statusOk &&
          categoryOk
        );
      }
    );


  if (
    !visible.length
  ) {

    els.taskList.innerHTML =
      `
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
    visible
      .map(
        (
          task,
          index
        ) => {

          const due =
            parseStoredDate(
              task.dueAt
            );


          return `
            <div
              class="task-item ${
                task.completed
                  ? "completed"
                  : ""
              }"
              style="
                animation-delay:
                ${Math.min(
                  index * 35,
                  200
                )}ms
              "
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
                            formatDate(
                              due
                            )
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
                title="Delete"
              >
                ×
              </button>

            </div>
          `;
        }
      )
      .join("");


  renderAnalytics();
}


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
              toggle.dataset
                .taskToggle
          );


        if (!task) {
          return;
        }


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
      }


      if (del) {

        await deleteDoc(
          userDoc(
            "tasks",
            del.dataset
              .taskDelete
          )
        );
      }


    } catch (error) {

      console.error(
        error
      );


      showToast(
        error?.code ===
          "permission-denied"

          ? "Firebase blocked that change. Check Firestore rules."

          : "Task update failed."
      );
    }

  }
);


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
        els.taskCategory
          .value,

      priority:
        els.taskPriority
          .value,

      completed:
        false,

      completedAt:
        null,

      createdAt:
        serverTimestamp(),

      dueAt:
        els.taskDue.value
          ? new Date(
              `${els.taskDue.value}T23:59:59`
            )
          : null
    };


    try {

      await addDoc(
        userCollection(
          "tasks"
        ),
        payload
      );


      els.taskText.value =
        "";

      els.taskDue.value =
        "";


      showToast(
        "Task added."
      );


      els.taskText.focus();

    } catch (error) {

      console.error(
        error
      );


      showToast(
        error?.code ===
          "permission-denied"

          ? "Firestore permission denied. Publish the rules file."

          : "Could not save task."
      );
    }

  }
);


$$(
  "[data-task-status]"
).forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        taskStatusFilter =
          button.dataset
            .taskStatus;


        $$(
          "[data-task-status]"
        ).forEach(
          other => {

            other.classList.toggle(
              "active",
              other ===
                button
            );

          }
        );


        renderTasks();

      }
    );

  }
);


els.categoryFilter.addEventListener(
  "change",
  () => {

    taskCategoryFilter =
      els.categoryFilter
        .value;

    renderTasks();
  }
);


// ============================================================
// NOTES
// ============================================================

function renderNotes() {

  if (
    els.scratchpad.value !==
    noteContent
  ) {

    els.scratchpad.value =
      noteContent;
  }


  els.noteCount
    .textContent =
    `${noteContent.length.toLocaleString()} characters`;
}


els.scratchpad.addEventListener(
  "input",
  () => {

    noteContent =
      els.scratchpad.value;


    els.noteCount
      .textContent =
      `${noteContent.length.toLocaleString()} characters`;


    if (!currentUser) {
      return;
    }


    els.noteSaveState.textContent =
      "Saving…";


    clearTimeout(
      noteSaveTimer
    );


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
                content:
                  noteContent,

                updatedAt:
                  serverTimestamp()
              },
              {
                merge:true
              }
            );


            els.noteSaveState.textContent =
              "Saved to cloud";

          } catch (error) {

            console.error(
              error
            );

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

    noteContent =
      "";


    renderNotes();


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
          content:
            "",

          updatedAt:
            serverTimestamp()
        },
        {
          merge:true
        }
      );


      els.noteSaveState.textContent =
        "Saved to cloud";

    } catch (error) {

      console.error(
        error
      );


      showToast(
        "Could not clear cloud notes."
      );
    }

  }
);


// ============================================================
// LINKS
// ============================================================

function renderLinks() {

  els.linkGrid.innerHTML =
    quickLinks
      .map(
        link => `
          <div class="link-card">

            <a
              href="${escapeHtml(
                link.url
              )}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open ${escapeHtml(
                link.title
              )}"
              style="
                position:absolute;
                inset:0;
                z-index:1
              "
            ></a>


            <div
              class="link-top"
              style="
                position:relative;
                z-index:2;
                pointer-events:none
              "
            >

              <div class="link-icon">
                ${escapeHtml(
                  link.icon ||
                  link.title
                    ?. [0]
                    ?.toUpperCase() ||
                  "↗"
                )}
              </div>


              <button
                class="delete-link"
                data-delete-link="${escapeHtml(
                  link.id
                )}"
                style="
                  pointer-events:auto
                "
              >
                ×
              </button>

            </div>


            <div
              style="
                position:relative;
                z-index:2;
                pointer-events:none
              "
            >

              <div class="link-name">
                ${escapeHtml(
                  link.title
                )}
              </div>

              <div class="link-url">
                ${escapeHtml(
                  (
                    link.url ||
                    ""
                  ).replace(
                    /^https?:\/\//,
                    ""
                  )
                )}
              </div>

            </div>

          </div>
        `
      )
      .join("");
}


els.linkGrid.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "[data-delete-link]"
      );


    if (!button) {
      return;
    }


    event.preventDefault();

    event.stopPropagation();


    try {

      await deleteDoc(
        userDoc(
          "quick_links",
          button.dataset
            .deleteLink
        )
      );


      showToast(
        "Link removed."
      );

    } catch (error) {

      console.error(
        error
      );


      showToast(
        "Could not remove link."
      );
    }

  }
);


function openLinkModal() {

  els.linkForm.reset();

  els.modalBackdrop
    .classList.remove(
      "hidden"
    );

  els.linkTitle.focus();
}


function closeLinkModal() {

  els.modalBackdrop
    .classList.add(
      "hidden"
    );
}


els.addLinkBtn.addEventListener(
  "click",
  () => {

    if (!currentUser) {

      showToast(
        "Sign in first to customize cloud links."
      );

      return;
    }


    openLinkModal();
  }
);


els.closeLinkModal
  .addEventListener(
    "click",
    closeLinkModal
  );


els.cancelLinkBtn
  .addEventListener(
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
      els.linkTitle.value
        .trim();


    const url =
      els.linkUrl.value
        .trim();


    const color =
      els.linkColor.value;


    if (
      !title ||
      !url
    ) {
      return;
    }


    try {

      await addDoc(
        userCollection(
          "quick_links"
        ),
        {
          title,
          url,
          color,
          icon:
            title[0]
              .toUpperCase(),

          createdAt:
            serverTimestamp()
        }
      );


      closeLinkModal();


      showToast(
        "Quick link saved."
      );

    } catch (error) {

      console.error(
        error
      );


      showToast(
        "Could not save link."
      );
    }

  }
);


// ============================================================
// ANALYTICS
// ============================================================

function calculateAnalytics() {

  const now =
    new Date();


  const today =
    localDateKey(
      now
    );


  const start =
    new Date(now);


  start.setHours(
    0,
    0,
    0,
    0
  );


  start.setDate(
    start.getDate() - 6
  );


  let todayMinutes =
    0;


  let weekMinutes =
    0;


  const days =
    new Set();


  for (
    const log
    of studyLogs
  ) {

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


    if (
      localDateKey(
        date
      ) === today
    ) {

      todayMinutes +=
        minutes;
    }


    if (
      date >= start &&
      date <= now
    ) {

      weekMinutes +=
        minutes;
    }


    if (
      minutes > 0
    ) {

      days.add(
        localDateKey(
          date
        )
      );
    }

  }


  let streak =
    0;


  const cursor =
    new Date(now);


  cursor.setHours(
    0,
    0,
    0,
    0
  );


  while (
    days.has(
      localDateKey(
        cursor
      )
    )
  ) {

    streak +=
      1;


    cursor.setDate(
      cursor.getDate() - 1
    );
  }


  const completion =
    tasks.length

      ? Math.round(
          tasks.filter(
            task =>
              task.completed
          ).length /
          tasks.length *
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


  const todaySessions =
    studyLogs.filter(
      log => {

        const date =
          parseStoredDate(
            log.timestamp
          );


        return (
          date &&
          localDateKey(
            date
          ) ===
            localDateKey()
        );

      }
    ).length;


  els.focusToday.textContent =
    `${stats.todayMinutes}m`;


  els.focusStreak.textContent =
    `${stats.streak}d`;


  els.focusSessions.textContent =
    String(
      todaySessions
    );


  els.analyticsToday.textContent =
    `${stats.todayMinutes}m`;


  els.analyticsWeek.textContent =
    `${stats.weekMinutes}m`;


  els.analyticsStreak.textContent =
    `${stats.streak}d`;


  els.analyticsCompletion.textContent =
    `${stats.completion}%`;


  els.clockFocus.textContent =
    `${stats.todayMinutes}m`;


  const milestones =
    [
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


  els.nextMilestone.textContent =
    next

      ? `${next - stats.todayMinutes}m until today's ${next}m milestone.`

      : "Every milestone cleared today.";
}


els.clearStudyLogsBtn.addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      !studyLogs.length
    ) {
      return;
    }


    if (
      !window.confirm(
        "Delete all study history for this account?"
      )
    ) {
      return;
    }


    try {

      const batch =
        writeBatch(db);


      studyLogs.forEach(
        log => {

          batch.delete(
            userDoc(
              "study_logs",
              log.id
            )
          );

        }
      );


      await batch.commit();


      showToast(
        "Study history cleared."
      );

    } catch (error) {

      console.error(
        error
      );


      showToast(
        "Could not clear study history."
      );
    }

  }
);


// ============================================================
// MORE SHEET
// ============================================================

function openMoreSheet() {

  moreOpen =
    true;


  els.moreBackdrop
    .classList.remove(
      "hidden"
    );


  syncTimerInputs();

  renderLayoutManager();

  applyAppearance();
}


function closeMoreSheet() {

  moreOpen =
    false;


  els.moreBackdrop
    .classList.add(
      "hidden"
    );


  applyViewState(
    currentView ===
      "more"

      ? "overview"

      : currentView
  );
}


els.closeMore.addEventListener(
  "click",
  closeMoreSheet
);


els.moreBackdrop.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      els.moreBackdrop
    ) {

      closeMoreSheet();
    }

  }
);


$$(
  "[data-sheet-view]"
).forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const view =
          button.dataset
            .sheetView;


        closeMoreSheet();


        animateViewChange(
          view
        );
      }
    );

  }
);


// ============================================================
// FIREBASE
// ============================================================

function clearListeners() {

  unsubscribeFns.forEach(
    unsubscribe =>
      unsubscribe()
  );


  unsubscribeFns =
    [];
}


async function seedLinksIfEmpty() {

  const snapshot =
    await getDocs(
      query(
        userCollection(
          "quick_links"
        ),
        limit(1)
      )
    );


  if (
    !snapshot.empty
  ) {
    return;
  }


  const batch =
    writeBatch(db);


  DEFAULT_LINKS.forEach(
    link => {

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
  );


  await batch.commit();
}


function startRealtimeListeners() {

  clearListeners();


  if (!currentUser) {
    return;
  }


  const taskQuery =
    query(
      userCollection(
        "tasks"
      ),
      orderBy(
        "createdAt",
        "desc"
      ),
      limit(250)
    );


  const linkQuery =
    query(
      userCollection(
        "quick_links"
      ),
      orderBy(
        "createdAt",
        "asc"
      ),
      limit(100)
    );


  const logQuery =
    query(
      userCollection(
        "study_logs"
      ),
      orderBy(
        "timestamp",
        "desc"
      ),
      limit(500)
    );


  unsubscribeFns.push(

    onSnapshot(
      taskQuery,

      snapshot => {

        tasks =
          snapshot.docs.map(
            d => ({
              id:
                d.id,

              ...d.data()
            })
          );


        renderTasks();
      },

      error => {

        console.error(
          "Tasks:",
          error
        );


        showToast(
          error?.code ===
            "failed-precondition"

            ? "Firestore needs an index for this query."

            : "Task sync failed."
        );
      }
    ),


    onSnapshot(
      linkQuery,

      snapshot => {

        quickLinks =
          snapshot.docs.map(
            d => ({
              id:
                d.id,

              ...d.data()
            })
          );


        renderLinks();

      },

      error =>
        console.error(
          "Links:",
          error
        )
    ),


    onSnapshot(
      logQuery,

      snapshot => {

        studyLogs =
          snapshot.docs.map(
            d => ({
              id:
                d.id,

              ...d.data()
            })
          );


        renderAnalytics();

      },

      error => {

        console.error(
          "Study logs:",
          error
        );


        showToast(
          "Study analytics sync failed."
        );
      }
    ),


    onSnapshot(
      userDoc(
        "scratchpad",
        "main"
      ),

      snapshot => {

        noteContent =
          snapshot.exists()

            ? (
                snapshot
                  .data()
                  .content ||
                ""
              )

            : "";


        els.noteSaveState
          .textContent =
          snapshot.exists()
            ? "Saved to cloud"
            : "Ready";


        renderNotes();

      },

      error => {

        console.error(
          "Notes:",
          error
        );


        els.noteSaveState
          .textContent =
          "Unavailable";
      }
    ),


    onSnapshot(
      prefsDoc(),

      snapshot => {

        if (
          snapshot.exists()
        ) {

          preferences =
            normalizePreferences(
              snapshot.data()
            );

        } else {

          preferences =
            cloneDefaults();
        }


        applyAppearance();

        applyLayout();

        syncTimerInputs();

        updateTimerIfIdle();

        renderLayoutManager();

        requestAnimationFrame(
          moveDockGlide
        );

      },

      error => {

        console.error(
          "Preferences:",
          error
        );


        showToast(
          "Personalization settings could not sync."
        );
      }
    )

  );
}


// ============================================================
// AUTH UI
// ============================================================

function setSignedOutUI() {

  clearListeners();


  currentUser =
    null;


  tasks =
    [];


  studyLogs =
    [];


  quickLinks =
    [];


  preferences =
    cloneDefaults();


  noteContent =
    "";


  renderTasks();

  renderAnalytics();

  renderLinks();

  renderNotes();

  applyAppearance();

  applyLayout();

  syncTimerInputs();


  els.scratchpad.disabled =
    true;


  els.noteSaveState.textContent =
    "Not connected";


  els.signInBtn.classList.remove(
    "hidden"
  );


  els.userChip.classList.add(
    "hidden"
  );


  setConnectionStatus(
    "Offline mode",
    false
  );
}


async function setSignedInUI(
  user
) {

  currentUser =
    user;


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
  }


  els.scratchpad.disabled =
    false;


  setConnectionStatus(
    "Loading cloud workspace…",
    false
  );


  try {

    await seedLinksIfEmpty();


    startRealtimeListeners();


    setConnectionStatus(
      `Synced as ${
        user.displayName ||
        user.email ||
        "student"
      }`,
      true
    );


  } catch (error) {

    console.error(
      "Workspace:",
      error
    );


    setConnectionStatus(
      "Firebase connected, workspace failed",
      false
    );


    showToast(
      error?.code ===
        "permission-denied"

        ? "Firebase denied access. Publish the Firestore rules."

        : "Could not load your cloud workspace."
    );
  }
}


// ============================================================
// SIGN IN
// ============================================================

els.signInBtn.addEventListener(
  "click",
  async () => {

    try {

      await signInWithPopup(
        auth,
        provider
      );

    } catch (error) {

      console.error(
        "Sign-in:",
        error
      );


      if (
        error.code ===
        "auth/unauthorized-domain"
      ) {

        showToast(
          "Unauthorized domain: add this site's domain in Firebase → Authentication → Settings → Authorized domains."
        );

      } else if (
        error.code ===
        "auth/operation-not-allowed"
      ) {

        showToast(
          "Google sign-in is disabled in Firebase Authentication."
        );

      } else if (
        error.code ===
        "auth/popup-blocked"
      ) {

        showToast(
          "Your browser blocked the login popup."
        );

      } else if (
        error.code !==
        "auth/popup-closed-by-user"
      ) {

        showToast(
          `Login failed: ${
            error.code ||
            "unknown error"
          }`
        );
      }
    }
  }
);


// ============================================================
// SIGN OUT
// ============================================================

els.signOutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(
        auth
      );


      showToast(
        "Signed out."
      );

    } catch (error) {

      console.error(
        error
      );


      showToast(
        "Sign out failed."
      );
    }
  }
);


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,

  user => {

    if (user) {

      setSignedInUI(
        user
      );

    } else {

      setSignedOutUI();

    }
  }
);


// ============================================================
// INITIAL UI
// ============================================================

renderTasks();

renderAnalytics();

renderLinks();

renderNotes();

applyAppearance();

applyLayout();

syncTimerInputs();

renderLayoutManager();

applyViewState(
  "overview"
);


window.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      if (moreOpen) {
        closeMoreSheet();
      }


      if (
        !els.modalBackdrop
          .classList
          .contains(
            "hidden"
          )
      ) {

        closeLinkModal();
      }
    }

  }
);