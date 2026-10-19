/* ================================
   DAYFLOW - COMPLETE SCRIPT.JS
   ================================ */

const $ = (id) => document.getElementById(id);

const read = (key, fallback = []) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
};

const save = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const escapeHTML = (text = "") =>
    String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const initials = (name = "Student") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(x => x[0])
        .join("")
        .toUpperCase();

const todayKey = () => new Date().toISOString().slice(0, 10);

/* ================================
   STATE
================================ */

let tasks = read("dayflow_tasks", []);
let notes = read("dayflow_notes", []);
let profile = read("dayflow_profile", {});

let currentPage = "dashboard";
let currentNoteId = null;
let currentCalendar = new Date();

let focusSeconds = read("dayflow_focus_seconds", 0);
let timerSeconds = 25 * 60;
let focusRunning = false;
let timerInterval = null;

let noteFilter = "all";
let noteVibe = "all";

/* ================================
   TOAST
================================ */

function toast(message) {
    const box = $("toast");
    const text = $("toastText");

    if (!box || !text) return;

    text.textContent = message;
    box.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        box.classList.remove("show");
    }, 2200);
}

/* ================================
   THEME
================================ */

function applyTheme() {
    const theme = localStorage.getItem("dayflow_theme") || "dark";

    document.body.classList.toggle("dark", theme === "dark");

    const btn = $("themeButton");

    if (btn) {
        btn.innerHTML = theme === "dark"
            ? "☀️"
            : "🌙";
    }
}

function toggleTheme() {
    const current = localStorage.getItem("dayflow_theme") || "dark";

    localStorage.setItem(
        "dayflow_theme",
        current === "dark" ? "light" : "dark"
    );

    applyTheme();
}

/* ================================
   NAVIGATION
================================ */

const pageTitles = {
    dashboard: "Dashboard",
    tasks: "Tasks",
    notes: "Notes",
    planner: "Planner",
    focus: "Focus",
    resources: "Resources",
    profile: "Profile"
};

function go(page) {
    currentPage = page;

    document.querySelectorAll(".page").forEach(p => {
        p.classList.remove("active");
    });

    const target = $(page + "Page");

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll("[data-page]").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === page
        );
    });

    if ($("pageTitle")) {
        $("pageTitle").textContent =
            pageTitles[page] || "DayFlow";
    }

    document.body.classList.remove("sidebar-open");

    if (page === "dashboard") renderDashboard();
    if (page === "tasks") renderTasks();
    if (page === "notes") renderNotes();
    if (page === "planner") renderCalendar();
    if (page === "focus") renderFocus();
    if (page === "profile") renderProfile();
}

/* ================================
   SIDEBAR
================================ */

document.querySelectorAll("[data-page]").forEach(item => {
    item.addEventListener("click", () => {
        go(item.dataset.page);
    });
});

$("themeButton")?.addEventListener("click", toggleTheme);

$("mobileMenu")?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
});

/* ================================
   MODALS
================================ */

function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.add("open");
    modal.classList.add("show");
}

function closeModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("open");
    modal.classList.remove("show");
}

document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
        closeModal(btn.dataset.close);
    });
});

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
        if (e.target === modal) {
            modal.classList.remove("open");
            modal.classList.remove("show");
        }
    });
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal").forEach(modal => {
            modal.classList.remove("open");
            modal.classList.remove("show");
        });
    }
});

/* ================================
   PROFILE
================================ */

function renderProfile() {
    const name = profile.name || "Student";
    const course = profile.course || "Student";

    if ($("profileNameDisplay"))
        $("profileNameDisplay").textContent = name;

    if ($("profileCourseDisplay"))
        $("profileCourseDisplay").textContent = course;

    if ($("sidebarName"))
        $("sidebarName").textContent = name;

    if ($("sidebarCourse"))
        $("sidebarCourse").textContent = course;

    const avatar =
        profile.image ||
        initials(name);

    ["profileAvatar", "sidebarAvatar"].forEach(id => {
        const el = $(id);

        if (!el) return;

        if (profile.image) {
            el.style.backgroundImage = `url("${profile.image}")`;
            el.textContent = "";
        } else {
            el.style.backgroundImage = "none";
            el.textContent = avatar;
        }
    });

    if ($("profileBio"))
        $("profileBio").textContent =
            profile.bio || "Build. Learn. Grow.";

    if ($("profileCollege"))
        $("profileCollege").textContent =
            profile.college || "Your College";

    if ($("profileCourseTwo"))
        $("profileCourseTwo").textContent =
            profile.course || "Your Course";

    if ($("profileYear"))
        $("profileYear").textContent =
            profile.year || "Year";

    if ($("profileSemester"))
        $("profileSemester").textContent =
            profile.semester || "Semester";

    if ($("profileEmail"))
        $("profileEmail").textContent =
            profile.email || "Add your email";

    if ($("profileSkills")) {
        $("profileSkills").innerHTML =
            (profile.skills || "Python, HTML, CSS")
                .split(",")
                .map(skill =>
                    `<span>${escapeHTML(skill.trim())}</span>`
                )
                .join("");
    }

    if ($("githubLink")) {
        $("githubLink").href =
            profile.github || "#";
    }

    if ($("linkedinLink")) {
        $("linkedinLink").href =
            profile.linkedin || "#";
    }

    updateProfileStats();
}

function updateProfileStats() {
    const completed = tasks.filter(t => t.completed).length;

    if ($("profileNotes"))
        $("profileNotes").textContent = notes.length;

    if ($("profileTasks"))
        $("profileTasks").textContent = completed;

    if ($("profileFocus"))
        $("profileFocus").textContent =
            Math.floor(focusSeconds / 60);
}

function loadProfileForm() {
    const fields = {
        profileNameInput: profile.name,
        profileEmailInput: profile.email,
        profileCollegeInput: profile.college,
        profileCourseInput: profile.course,
        profileYearInput: profile.year,
        profileSemesterInput: profile.semester,
        profileBioInput: profile.bio,
        profileSkillsInput: profile.skills,
        githubInput: profile.github,
        linkedinInput: profile.linkedin
    };

    Object.entries(fields).forEach(([id, value]) => {
        if ($(id)) $(id).value = value || "";
    });

    if ($("profileImage") && profile.image) {
        $("profileImage").src = profile.image;
    }
}

$("profileButton")?.addEventListener("click", () => {
    loadProfileForm();
    openModal("profileModal");
});

$("editProfile")?.addEventListener("click", () => {
    loadProfileForm();
    openModal("profileModal");
});

$("profileForm")?.addEventListener("submit", e => {
    e.preventDefault();

    profile = {
        name: $("profileNameInput")?.value.trim() || "Student",
        email: $("profileEmailInput")?.value.trim() || "",
        college: $("profileCollegeInput")?.value.trim() || "",
        course: $("profileCourseInput")?.value.trim() || "",
        year: $("profileYearInput")?.value.trim() || "",
        semester: $("profileSemesterInput")?.value.trim() || "",
        bio: $("profileBioInput")?.value.trim() || "",
        skills: $("profileSkillsInput")?.value.trim() || "",
        github: $("githubInput")?.value.trim() || "",
        linkedin: $("linkedinInput")?.value.trim() || "",
        image: profile.image || ""
    };

    save("dayflow_profile", profile);

    renderProfile();

    closeModal("profileModal");

    toast("Profile updated ✨");
});

/* PROFILE IMAGE */

$("profileImage")?.addEventListener("change", e => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        profile.image = reader.result;

        save("dayflow_profile", profile);

        renderProfile();

        toast("Profile picture updated 📸");
    };

    reader.readAsDataURL(file);
});

/* ================================
   CREATE MENU
================================ */

$("newButton")?.addEventListener("click", () => {
    openModal("createModal");
});

$("createTask")?.addEventListener("click", () => {
    closeModal("createModal");
    openTaskModal();
});

$("createNote")?.addEventListener("click", () => {
    closeModal("createModal");
    openNoteModal();
});

$("createPlanner")?.addEventListener("click", () => {
    closeModal("createModal");
    go("planner");
});

$("dashboardAddTask")?.addEventListener("click", openTaskModal);

$("newTaskButton")?.addEventListener("click", openTaskModal);

function openTaskModal() {
    if ($("taskTitle")) $("taskTitle").value = "";

    if ($("taskPriority")) $("taskPriority").value = "medium";

    if ($("taskCategory")) $("taskCategory").value = "study";

    openModal("taskModal");
}

/* ================================
   TASKS
================================ */

$("saveTask")?.addEventListener("click", () => {
    const title = $("taskTitle")?.value.trim();

    if (!title) {
        toast("Enter a task first");
        return;
    }

    const task = {
        id: Date.now(),
        title,
        priority: $("taskPriority")?.value || "medium",
        category: $("taskCategory")?.value || "study",
        completed: false,
        createdAt: Date.now()
    };

    tasks.unshift(task);

    save("dayflow_tasks", tasks);

    closeModal("taskModal");

    renderTasks();
    renderDashboard();

    toast("Task added ✅");
});

function renderTasks() {
    const list = $("taskList");

    if (!list) return;

    if (!tasks.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>No tasks yet</h3>
                <p>Create your first task and start moving.</p>
            </div>
        `;

        return;
    }

    list.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? "completed" : ""}">
            <button
                class="task-check"
                onclick="toggleTask(${task.id})"
            >
                ${task.completed ? "✓" : ""}
            </button>

            <div class="task-content">
                <strong>${escapeHTML(task.title)}</strong>
                <small>
                    ${escapeHTML(task.category || "study")}
                    · ${escapeHTML(task.priority || "medium")}
                </small>
            </div>

            <button
                class="task-delete"
                onclick="deleteTask(${task.id})"
            >
                ×
            </button>
        </div>
    `).join("");

    if ($("taskCountText")) {
        $("taskCountText").textContent =
            `${tasks.filter(t => !t.completed).length} active`;
    }
}

window.toggleTask = function(id) {
    const task = tasks.find(t => t.id === id);

    if (!task) return;

    task.completed = !task.completed;

    save("dayflow_tasks", tasks);

    renderTasks();
    renderDashboard();
    renderProfile();
};

window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);

    save("dayflow_tasks", tasks);

    renderTasks();
    renderDashboard();
    renderProfile();

    toast("Task deleted");
};

/* ================================
   DASHBOARD
================================ */

function renderDashboard() {
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;

    if ($("taskStat"))
        $("taskStat").textContent = active;

    if ($("openTasks"))
        $("openTasks").textContent = active;

    if ($("focusStat"))
        $("focusStat").textContent =
            Math.floor(focusSeconds / 60) + "m";

    if ($("notesStat"))
        $("notesStat").textContent = notes.length;

    if ($("notesStat"))
        $("notesStat").textContent = notes.length;

    if ($("streakStat"))
        $("streakStat").textContent =
            localStorage.getItem("dayflow_streak") || "1";

    const progress =
        tasks.length
            ? Math.round((completed / tasks.length) * 100)
            : 0;

    if ($("taskProgress"))
        $("taskProgress").style.width = progress + "%";

    renderDashboardTasks();
    renderRecentNotes();
}

function renderDashboardTasks() {
    const box = $("dashboardTasks");

    if (!box) return;

    const latest = tasks
        .filter(t => !t.completed)
        .slice(0, 5);

    if (!latest.length) {
        box.innerHTML = `
            <div class="empty-state">
                <h3>You're all clear 🎉</h3>
                <p>No pending tasks.</p>
            </div>
        `;

        return;
    }

    box.innerHTML = latest.map(task => `
        <div class="dashboard-task">
            <button onclick="toggleTask(${task.id})">
                ○
            </button>

            <span>${escapeHTML(task.title)}</span>
        </div>
    `).join("");
}

$("openTasks")?.addEventListener("click", () => go("tasks"));

/* ================================
   NOTES
================================ */

function openNoteModal(note = null) {
    currentNoteId = note?.id || null;

    if ($("noteModalTitle"))
        $("noteModalTitle").textContent =
            note ? "Edit Note" : "New Note";

    if ($("noteTitle"))
        $("noteTitle").value = note?.title || "";

    if ($("noteCategory"))
        $("noteCategory").value =
            note?.category || "study";

    if ($("noteContent"))
        $("noteContent").value =
            note?.content || "";

    if ($("notePinned"))
        $("notePinned").checked =
            Boolean(note?.pinned);

    document.querySelectorAll(".color-choice")
        .forEach(x => {
            x.classList.toggle(
                "active",
                x.dataset.color === (note?.color || "purple")
            );
        });

    updateNoteCharacters();

    openModal("noteModal");
}

$("newNoteButton")?.addEventListener(
    "click",
    () => openNoteModal()
);

$("quickNote")?.addEventListener(
    "click",
    () => openNoteModal()
);

document.querySelectorAll(".color-choice")
    .forEach(choice => {
        choice.addEventListener("click", () => {
            document.querySelectorAll(".color-choice")
                .forEach(x => x.classList.remove("active"));

            choice.classList.add("active");
        });
    });

$("noteContent")?.addEventListener(
    "input",
    updateNoteCharacters
);

function updateNoteCharacters() {
    if ($("noteCharacters")) {
        $("noteCharacters").textContent =
            ($("noteContent")?.value || "").length;
    }
}

$("saveNote")?.addEventListener("click", () => {
    const title = $("noteTitle")?.value.trim();
    const content = $("noteContent")?.value.trim();

    if (!title && !content) {
        toast("Write something first");
        return;
    }

    const selectedColor =
        document.querySelector(".color-choice.active")
            ?.dataset.color || "purple";

    const data = {
        title: title || "Untitled Note",
        content,
        category: $("noteCategory")?.value || "study",
        pinned: $("notePinned")?.checked || false,
        color: selectedColor,
        updatedAt: Date.now()
    };

    if (currentNoteId) {
        const index =
            notes.findIndex(n => n.id === currentNoteId);

        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                ...data
            };
        }
    } else {
        notes.unshift({
            id: Date.now(),
            ...data
        });
    }

    save("dayflow_notes", notes);

    closeModal("noteModal");

    renderNotes();
    renderDashboard();
    renderProfile();

    toast("Note saved 📝");
});

function renderNotes() {
    const grid = $("noteGrid");

    if (!grid) return;

    let filtered = [...notes];

    const search =
        ($("noteSearch")?.value || "")
            .toLowerCase()
            .trim();

    if (search) {
        filtered = filtered.filter(note =>
            `${note.title} ${note.content} ${note.category}`
                .toLowerCase()
                .includes(search)
        );
    }

    if (noteFilter !== "all") {
        if (noteFilter === "pinned") {
            filtered = filtered.filter(n => n.pinned);
        } else {
            filtered =
                filtered.filter(
                    n => n.category === noteFilter
                );
        }
    }

    if (noteVibe !== "all") {
        filtered =
            filtered.filter(
                n => n.color === noteVibe
            );
    }

    filtered.sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return Number(b.pinned) - Number(a.pinned);
        }

        return (b.updatedAt || b.id) -
            (a.updatedAt || a.id);
    });

    if (!filtered.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No notes found</h3>
                <p>Create a note to see it here.</p>
            </div>
        `;

        return;
    }

    grid.innerHTML = filtered.map(note => `
        <article class="note-card ${escapeHTML(note.color || "purple")}">

            <div class="note-card-top">
                <span>${escapeHTML(note.category || "study")}</span>

                <button onclick="togglePin(${note.id})">
                    ${note.pinned ? "📌" : "☆"}
                </button>
            </div>

            <h3>${escapeHTML(note.title)}</h3>

            <p>
                ${escapeHTML(
                    (note.content || "").slice(0, 180)
                )}
            </p>

            <div class="note-card-actions">
                <button onclick="editNote(${note.id})">
                    Edit
                </button>

                <button onclick="deleteNote(${note.id})">
                    Delete
                </button>
            </div>

        </article>
    `).join("");

    updateNoteStats();
}

function updateNoteStats() {
    if ($("totalNotes"))
        $("totalNotes").textContent = notes.length;

    if ($("pinnedNotes"))
        $("pinnedNotes").textContent =
            notes.filter(n => n.pinned).length;

    if ($("weekNotes"))
        $("weekNotes").textContent =
            notes.filter(n =>
                Date.now() - (n.updatedAt || n.id)
                < 7 * 24 * 60 * 60 * 1000
            ).length;
}

window.editNote = function(id) {
    const note = notes.find(n => n.id === id);

    if (note) openNoteModal(note);
};

window.deleteNote = function(id) {
    notes = notes.filter(n => n.id !== id);

    save("dayflow_notes", notes);

    renderNotes();
    renderDashboard();
    renderProfile();

    toast("Note deleted");
};

window.togglePin = function(id) {
    const note = notes.find(n => n.id === id);

    if (!note) return;

    note.pinned = !note.pinned;

    save("dayflow_notes", notes);

    renderNotes();

    toast(
        note.pinned
            ? "Note pinned 📌"
            : "Note unpinned"
    );
};

$("noteSearch")?.addEventListener(
    "input",
    renderNotes
);

document.querySelectorAll(".filter")
    .forEach(button => {
        button.addEventListener("click", () => {

            document.querySelectorAll(".filter")
                .forEach(x =>
                    x.classList.remove("active")
                );

            button.classList.add("active");

            noteFilter =
                button.dataset.filter || "all";

            renderNotes();
        });
    });

document.querySelectorAll(".vibe-filter")
    .forEach(button => {
        button.addEventListener("click", () => {

            document.querySelectorAll(".vibe-filter")
                .forEach(x =>
                    x.classList.remove("active")
                );

            button.classList.add("active");

            noteVibe =
                button.dataset.vibe || "all";

            renderNotes();
        });
    });

function renderRecentNotes() {
    const box = $("recentNotes");

    if (!box) return;

    const latest = notes.slice(0, 3);

    if (!latest.length) {
        box.innerHTML =
            `<p class="muted">No notes yet.</p>`;
        return;
    }

    box.innerHTML = latest.map(note => `
        <div class="recent-note">
            <strong>${escapeHTML(note.title)}</strong>
            <span>${escapeHTML(note.category || "study")}</span>
        </div>
    `).join("");
}

$("openNotes")?.addEventListener(
    "click",
    () => go("notes")
);

/* ================================
   BRAIN DUMP
================================ */

const brainKey = "dayflow_brain";

if ($("brainDump")) {
    $("brainDump").value =
        localStorage.getItem(brainKey) || "";

    $("brainDump").addEventListener("input", () => {
        if ($("brainCount")) {
            $("brainCount").textContent =
                $("brainDump").value.length;
        }
    });
}

$("saveBrain")?.addEventListener("click", () => {
    const value = $("brainDump")?.value || "";

    localStorage.setItem(brainKey, value);

    toast("Brain dump saved 🧠");
});

/* ================================
   MOTIVATION
================================ */

const motivations = [
    "Small progress is still progress.",
    "Code today. Thank yourself tomorrow.",
    "Build something you're proud of.",
    "Focus on progress, not perfection.",
    "One focused session can change your day.",
    "Your future self is watching.",
    "Learn. Build. Repeat.",
    "Don't wait for motivation. Start."
];

function newMotivation() {
    const random =
        motivations[
            Math.floor(Math.random() * motivations.length)
        ];

    if ($("motivationText"))
        $("motivationText").textContent = random;

    if ($("heroNote"))
        $("heroNote").textContent = random;
}

$("newMotivation")?.addEventListener(
    "click",
    newMotivation
);

/* ================================
   FOCUS TIMER
================================ */

function formatTime(seconds) {
    const min = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");

    const sec = (seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${min}:${sec}`;
}

function updateTimerUI() {
    const text = formatTime(timerSeconds);

    if ($("bigTimer"))
        $("bigTimer").textContent = text;

    if ($("smallTimer"))
        $("smallTimer").textContent = text;
}

function startFocus() {
    if (focusRunning) return;

    focusRunning = true;

    timerInterval = setInterval(() => {

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);

            focusRunning = false;

            toast("Focus session complete 🎉");

            focusSeconds +=
                Number(localStorage.getItem(
                    "dayflow_current_session"
                ) || 0);

            localStorage.removeItem(
                "dayflow_current_session"
            );

            save(
                "dayflow_focus_seconds",
                focusSeconds
            );

            renderFocus();
            renderDashboard();
            renderProfile();

            return;
        }

        timerSeconds--;

        const used =
            25 * 60 - timerSeconds;

        localStorage.setItem(
            "dayflow_current_session",
            used
        );

        updateTimerUI();

    }, 1000);

    updateFocusButton();
}

function pauseFocus() {
    focusRunning = false;

    clearInterval(timerInterval);

    const used =
        25 * 60 - timerSeconds;

    focusSeconds += used;

    timerSeconds = 25 * 60;

    save(
        "dayflow_focus_seconds",
        focusSeconds
    );

    localStorage.removeItem(
        "dayflow_current_session"
    );

    updateTimerUI();
    updateFocusButton();
    renderDashboard();
    renderProfile();
}

function resetFocus() {
    clearInterval(timerInterval);

    focusRunning = false;
    timerSeconds = 25 * 60;

    updateTimerUI();
    updateFocusButton();
}

function updateFocusButton() {
    if ($("startFocus")) {
        $("startFocus").textContent =
            focusRunning ? "Pause Focus" : "Start Focus";
    }
}

$("startFocus")?.addEventListener("click", () => {
    if (focusRunning) {
        pauseFocus();
    } else {
        startFocus();
    }
});

$("resetFocus")?.addEventListener(
    "click",
    resetFocus
);

$("smallStartFocus")?.addEventListener(
    "click",
    () => {
        go("focus");

        setTimeout(() => {
            if (!focusRunning) {
                startFocus();
            }
        }, 100);
    }
);

document.querySelectorAll(".timer-mode")
    .forEach(button => {
        button.addEventListener("click", () => {

            const minutes =
                Number(button.dataset.minutes);

            if (!minutes) return;

            clearInterval(timerInterval);

            focusRunning = false;
            timerSeconds = minutes * 60;

            updateTimerUI();
            updateFocusButton();

            document.querySelectorAll(".timer-mode")
                .forEach(x =>
                    x.classList.remove("active")
                );

            button.classList.add("active");
        });
    });

function renderFocus() {
    updateTimerUI();
    updateFocusButton();
}

/* ================================
   CALENDAR
================================ */

function renderCalendar() {
    const grid = $("calendarGrid");
    const title = $("calendarTitle");

    if (!grid) return;

    const year = currentCalendar.getFullYear();
    const month = currentCalendar.getMonth();

    const monthName =
        currentCalendar.toLocaleString("default", {
            month: "long"
        });

    if (title) {
        title.textContent =
            `${monthName} ${year}`;
    }

    const firstDay =
        new Date(year, month, 1).getDay();

    const days =
        new Date(year, month + 1, 0).getDate();

    const previousDays =
        new Date(year, month, 0).getDate();

    let html = "";

    for (let i = firstDay - 1; i >= 0; i--) {
        html += `
            <div class="calendar-day muted">
                ${previousDays - i}
            </div>
        `;
    }

    for (let day = 1; day <= days; day++) {

        const key =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const today =
            key === todayKey();

        html += `
            <div
                class="calendar-day ${today ? "today" : ""}"
                data-date="${key}"
            >
                ${day}
            </div>
        `;
    }

    grid.innerHTML = html;
}

$("prevMonth")?.addEventListener("click", () => {
    currentCalendar.setMonth(
        currentCalendar.getMonth() - 1
    );

    renderCalendar();
});

$("nextMonth")?.addEventListener("click", () => {
    currentCalendar.setMonth(
        currentCalendar.getMonth() + 1
    );

    renderCalendar();
});

$("todayButton")?.addEventListener("click", () => {
    currentCalendar = new Date();

    renderCalendar();
});

/* ================================
   SEARCH
================================ */

$("searchButton")?.addEventListener("click", () => {
    openModal("searchModal");

    setTimeout(() => {
        $("globalSearch")?.focus();
    }, 100);
});

$("globalSearch")?.addEventListener("input", e => {
    const query =
        e.target.value.toLowerCase().trim();

    const box = $("searchResults");

    if (!box) return;

    if (!query) {
        box.innerHTML =
            `<p class="muted">Search your tasks and notes.</p>`;
        return;
    }

    const taskResults = tasks.filter(t =>
        t.title.toLowerCase().includes(query)
    );

    const noteResults = notes.filter(n =>
        `${n.title} ${n.content}`
            .toLowerCase()
            .includes(query)
    );

    let html = "";

    taskResults.forEach(task => {
        html += `
            <button
                class="search-result"
                onclick="go('tasks'); closeModal('searchModal')"
            >
                <strong>✓ ${escapeHTML(task.title)}</strong>
                <span>Task</span>
            </button>
        `;
    });

    noteResults.forEach(note => {
        html += `
            <button
                class="search-result"
                onclick="go('notes'); closeModal('searchModal')"
            >
                <strong>📝 ${escapeHTML(note.title)}</strong>
                <span>Note</span>
            </button>
        `;
    });

    if (!html) {
        html =
            `<p class="muted">No results found.</p>`;
    }

    box.innerHTML = html;
});

/* ================================
   PLANNER BUTTON
================================ */

$("openPlanner")?.addEventListener(
    "click",
    () => go("planner")
);

/* ================================
   VIBE BUTTON
================================ */

$("vibeButton")?.addEventListener("click", () => {
    const vibes = [
        "Locked in 🔥",
        "Study mode activated 📚",
        "Builder mode ON 💻",
        "One task at a time 🎯",
        "Keep going ⚡"
    ];

    toast(
        vibes[Math.floor(Math.random() * vibes.length)]
    );
});

/* ================================
   STREAK
================================ */

function updateStreak() {
    const today = todayKey();

    const last =
        localStorage.getItem("dayflow_last_active");

    let streak =
        Number(
            localStorage.getItem("dayflow_streak")
        ) || 0;

    if (!last) {
        streak = 1;
    } else if (last !== today) {

        const previous =
            new Date(last);

        const current =
            new Date(today);

        const difference =
            Math.round(
                (current - previous) /
                (1000 * 60 * 60 * 24)
            );

        if (difference === 1) {
            streak++;
        } else if (difference > 1) {
            streak = 1;
        }
    }

    localStorage.setItem(
        "dayflow_last_active",
        today
    );

    localStorage.setItem(
        "dayflow_streak",
        streak
    );
}

/* ================================
   INITIALIZE
================================ */

function initDayFlow() {

    applyTheme();

    updateStreak();

    renderProfile();

    renderTasks();

    renderNotes();

    renderDashboard();

    renderFocus();

    renderCalendar();

    newMotivation();

    go("dashboard");
}

document.addEventListener(
    "DOMContentLoaded",
    initDayFlow
);
