const STORAGE_KEY = "smart-notes-list";
const THEME_KEY = "smart-notes-theme";

const noteForm = document.getElementById("noteForm");
const noteIdInput = document.getElementById("noteId");
const noteTitleInput = document.getElementById("noteTitle");
const noteContentInput = document.getElementById("noteContent");
const notesList = document.getElementById("notesList");
const emptyState = document.getElementById("emptyState");
const noteCount = document.getElementById("noteCount");
const searchInput = document.getElementById("searchInput");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editorTitle = document.getElementById("editorTitle");
const formHint = document.getElementById("formHint");
const themeToggle = document.getElementById("themeToggle");
const themeText = document.getElementById("themeText");

let notes = loadNotes();
let searchTerm = "";

function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function loadNotes() {
  try {
    const savedNotes = localStorage.getItem(STORAGE_KEY);
    return savedNotes ? JSON.parse(savedNotes) : [];
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderNotes() {
  const filteredNotes = notes.filter((note) => {
    const searchableText = `${note.title} ${note.content}`.toLowerCase();
    return searchableText.includes(searchTerm.toLowerCase());
  });

  noteCount.textContent = notes.length;
  notesList.innerHTML = "";

  if (filteredNotes.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.querySelector("h3").textContent = notes.length ? "No matching notes" : "No notes yet";
    emptyState.querySelector("p").textContent = notes.length
      ? "Try another search term or clear the search box."
      : "Add your first note and it will stay here even after you close the browser.";
    return;
  }

  emptyState.classList.add("hidden");

  filteredNotes
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((note) => {
      const card = document.createElement("article");
      card.className = "note-card";
      card.innerHTML = `
        <span class="note-meta">Updated ${formatDate(note.updatedAt)}</span>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.content)}</p>
        <div class="note-actions">
          <button class="note-action" type="button" data-action="edit" data-id="${note.id}">Edit</button>
          <button class="note-action delete" type="button" data-action="delete" data-id="${note.id}">Delete</button>
        </div>
      `;
      notesList.appendChild(card);
    });
}

function resetForm() {
  noteForm.reset();
  noteIdInput.value = "";
  saveBtn.textContent = "Add Note";
  editorTitle.textContent = "Add a Note";
  formHint.textContent = "Capture a thought before it wanders off.";
  cancelEditBtn.classList.add("hidden");
}

function addOrUpdateNote(event) {
  event.preventDefault();

  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  const existingId = noteIdInput.value;

  if (!title || !content) return;

  if (existingId) {
    notes = notes.map((note) => {
      if (note.id !== existingId) return note;
      return {
        ...note,
        title,
        content,
        updatedAt: new Date().toISOString()
      };
    });
  } else {
    notes.push({
      id: createId(),
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveNotes();
  renderNotes();
  resetForm();
}

function editNote(id) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;

  noteIdInput.value = note.id;
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content;
  saveBtn.textContent = "Save Changes";
  editorTitle.textContent = "Edit Note";
  formHint.textContent = "Update the details and save your changes.";
  cancelEditBtn.classList.remove("hidden");
  noteTitleInput.focus();
}

function deleteNote(id) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;

  const shouldDelete = confirm(`Delete "${note.title}"?`);
  if (!shouldDelete) return;

  notes = notes.filter((item) => item.id !== id);
  saveNotes();
  renderNotes();

  if (noteIdInput.value === id) {
    resetForm();
  }
}

function handleNoteAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "edit") editNote(id);
  if (action === "delete") deleteNote(id);
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeText.textContent = isDark ? "Light" : "Dark";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

noteForm.addEventListener("submit", addOrUpdateNote);
cancelEditBtn.addEventListener("click", resetForm);
notesList.addEventListener("click", handleNoteAction);
themeToggle.addEventListener("click", toggleTheme);

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderNotes();
});

applyTheme(localStorage.getItem(THEME_KEY) || "light");
renderNotes();
