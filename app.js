const STORAGE_KEY = "blue-todo-items";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const priorityInput = document.querySelector("#todo-priority");
const list = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const pendingCount = document.querySelector("#pending-count");
const completedCount = document.querySelector("#completed-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const clearAllButton = document.querySelector("#clear-all");

const PRIORITIES = {
  high: "高",
  medium: "中",
  low: "低"
};

let todos = loadTodos();
let editingTodoId = null;

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((todo) => todo && typeof todo.text === "string")
      .map((todo) => ({
        id: todo.id || createId(),
        text: todo.text,
        completed: Boolean(todo.completed),
        priority: normalizePriority(todo.priority)
      }));
  } catch {
    return [];
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePriority(priority) {
  return Object.hasOwn(PRIORITIES, priority) ? priority : "medium";
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createTodo(text, priority) {
  return {
    id: createId(),
    text,
    priority: normalizePriority(priority),
    completed: false
  };
}

function createPrioritySelect(value, label, className) {
  const select = document.createElement("select");
  select.className = className;
  select.setAttribute("aria-label", label);

  Object.entries(PRIORITIES).forEach(([priority, text]) => {
    const option = document.createElement("option");
    option.value = priority;
    option.textContent = text;
    option.selected = priority === normalizePriority(value);
    select.appendChild(option);
  });

  return select;
}

function renderTodos() {
  list.innerHTML = "";
  let editInputToFocus = null;

  todos.forEach((todo) => {
    const priority = normalizePriority(todo.priority);
    const item = document.createElement("li");
    item.className = `todo-item priority-${priority}${todo.completed ? " completed" : ""}${editingTodoId === todo.id ? " editing" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.disabled = editingTodoId === todo.id;
    checkbox.setAttribute("aria-label", `标记“${todo.text}”为${todo.completed ? "未完成" : "完成"}`);
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    if (editingTodoId === todo.id) {
      const editForm = document.createElement("form");
      editForm.className = "edit-form";

      const editInput = document.createElement("input");
      editInput.className = "edit-input";
      editInput.type = "text";
      editInput.value = todo.text;
      editInput.maxLength = 80;
      editInput.setAttribute("aria-label", "编辑任务内容");

      const editPriority = createPrioritySelect(priority, "编辑优先级", "edit-priority");

      const saveButton = document.createElement("button");
      saveButton.className = "save-btn";
      saveButton.type = "submit";
      saveButton.textContent = "保存";

      const cancelButton = document.createElement("button");
      cancelButton.className = "cancel-btn";
      cancelButton.type = "button";
      cancelButton.textContent = "取消";
      cancelButton.addEventListener("click", cancelEdit);

      editForm.addEventListener("submit", (event) => {
        event.preventDefault();
        updateTodo(todo.id, editInput.value, editPriority.value);
      });

      editForm.append(editInput, editPriority, saveButton, cancelButton);
      item.append(checkbox, editForm);
      list.appendChild(item);
      editInputToFocus = editInput;
      return;
    }

    const content = document.createElement("div");
    content.className = "task-content";

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = todo.text;

    const badge = document.createElement("span");
    badge.className = `priority-badge priority-${priority}`;
    badge.textContent = `${PRIORITIES[priority]}优先级`;

    content.append(text, badge);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editButton = document.createElement("button");
    editButton.className = "icon-btn edit-btn";
    editButton.type = "button";
    editButton.title = "编辑";
    editButton.setAttribute("aria-label", `编辑“${todo.text}”`);
    editButton.textContent = "✎";
    editButton.addEventListener("click", () => startEdit(todo.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-btn delete-btn";
    deleteButton.type = "button";
    deleteButton.title = "删除";
    deleteButton.setAttribute("aria-label", `删除“${todo.text}”`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));

    actions.append(editButton, deleteButton);
    item.append(checkbox, content, actions);
    list.appendChild(item);
  });

  updateStats();
  emptyState.classList.toggle("hidden", todos.length > 0);

  if (editInputToFocus) {
    editInputToFocus.focus();
    editInputToFocus.setSelectionRange(editInputToFocus.value.length, editInputToFocus.value.length);
  }
}

function updateStats() {
  const completed = todos.filter((todo) => todo.completed).length;
  const pending = todos.length - completed;

  pendingCount.textContent = pending;
  completedCount.textContent = completed;
  clearCompletedButton.disabled = completed === 0;
  clearAllButton.disabled = todos.length === 0;
}

function addTodo(text, priority) {
  todos = [createTodo(text, priority), ...todos];
  saveTodos();
  renderTodos();
}

function startEdit(id) {
  editingTodoId = id;
  renderTodos();
}

function cancelEdit() {
  editingTodoId = null;
  renderTodos();
}

function updateTodo(id, text, priority) {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return;
  }

  todos = todos.map((todo) => (
    todo.id === id
      ? { ...todo, text: trimmedText, priority: normalizePriority(priority) }
      : todo
  ));
  editingTodoId = null;
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((todo) => (
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  ));
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  if (editingTodoId === id) {
    editingTodoId = null;
  }
  saveTodos();
  renderTodos();
}

function clearCompletedTodos() {
  todos = todos.filter((todo) => !todo.completed);
  editingTodoId = null;
  saveTodos();
  renderTodos();
}

function clearAllTodos() {
  if (!todos.length || !confirm("确定要清空所有任务吗？此操作无法撤销。")) {
    return;
  }

  todos = [];
  editingTodoId = null;
  saveTodos();
  renderTodos();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  addTodo(text, priorityInput.value);
  form.reset();
  priorityInput.value = "medium";
  input.focus();
});

clearCompletedButton.addEventListener("click", clearCompletedTodos);
clearAllButton.addEventListener("click", clearAllTodos);

renderTodos();
