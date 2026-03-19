let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// 画面表示切替
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewName + 'View').classList.add('active');
    const targetNav = document.querySelector(`[onclick="switchView('${viewName}')"]`);
    if (targetNav) targetNav.classList.add('active');
    if (viewName === 'gantt') renderGantt();
}

// データの永続化と再描画
function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    render();
}

// タスクの新規登録
function addTask() {
    const title = document.getElementById('taskTitle');
    if (!title || !title.value) return;
    tasks.push({
        id: Date.now(),
        title: title.value,
        group: document.getElementById('taskGroup').value || "未設定",
        user: document.getElementById('taskUser').value || "未設定",
        category: document.getElementById('taskCategory').value,
        status: "未完了",
        startDate: document.getElementById('taskStartDate').value,
        endDate: document.getElementById('taskEndDate').value,
        memo: "",
        order: tasks.length
    });
    title.value = '';
    document.getElementById('taskGroup').value = '';
    document.getElementById('taskUser').value = '';
    saveTasks();
}

// モーダルからのタスク情報更新
function saveEdit() {
    const id = parseInt(document.getElementById('editTaskId').value);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.title = document.getElementById('editTitle').value;
        task.group = document.getElementById('editGroup').value;
        task.user = document.getElementById('editUser').value;
        task.category = document.getElementById('editCategory').value;
        task.startDate = document.getElementById('editStartDate').value;
        task.endDate = document.getElementById('editEndDate').value;
        task.memo = document.getElementById('editMemo').value;
        saveTasks();
    }
    document.getElementById('editModal').style.display = 'none';
}

// カンバンボードの描画
function render() {
    const cols = { "未完了": "list-todo", "進行中": "list-doing", "完了": "list-done" };
    Object.values(cols).forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
    const urgent = document.getElementById('urgentList');
    if (urgent) urgent.innerHTML = '';

    tasks.sort((a, b) => a.order - b.order).forEach(task => {
        const listEl = document.getElementById(cols[task.status]);
        if (listEl) listEl.appendChild(createTaskCard(task));
    });

    const limit = new Date(); limit.setHours(0, 0, 0, 0);
    limit.setDate(limit.getDate() + 3);
    tasks.filter(t => t.status !== "完了" && t.endDate && new Date(t.endDate) <= limit)
        .forEach(t => { if (urgent) urgent.appendChild(createTaskCard(t, true)); });

    if (document.getElementById('ganttView').classList.contains('active')) renderGantt();
    initSortable();
}

// ガントチャートの描画
function renderGantt() {
    const ganttArea = document.getElementById('ganttChart');
    const ganttHeader = document.getElementById('ganttHeader');
    if (!ganttArea || tasks.length === 0) return;

    const dates = tasks.filter(t => t.startDate && t.endDate).flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
    if (dates.length === 0) return;

    let minDate = new Date(Math.min(...dates));
    let maxDate = new Date(Math.max(...dates));
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 7);

    const dayWidth = 50;
    const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1;
    const timelineWidth = totalDays * dayWidth;

    ganttHeader.innerHTML = '<div style="width:200px; min-width:200px; border-right:1px solid var(--border-color)"></div>';
    ganttArea.innerHTML = '';

    for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate); d.setDate(d.getDate() + i);
        const cell = document.createElement('div');
        cell.className = `gantt-day-cell ${d.getDay() === 0 || d.getDay() === 6 ? 'weekend' : ''}`;
        cell.innerHTML = `${d.getMonth() + 1}/${d.getDate()}`;
        ganttHeader.appendChild(cell);
    }

    tasks.filter(t => t.startDate && t.endDate).forEach(task => {
        const s = new Date(task.startDate); const e = new Date(task.endDate);
        const left = (Math.ceil((s - minDate) / 86400000)) * dayWidth;
        const width = (Math.ceil((e - s) / 86400000) + 1) * dayWidth;

        const row = document.createElement('div');
        row.className = 'gantt-row';
        row.style.width = `${timelineWidth + 200}px`;
        row.innerHTML = `
            <div class="gantt-label">${task.title}</div>
            <div class="gantt-timeline" style="width:${timelineWidth}px">
                <div class="gantt-bar" style="left:${left}px; width:${width}px" onclick="openEditModal(${task.id})">${task.group} | ${task.user}</div>
            </div>
        `;
        ganttArea.appendChild(row);
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayLeft = (Math.ceil((today - minDate) / 86400000)) * dayWidth;
    if (todayLeft >= 0 && todayLeft <= timelineWidth) {
        document.querySelectorAll('.gantt-timeline').forEach(tl => {
            const line = document.createElement('div');
            line.className = 'today-line'; line.style.left = `${todayLeft}px`;
            tl.appendChild(line);
        });
    }
}

// タスクカード要素の生成
function createTaskCard(task, isUrgent = false) {
    const div = document.createElement('div');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = task.startDate ? new Date(task.startDate).setHours(0, 0, 0, 0) : null;
    const end = task.endDate ? new Date(task.endDate).setHours(0, 0, 0, 0) : null;

    let cls = '';

    if (task.status === '完了') {
        cls = 'task-done';
    } else {
        if (task.status === '未完了' && start) {
            const diffStart = (start - today) / 86400000;
            if (diffStart < 0) cls = 'overdue';
            else if (diffStart <= 1) cls = 'warning';
        }

        if (end && !cls) {
            const diffEnd = (end - today) / 86400000;
            if (diffEnd < 0) cls = 'overdue';
            else if (diffEnd <= 1) cls = 'warning';
        }

        if (!cls && task.status === '進行中') {
            cls = 'doing';
        }
    }

    div.className = `task-card ${cls}`;
    div.dataset.id = task.id;
    div.ondblclick = () => openEditModal(task.id);

    div.innerHTML = `
        <div class="task-header-row">
            <span class="category-tag">${task.category}</span>
            <span class="group-badge">${task.group || "未設定"}</span>
            <span class="user-badge">${task.user || "未設定"}</span>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-footer">
            <div class="footer-left">
                <img src="assets/icon-board.png" class="footer-icon">
                <span>${task.startDate || '-'} 〜 ${task.endDate || '-'}</span>
            </div>
            ${!isUrgent ? `<img src="assets/icon-delete.png" class="delete-icon" onclick="event.stopPropagation(); if(confirm('削除しますか？')){tasks=tasks.filter(t=>t.id!=${task.id});saveTasks();}">` : ''}
        </div>
    `;
    return div;
}

// Sortable.js の初期化 (D&D実装)
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
                        const t = tasks.find(x => x.id == card.dataset.id);
                        if (t) { t.status = status; t.order = idx; newTasks.push(t); }
                    });
                });
                tasks = newTasks; localStorage.setItem('myTasks', JSON.stringify(tasks)); render();
            }
        });
    });
}

// モーダルの表示とデータセット
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editGroup').value = task.group || "";
    document.getElementById('editUser').value = task.user || "";
    document.getElementById('editCategory').value = task.category;
    document.getElementById('editStartDate').value = task.startDate || "";
    document.getElementById('editEndDate').value = task.endDate || "";
    document.getElementById('editMemo').value = task.memo || "";
    document.getElementById('editModal').style.display = 'flex';
}

// 初期化処理
window.onload = () => {
    const cat = document.getElementById('taskCategory');
    const eCat = document.getElementById('editCategory');
    ["設計", "製造", "試験", "調査", "その他"].forEach(c => { cat.add(new Option(c, c)); eCat.add(new Option(c, c)); });
    document.body.className = localStorage.getItem('selectedTheme') || "";
    if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = document.body.className;
    render();
};