let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    render();
}

function addTask() {
    const title = document.getElementById('taskTitle');
    if (!title || !title.value) return;
    tasks.push({
        id: Date.now(), title: title.value, category: document.getElementById('taskCategory').value,
        status: "未完了", startDate: document.getElementById('taskStartDate').value,
        endDate: document.getElementById('taskEndDate').value, memo: "", order: tasks.length
    });
    title.value = '';
    saveTasks();
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    document.body.className = theme;
    localStorage.setItem('selectedTheme', theme);
}

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editCategory').value = task.category;
    document.getElementById('editStartDate').value = task.startDate || "";
    document.getElementById('editEndDate').value = task.endDate || "";
    document.getElementById('editMemo').value = task.memo || "";
    document.getElementById('editModal').style.display = 'flex';
}

function saveEdit() {
    const id = parseInt(document.getElementById('editTaskId').value);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.title = document.getElementById('editTitle').value;
        task.category = document.getElementById('editCategory').value;
        task.startDate = document.getElementById('editStartDate').value;
        task.endDate = document.getElementById('editEndDate').value;
        task.memo = document.getElementById('editMemo').value;
        saveTasks();
    }
    document.getElementById('editModal').style.display = 'none';
}

function render() {
    const cols = { "未完了": "list-todo", "進行中": "list-doing", "完了": "list-done" };

    // クリア処理
    Object.values(cols).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    const urgent = document.getElementById('urgentList');
    if (urgent) urgent.innerHTML = '';

    // タスク配置
    tasks.sort((a, b) => a.order - b.order).forEach(task => {
        const listId = cols[task.status];
        const listEl = document.getElementById(listId);
        if (listEl) listEl.appendChild(createTaskCard(task));
    });

    // 期限近（3日以内）
    const limit = new Date(); limit.setDate(limit.getDate() + 3);
    tasks.filter(t => t.status !== "完了" && t.endDate && new Date(t.endDate) <= limit)
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
        .forEach(t => {
            if (urgent) urgent.appendChild(createTaskCard(t, true));
        });

    initSortable();
}

function createTaskCard(task, isUrgent = false) {
    const div = document.createElement('div');
    const today = new Date().setHours(0, 0, 0, 0);
    const start = task.startDate ? new Date(task.startDate).setHours(0, 0, 0, 0) : null;
    const end = task.endDate ? new Date(task.endDate).setHours(0, 0, 0, 0) : null;
    let cls = '';

    if (task.status === '完了') cls = 'task-done';
    else if (task.status === '未完了' && start) {
        if (start < today) cls = 'overdue';
        else if (start === today) cls = 'warning';
    } else if (task.status === '進行中' && end) {
        const diff = (end - today) / 86400000;
        if (end < today) cls = 'overdue';
        else if (diff <= 1) cls = 'warning';
        else cls = 'doing';
    } else if (task.status === '進行中') cls = 'doing';

    div.className = `task-card ${cls}`;
    div.dataset.id = task.id;
    div.ondblclick = () => openEditModal(task.id);
    const dateStr = (task.startDate || task.endDate) ? `${task.startDate || '-'} ～ ${task.endDate || '-'}` : '期間未設定';

    div.innerHTML = `
        <div><span class="category-tag">${task.category}</span></div>
        <div class="task-title">${task.title}</div>
        <div class="task-footer">
            <span>${dateStr}</span>
            ${!isUrgent ? `<button class="btn-icon" onclick="event.stopPropagation(); if(confirm('削除しますか？')){tasks=tasks.filter(t=>t.id!=${task.id});saveTasks();}">削除</button>` : ''}
        </div>
    `;
    return div;
}

function initSortable() {
    document.querySelectorAll('.task-list-area').forEach(el => {
        if (el.id === 'urgentList') return;

        new Sortable(el, {
            group: 'kanban', animation: 150, onEnd: () => {
                const newTasks = [];
                document.querySelectorAll('.task-list-area').forEach(col => {
                    const status = col.dataset.status;
                    if (!status) return;
                    col.querySelectorAll('.task-card').forEach((card, idx) => {
                        const task = tasks.find(t => t.id == card.dataset.id);
                        if (task) { task.status = status; task.order = idx; newTasks.push(task); }
                    });
                });
                tasks = newTasks;
                localStorage.setItem('myTasks', JSON.stringify(tasks));
                render();
            }
        });
    });
}

window.onload = () => {
    const cat = document.getElementById('taskCategory');
    const eCat = document.getElementById('editCategory');
    if (cat && eCat) {
        TASK_CONFIG.categories.forEach(c => { cat.add(new Option(c, c)); eCat.add(new Option(c, c)); });
    }
    const theme = localStorage.getItem('selectedTheme') || "";
    document.body.className = theme;
    if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = theme;
    render();
};