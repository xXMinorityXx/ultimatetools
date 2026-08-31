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


/* ============================================================
   FIREBASE
   ============================================================ */

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
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


/* ============================================================
   DOM
   ============================================================ */

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const els = {
  dashboard: $("#dashboard"),

  greeting: $("#greeting"),
  heroDate: $("#heroDate"),
  syncStatus: $("#syncStatus"),
  connectionDot: $("#connectionDot"),

  signInBtn: $("#signInBtn"),
  signOutBtn: $("#signOutBtn"),
  userChip: $("#userChip"),
  userAvatar: $("#userAvatar"),
  userName: $("#userName"),

  clockTime: $("#clockTime"),
  clockAmPm: $("#clockAmPm"),
  clockDate: $("#clockDate"),
  clockOpen: $("#clockOpen"),
  clockDone: $("#clockDone"),
  clockFocus: $("#clockFocus"),

  timerOrb: $("#timerOrb"),
  timerDisplay: $("#timerDisplay"),
  timerCaption: $("#timerCaption"),
  timerPill: $("#timerPill"),
  timerStart: $("#timerStart"),
  timerReset: $("#timerReset"),

  focusToday: $("#focusToday"),
  focusStreak: $("#focusStreak"),
  focusSessions: $("#focusSessions"),

  nextList: $("#nextList"),
  goTasksBtn: $("#goTasksBtn"),

  taskForm: $("#taskForm"),
  taskText: $("#taskText"),
  taskCategory: $("#taskCategory"),
  taskPriority: $("#taskPriority"),
  taskDue: $("#taskDue"),
  taskCountBadge: $("#taskCountBadge"),
  taskList: $("#taskList"),
  categoryFilter: $("#categoryFilter"),

  scratchpad: $("#scratchpad"),
  noteSaveState: $("#noteSaveState"),
  noteCount: $("#noteCount"),
  clearNotesBtn: $("#clearNotesBtn"),

  linkGrid: $("#linkGrid"),
  addLinkBtn: $("#addLinkBtn"),

  analyticsToday: $("#analyticsToday"),
  analyticsWeek: $("#analyticsWeek"),
  analyticsStreak: $("#analyticsStreak"),
  analyticsCompletion: $("#analyticsCompletion"),
  nextMilestone: $("#nextMilestone"),
  clearStudyLogsBtn: $("#clearStudyLogsBtn"),

  liquidDock: $("#liquidDock"),
  dockGlide: $("#dockGlide"),

  moreBackdrop: $("#moreBackdrop"),
  closeMore: $("#closeMore"),

  themeSelect: $("#themeSelect"),
  accentPicker: $("#accentPicker"),
  layoutManager: $("#layoutManager"),
  resetLayoutBtn: $("#resetLayoutBtn"),

  focusMinutesInput: $("#focusMinutesInput"),
  shortMinutesInput: $("#shortMinutesInput"),
  longMinutesInput: $("#longMinutesInput"),

  modalBackdrop: $("#modalBackdrop"),
  closeLinkModal: $("#closeLinkModal"),
  cancelLinkBtn: $("#cancelLinkBtn"),
  linkForm: $("#linkForm"),
  linkTitle: $("#linkTitle"),
  linkUrl: $("#linkUrl"),
  linkColor: $("#linkColor"),

  toast: $("#toast")
};


/* ============================================================
   DEFAULTS / STATE
   ============================================================ */

const DEFAULT_PREFERENCES = {
  theme: "midnight",
  accent: "blue",

  widgetOrder: [
    "clock",
    "focus",
    "next",
    "tasks",
    "notes",
    "links",
    "analytics"
  ],

  hiddenWidgets: [],

  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15
};

const WIDGET_NAMES = {
  clock: "Clock",
  focus: "Focus",
  next: "Next up",
  tasks: "Tasks",
  notes: "Notes",
  links: "Launchpad",
  analytics: "Analytics"
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

let currentUser = null;

let unsubscribeFns = [];

let tasks = [];
let studyLogs = [];
let quickLinks = [];

let preferences = clone(DEFAULT_PREFERENCES);

let noteContent = "";

let taskStatus =
  "active";

let taskCategory =
  "all";

let currentView =
  "overview";

let timerMode =
  "focus";

let timerRunning =
  false;

let timerSeconds =
  25 * 60;

let timerInterval =
  null;

let noteTimer =
  null;

let preferenceTimer =
  null;


/* ============================================================
   HELPERS
   ============================================================ */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2600);
}

function setSync(message, good = false) {
  els.syncStatus.textContent = message;
  els.connectionDot.classList.toggle("good", good);
}

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function parseDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const date = value instanceof Date
    ? value
    : new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric"
    }
  ).format(date);
}

function userCollection(name) {
  if (!currentUser) {
    throw new Error("Not signed in.");
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
    throw new Error("Not signed in.");
  }

  return doc(
    db,
    "users",
    currentUser.uid,
    collectionName,
    id
  );
}

function preferencesDoc() {
  return userDoc(
    "settings",
    "preferences"
  );
}


/* ============================================================
   CLOCK
   ============================================================ */

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const h = hour % 12 || 12;

  els.clockTime.textContent =
    `${h}:${String(now.getMinutes()).padStart(2, "0")}`;

  els.clockAmPm.textContent =
    hour >= 12
      ? "PM"
      : "AM";

  els.clockDate.textContent =
    new Intl.DateTimeFormat(
      undefined,
      {
        weekday: "short",
        month: "short",
        day: "numeric"
      }
    ).format(now);

  els.heroDate.textContent =
    `${formatDate(now)} · ${
      new Intl.DateTimeFormat(
        undefined,
        {
          timeZoneName: "short"
        }
      )
        .formatToParts(now)
        .find(
          part =>
            part.type === "timeZoneName"
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
setInterval(updateClock, 1000);


/* ============================================================
   TIMER
   ============================================================ */

function secondsFor(mode) {
  if (mode === "short") {
    return preferences.shortBreakMinutes * 60;
  }

  if (mode === "long") {
    return preferences.longBreakMinutes * 60;
  }

  return preferences.focusMinutes * 60;
}

function timerInfo(mode) {
  if (mode === "short") {
    return {
      label: "Reset your brain",
      pill: "SHORT BREAK"
    };
  }

  if (mode === "long") {
    return {
      label: "Long recovery",
      pill: "LONG BREAK"
    };
  }

  return {
    label: "Deep work",
    pill: "FOCUS"
  };
}

function renderTimer() {
  const minutes =
    Math.floor(timerSeconds / 60);

  const seconds =
    timerSeconds % 60;

  const info =
    timerInfo(timerMode);

  els.timerDisplay.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  els.timerCaption.textContent =
    info.label;

  els.timerPill.textContent =
    info.pill;

  els.timerStart.textContent =
    timerRunning
      ? "Pause"
      : "Start";

  els.timerOrb.classList.toggle(
    "running",
    timerRunning
  );

  $$("[data-timer-mode]").forEach(
    button => {
      button.classList.toggle(
        "active",
        button.dataset.timerMode === timerMode
      );
    }
  );
}

function setTimerMode(mode) {
  timerRunning = false;

  clearInterval(timerInterval);

  timerInterval = null;

  timerMode = mode;

  timerSeconds = secondsFor(mode);

  renderTimer();
}

async function finishTimer() {
  timerRunning = false;

  clearInterval(timerInterval);

  timerInterval = null;

  renderTimer();

  if (timerMode === "focus") {

    if (!currentUser) {
      toast(
        "Focus session finished. Sign in to save study history."
      );
    } else {
      try {
        await addDoc(
          userCollection("study_logs"),
          {
            duration:
              preferences.focusMinutes,

            timestamp:
              serverTimestamp()
          }
        );

        toast(
          "Focus session saved."
        );
      } catch (error) {
        console.error(error);

        toast(
          "Session finished, but the cloud log failed."
        );
      }
    }

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

    timerInterval =
      setInterval(
        () => {

          timerSeconds--;

          if (
            timerSeconds <= 0
          ) {
            timerSeconds = 0;
            renderTimer();
            finishTimer();
          } else {
            renderTimer();
          }

        },
        1000
      );
  }

  renderTimer();
}

function resetTimer() {
  timerRunning = false;

  clearInterval(timerInterval);

  timerInterval = null;

  timerSeconds =
    secondsFor(timerMode);

  renderTimer();
}

$$("[data-timer-mode]").forEach(
  button => {
    button.addEventListener(
      "click",
      () =>
        setTimerMode(
          button.dataset.timerMode
        )
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


/* ============================================================
   PERSONALIZATION
   ============================================================ */

function normalizePreferences(raw) {
  const source =
    raw || {};

  const merged = {
    ...clone(DEFAULT_PREFERENCES),
    ...source
  };

  const requestedOrder =
    Array.isArray(
      source.widgetOrder
    )
      ? source.widgetOrder
      : [];

  merged.widgetOrder =
    [
      ...new Set([
        ...requestedOrder,
        ...DEFAULT_PREFERENCES.widgetOrder
      ])
    ]
    .filter(
      id =>
        DEFAULT_PREFERENCES.widgetOrder
          .includes(id)
    );

  merged.hiddenWidgets =
    Array.isArray(
      source.hiddenWidgets
    )
      ? source.hiddenWidgets.filter(
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

  $$("#accentPicker button").forEach(
    button => {
      button.style.boxShadow =
        button.dataset.accent ===
        preferences.accent
          ? "0 0 0 3px rgba(255,255,255,.20)"
          : "none";
    }
  );
}

function applyWidgetOrder() {
  for (
    const id of preferences.widgetOrder
  ) {

    const widget =
      document.querySelector(
        `[data-widget-id="${id}"]`
      );

    if (widget) {
      els.dashboard.appendChild(
        widget
      );
    }
  }

  $$(".widget").forEach(
    widget => {

      const hidden =
        preferences.hiddenWidgets
          .includes(
            widget.dataset.widgetId
          );

      widget.classList.toggle(
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
                  WIDGET_NAMES[id]
                )}
                ${hidden ? " · hidden" : ""}
              </span>

              <button
                data-layout-action="up"
                ${index === 0 ? "disabled" : ""}
              >↑</button>

              <button
                data-layout-action="down"
                ${index === preferences.widgetOrder.length - 1 ? "disabled" : ""}
              >↓</button>

              <button
                data-layout-action="toggle"
              >
                ${hidden ? "○" : "●"}
              </button>
            </div>
          `;
        }
      )
      .join("");
}

function savePreferences() {
  if (!currentUser) {
    return;
  }

  clearTimeout(
    preferenceTimer
  );

  preferenceTimer =
    setTimeout(
      async () => {

        try {

          await setDoc(
            preferencesDoc(),
            {
              ...preferences,
              updatedAt:
                serverTimestamp()
            },
            {
              merge: true
            }
          );

        } catch (error) {

          console.error(
            "Preference save:",
            error
          );

          toast(
            "Could not save your layout."
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
      [key]: value
    });

  applyAppearance();
  applyWidgetOrder();
  renderLayoutManager();
  updateTimerIfIdle();

  savePreferences();
}

function updateTimerIfIdle() {
  if (!timerRunning) {
    timerSeconds =
      secondsFor(timerMode);

    renderTimer();
  }
}

els.themeSelect.addEventListener(
  "change",
  () =>
    updatePreference(
      "theme",
      els.themeSelect.value
    )
);

$$(
  "#accentPicker button"
).forEach(
  button => {
    button.addEventListener(
      "click",
      () =>
        updatePreference(
          "accent",
          button.dataset.accent
        )
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

    if (!row) {
      return;
    }

    const id =
      row.dataset.layoutId;

    const index =
      preferences.widgetOrder
        .indexOf(id);

    const action =
      button.dataset.layoutAction;

    if (action === "toggle") {

      const hidden =
        new Set(
          preferences.hiddenWidgets
        );

      if (hidden.has(id)) {
        hidden.delete(id);
      } else {
        hidden.add(id);
      }

      if (
        hidden.size ===
        preferences.widgetOrder.length
      ) {
        hidden.delete(id);
      }

      updatePreference(
        "hiddenWidgets",
        [...hidden]
      );

      return;
    }

    const order =
      [...preferences.widgetOrder];

    if (
      action === "up" &&
      index > 0
    ) {

      [
        order[index - 1],
        order[index]
      ] = [
        order[index],
        order[index - 1]
      ];

      updatePreference(
        "widgetOrder",
        order
      );

      return;
    }

    if (
      action === "down" &&
      index <
        order.length - 1
    ) {

      [
        order[index],
        order[index + 1]
      ] = [
        order[index + 1],
        order[index]
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
      clone(
        DEFAULT_PREFERENCES
      );

    applyAppearance();
    applyWidgetOrder();
    renderLayoutManager();
    updateTimerIfIdle();
    savePreferences();

    toast("Layout reset.");
  }
);

const timerInputMap = {
  focusMinutesInput:
    "focusMinutes",

  shortMinutesInput:
    "shortBreakMinutes",

  longMinutesInput:
    "longBreakMinutes"
};

[
  els.focusMinutesInput,
  els.shortMinutesInput,
  els.longMinutesInput
].forEach(
  input => {

    input.addEventListener(
      "change",
      () => {

        const key =
          timerInputMap[input.id];

        let value =
          Number(input.value);

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

function syncTimerInputs() {
  els.focusMinutesInput.value =
    preferences.focusMinutes;

  els.shortMinutesInput.value =
    preferences.shortBreakMinutes;

  els.longMinutesInput.value =
    preferences.longBreakMinutes;
}


/* ============================================================
   DRAG TO REORDER
   Touch + mouse pointer implementation
   ============================================================ */

let dragState = null;

function widgetAtPoint(
  x,
  y
) {

  const elements =
    document.elementsFromPoint(
      x,
      y
    );

  return elements.find(
    element =>
      element.classList &&
      element.classList.contains(
        "widget"
      ) &&
      element !==
        dragState?.element &&
      !element.classList.contains(
        "hidden"
      )
  );
}

function beginDrag(
  element,
  event
) {

  if (
    event.pointerType ===
    "mouse" &&
    event.button !== 0
  ) {
    return;
  }

  if (
    event.target.closest(
      "button, input, textarea, select, a"
    )
  ) {
    return;
  }

  dragState = {
    element,
    pointerId:
      event.pointerId,

    startX:
      event.clientX,

    startY:
      event.clientY,

    active: false
  };
}

function activateDrag(
  event
) {

  if (!dragState) {
    return;
  }

  const dx =
    event.clientX -
    dragState.startX;

  const dy =
    event.clientY -
    dragState.startY;

  if (
    !dragState.active &&
    Math.hypot(dx, dy) < 8
  ) {
    return;
  }

  if (
    !dragState.active
  ) {

    dragState.active = true;

    dragState.element.classList.add(
      "dragging"
    );

    dragState.element.setPointerCapture?.(
      dragState.pointerId
    );
  }

  const target =
    widgetAtPoint(
      event.clientX,
      event.clientY
    );

  $$(".widget.drop-target")
    .forEach(
      item =>
        item.classList.remove(
          "drop-target"
        )
    );

  if (target) {
    target.classList.add(
      "drop-target"
    );
  }
}

function finishDrag(
  event
) {

  if (!dragState) {
    return;
  }

  const dragged =
    dragState.element;

  const active =
    dragState.active;

  const target =
    active
      ? widgetAtPoint(
          event.clientX,
          event.clientY
        )
      : null;

  dragged.classList.remove(
    "dragging"
  );

  $$(".widget.drop-target")
    .forEach(
      item =>
        item.classList.remove(
          "drop-target"
        )
    );

  if (
    active &&
    target
  ) {

    const draggedId =
      dragged.dataset.widgetId;

    const targetId =
      target.dataset.widgetId;

    const order =
      [...preferences.widgetOrder];

    const from =
      order.indexOf(
        draggedId
      );

    const to =
      order.indexOf(
        targetId
      );

    if (
      from !== -1 &&
      to !== -1 &&
      from !== to
    ) {

      order.splice(
        from,
        1
      );

      const rect =
        target.getBoundingClientRect();

      const insertAfter =
        event.clientY >
        rect.top +
          rect.height /
            2;

      let insertion =
        to;

      if (
        from <
        to
      ) {
        insertion =
          insertAfter
            ? to
            : Math.max(
                0,
                to - 1
              );
      } else {
        insertion =
          insertAfter
            ? to + 1
            : to;
      }

      insertion =
        Math.max(
          0,
          Math.min(
            order.length,
            insertion
          )
        );

      order.splice(
        insertion,
        0,
        draggedId
      );

      preferences =
        normalizePreferences({
          ...preferences,
          widgetOrder: order
        });

      applyWidgetOrder();
      renderLayoutManager();
      savePreferences();

      toast(
        "Layout saved."
      );
    }
  }

  dragState = null;
}

$$(".widget").forEach(
  widget => {

    widget.addEventListener(
      "pointerdown",
      event =>
        beginDrag(
          widget,
          event
        )
    );

    widget.addEventListener(
      "pointermove",
      activateDrag
    );

    widget.addEventListener(
      "pointerup",
      finishDrag
    );

    widget.addEventListener(
      "pointercancel",
      finishDrag
    );
  }
);


/* ============================================================
   VIEW NAVIGATION
   ============================================================ */

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

function showView(view) {

  currentView =
    view;

  const visible =
    preferences.hiddenWidgets;

  $$(".widget").forEach(
    widget => {

      const id =
        widget.dataset.widgetId;

      const hidden =
        visible.includes(id);

      let show =
        !hidden;

      if (
        view ===
        "overview"
      ) {
        show =
          !hidden;

      } else if (
        view ===
        "focus"
      ) {
        show =
          !hidden &&
          [
            "focus",
            "analytics"
          ].includes(id);

      } else if (
        view ===
        "tasks"
      ) {
        show =
          !hidden &&
          [
            "next",
            "tasks"
          ].includes(id);

      } else if (
        view ===
        "notes"
      ) {
        show =
          !hidden &&
          id ===
            "notes";
      } else if (
        view ===
        "links"
      ) {
        show =
          !hidden &&
          id ===
            "links";
      } else if (
        view ===
        "analytics"
      ) {
        show =
          !hidden &&
          id ===
            "analytics";
      }

      widget.classList.toggle(
        "hidden",
        !show
      );
    }
  );

  $$(".dock-item").forEach(
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

$$(".dock-item").forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const view =
          button.dataset.view;

        if (
          view ===
          "more"
        ) {
          els.moreBackdrop.classList.remove(
            "hidden"
          );

          syncTimerInputs();
          renderLayoutManager();
          applyAppearance();

          return;
        }

        showView(view);
      }
    );
  }
);

els.goTasksBtn.addEventListener(
  "click",
  () =>
    showView("tasks")
);

window.addEventListener(
  "resize",
  moveDockGlide
);


/* ============================================================
   POINTER-BASED GLASS LIGHT
   This is intentionally broader than a hover glow:
   every glass surface gets a slowly interpolated light field.
   ============================================================ */

document.addEventListener(
  "pointermove",
  event => {

    const surfaces =
      document.elementsFromPoint(
        event.clientX,
        event.clientY
      );

    const surface =
      surfaces.find(
        element =>
          element.matches?.(
            ".glass-panel, .liquid-surface, .liquid-dock"
          )
      );

    if (!surface) {
      return;
    }

    const rect =
      surface.getBoundingClientRect();

    const x =
      ((event.clientX -
        rect.left) /
        rect.width) *
      100;

    const y =
      ((event.clientY -
        rect.top) /
        rect.height) *
      100;

    surface.style.setProperty(
      "--mx",
      `${x}%`
    );

    surface.style.setProperty(
      "--my",
      `${y}%`
    );
  }
);


/* ============================================================
   NOTES
   ============================================================ */

function renderNotes() {

  if (
    els.scratchpad.value !==
    noteContent
  ) {

    els.scratchpad.value =
      noteContent;
  }

  els.noteCount.textContent =
    `${noteContent.length.toLocaleString()} characters`;
}

els.scratchpad.addEventListener(
  "input",
  () => {

    noteContent =
      els.scratchpad.value;

    renderNotes();

    if (!currentUser) {
      return;
    }

    els.noteSaveState.textContent =
      "Saving…";

    clearTimeout(noteTimer);

    noteTimer =
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
                merge: true
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
          merge: true
        }
      );

      els.noteSaveState.textContent =
        "Saved to cloud";

    } catch (error) {

      console.error(
        error
      );

      toast(
        "Could not clear cloud notes."
      );
    }
  }
);


/* ============================================================
   TASKS
   ============================================================ */

function renderNextTasks() {

  const upcoming =
    tasks
      .filter(
        task =>
          !task.completed
      )
      .slice(0, 3);

  if (!upcoming.length) {

    els.nextList.innerHTML =
      `
        <div class="empty-state">
          ${
            currentUser
              ? "No active tasks. You're clear."
              : "Sign in to see what's next."
          }
        </div>
      `;

    return;
  }

  els.nextList.innerHTML =
    upcoming
      .map(
        task => {

          const due =
            parseDate(
              task.dueAt
            );

          return `
            <div
              class="next-item"
              data-next-task="${escapeHtml(
                task.id
              )}"
            >
              <button
                class="next-check"
                data-next-complete="${escapeHtml(
                  task.id
                )}"
              ></button>

              <div>
                <div class="next-title">
                  ${escapeHtml(
                    task.text
                  )}
                </div>

                <div class="next-meta">
                  ${escapeHtml(
                    task.category ||
                    "School"
                  )}
                  ${
                    due
                      ? ` · Due ${escapeHtml(
                          formatDate(
                            due
                          )
                        )}`
                      : ""
                  }
                </div>
              </div>

              <span class="next-arrow">›</span>
            </div>
          `;
        }
      )
      .join("");
}

els.nextList.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "[data-next-complete]"
      );

    if (!button) {
      return;
    }

    try {

      await updateDoc(
        userDoc(
          "tasks",
          button.dataset
            .nextComplete
        ),
        {
          completed:
            true,

          completedAt:
            serverTimestamp()
        }
      );

    } catch (error) {

      console.error(
        error
      );

      toast(
        "Could not update that task."
      );
    }
  }
);

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

  els.taskCountBadge.textContent =
    activeCount;

  els.clockOpen.textContent =
    activeCount;

  els.clockDone.textContent =
    doneCount;

  let visible =
    tasks.filter(
      task => {

        const statusMatches =
          taskStatus ===
          "all"
            ? true
            : taskStatus ===
              "active"
                ? !task.completed
                : task.completed;

        const categoryMatches =
          taskCategory ===
          "all"
            ? true
            : task.category ===
              taskCategory;

        return (
          statusMatches &&
          categoryMatches
        );
      }
    );

  if (!visible.length) {

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

  } else {

    els.taskList.innerHTML =
      visible
        .map(
          task => {

            const due =
              parseDate(
                task.dueAt
              );

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

                    <span class="tag">
                      ${escapeHtml(
                        task.category ||
                        "School"
                      )}
                    </span>

                    <span
                      class="tag ${
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
                          <span class="tag due">
                            Due ${escapeHtml(
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
                  aria-label="Delete task"
                >
                  ×
                </button>
              </div>
            `;
          }
        )
        .join("");
  }

  renderNextTasks();
  renderAnalytics();
}

els.taskList.addEventListener(
  "click",
  async event => {

    const toggle =
      event.target.closest(
        "[data-task-toggle]"
      );

    const remove =
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

      if (remove) {

        await deleteDoc(
          userDoc(
            "tasks",
            remove.dataset
              .taskDelete
          )
        );
      }

    } catch (error) {

      console.error(
        error
      );

      toast(
        "Task update failed."
      );
    }
  }
);

els.taskForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!currentUser) {

      toast(
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

      toast(
        "Task added."
      );

      els.taskText.focus();

    } catch (error) {

      console.error(
        error
      );

      toast(
        "Could not save task."
      );
    }
  }
);

$$("[data-status]").forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        taskStatus =
          button.dataset.status;

        $$("[data-status]")
          .forEach(
            item =>
              item.classList.toggle(
                "active",
                item === button
              )
          );

        renderTasks();
      }
    );
  }
);

els.categoryFilter.addEventListener(
  "change",
  () => {

    taskCategory =
      els.categoryFilter.value;

    renderTasks();
  }
);


/* ============================================================
   ANALYTICS
   ============================================================ */

function calculateAnalytics() {

  const now =
    new Date();

  const today =
    localDateKey(now);

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
      parseDate(
        log.timestamp
      );

    if (!date) {
      continue;
    }

    const minutes =
      Number(
        log.duration ||
        0
      );

    const key =
      localDateKey(
        date
      );

    if (
      key ===
      today
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
      days.add(key);
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

    streak++;

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

  const sessionsToday =
    studyLogs.filter(
      log => {

        const date =
          parseDate(
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
      sessionsToday
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
      m =>
        stats.todayMinutes <
        m
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
        log =>
          batch.delete(
            userDoc(
              "study_logs",
              log.id
            )
          )
      );

      await batch.commit();

      toast(
        "Study history cleared."
      );

    } catch (error) {

      console.error(
        error
      );

      toast(
        "Could not clear study history."
      );
    }
  }
);


/* ============================================================
   LINKS
   ============================================================ */

function accentStyle(
  color
) {
  const map = {
    blue: "121,165,255",
    violet: "166,140,255",
    mint: "112,232,189",
    rose: "255,127,164",
    amber: "255,186,105"
  };

  return (
    map[color] ||
    map.blue
  );
}

function renderLinks() {

  els.linkGrid.innerHTML =
    quickLinks
      .map(
        link => {

          const rgb =
            accentStyle(
              link.color
            );

          return `
            <div
              class="link-card"
              style="--link-rgb:${rgb}"
            >

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
              >
                <div class="link-icon">
                  ${escapeHtml(
                    link.icon ||
                    link.title
                      ?.charAt(0)
                      .toUpperCase() ||
                    "↗"
                  )}
                </div>

                <button
                  class="delete-link"
                  data-delete-link="${escapeHtml(
                    link.id
                  )}"
                  style="
                    position:relative;
                    z-index:2;
                  "
                  aria-label="Delete ${escapeHtml(
                    link.title
                  )}"
                >
                  ×
                </button>
              </div>

              <div>
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
          `;
        }
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

      toast(
        "Link removed."
      );

    } catch (error) {

      console.error(
        error
      );

      toast(
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
      toast(
        "Sign in first to customize links."
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
            title.charAt(0)
              .toUpperCase(),

          createdAt:
            serverTimestamp()
        }
      );

      closeLinkModal();

      toast(
        "Quick link saved."
      );

    } catch (error) {

      console.error(
        error
      );

      toast(
        "Could not save link."
      );
    }
  }
);


/* ============================================================
   MORE SHEET
   ============================================================ */

els.closeMore.addEventListener(
  "click",
  () => {
    els.moreBackdrop
      .classList.add(
        "hidden"
      );
  }
);

els.moreBackdrop.addEventListener(
  "click",
  event => {
    if (
      event.target ===
      els.moreBackdrop
    ) {
      els.moreBackdrop
        .classList.add(
          "hidden"
        );
    }
  }
);

$$("[data-open-view]").forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        els.moreBackdrop
          .classList.add(
            "hidden"
          );

        showView(
          button.dataset
            .openView
        );
      }
    );
  }
);


/* ============================================================
   FIRESTORE
   ============================================================ */

function clearListeners() {

  unsubscribeFns.forEach(
    unsubscribe =>
      unsubscribe()
  );

  unsubscribeFns = [];
}

async function seedDefaultLinks() {

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

function startListeners() {

  clearListeners();

  if (!currentUser) {
    return;
  }

  const tasksQuery =
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

  const linksQuery =
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

  const logsQuery =
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
      tasksQuery,

      snapshot => {

        tasks =
          snapshot.docs.map(
            document => ({
              id:
                document.id,

              ...document.data()
            })
          );

        renderTasks();
      },

      error => {

        console.error(
          "Tasks listener:",
          error
        );

        toast(
          "Task sync failed."
        );
      }
    ),

    onSnapshot(
      linksQuery,

      snapshot => {

        quickLinks =
          snapshot.docs.map(
            document => ({
              id:
                document.id,

              ...document.data()
            })
          );

        renderLinks();
      },

      error =>
        console.error(
          "Links listener:",
          error
        )
    ),

    onSnapshot(
      logsQuery,

      snapshot => {

        studyLogs =
          snapshot.docs.map(
            document => ({
              id:
                document.id,

              ...document.data()
            })
          );

        renderAnalytics();
      },

      error =>
        console.error(
          "Logs listener:",
          error
        )
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

      error =>
        console.error(
          "Notes listener:",
          error
        )
    ),

    onSnapshot(
      preferencesDoc(),

      snapshot => {

        preferences =
          snapshot.exists()
            ? normalizePreferences(
                snapshot.data()
              )
            : clone(
                DEFAULT_PREFERENCES
              );

        applyAppearance();
        applyWidgetOrder();
        syncTimerInputs();
        updateTimerIfIdle();
        renderLayoutManager();

        requestAnimationFrame(
          moveDockGlide
        );
      },

      error => {

        console.error(
          "Preferences listener:",
          error
        );

        toast(
          "Personalization sync failed."
        );
      }
    )
  );
}


/* ============================================================
   AUTH
   ============================================================ */

function signedOutUI() {

  clearListeners();

  currentUser =
    null;

  tasks =
    [];

  studyLogs =
    [];

  quickLinks =
    [];

  noteContent =
    "";

  preferences =
    clone(
      DEFAULT_PREFERENCES
    );

  applyAppearance();
  applyWidgetOrder();
  renderLayoutManager();
  syncTimerInputs();

  renderTasks();
  renderAnalytics();
  renderLinks();
  renderNotes();

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

  setSync(
    "Local mode",
    false
  );
}

async function signedInUI(user) {

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

  setSync(
    "Loading cloud workspace…",
    false
  );

  try {

    await seedDefaultLinks();

    startListeners();

    setSync(
      `Synced as ${
        user.displayName ||
        user.email ||
        "student"
      }`,
      true
    );

  } catch (error) {

    console.error(
      "Workspace load:",
      error
    );

    setSync(
      "Cloud connection failed",
      false
    );

    toast(
      error?.code ===
        "permission-denied"

        ? "Firestore denied access. Publish your rules."

        : "Could not load cloud workspace."
    );
  }
}

els.signInBtn.addEventListener(
  "click",
  async () => {

    try {

      await signInWithPopup(
        auth,
        googleProvider
      );

    } catch (error) {

      console.error(
        "Sign in:",
        error
      );

      if (
        error.code ===
        "auth/unauthorized-domain"
      ) {

        toast(
          "Add this site's domain to Firebase Authentication → Settings → Authorized domains."
        );

      } else if (
        error.code ===
        "auth/operation-not-allowed"
      ) {

        toast(
          "Google sign-in is not enabled."
        );

      } else if (
        error.code ===
        "auth/popup-blocked"
      ) {

        toast(
          "Your browser blocked the login popup."
        );

      } else if (
        error.code !==
        "auth/popup-closed-by-user"
      ) {

        toast(
          `Login failed: ${
            error.code ||
            "unknown error"
          }`
        );
      }
    }
  }
);

els.signOutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(
        auth
      );

      toast(
        "Signed out."
      );

    } catch (error) {

      console.error(
        error
      );

      toast(
        "Sign out failed."
      );
    }
  }
);

onAuthStateChanged(
  auth,
  user => {

    if (user) {
      signedInUI(
        user
      );
    } else {
      signedOutUI();
    }
  }
);


/* ============================================================
   INIT
   ============================================================ */

applyAppearance();
applyWidgetOrder();
renderLayoutManager();
syncTimerInputs();

renderTasks();
renderAnalytics();
renderLinks();
renderNotes();

showView(
  "overview"
);

requestAnimationFrame(
  moveDockGlide
);

window.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      els.moreBackdrop
        .classList.add(
          "hidden"
        );

      closeLinkModal();
    }
  }
);
