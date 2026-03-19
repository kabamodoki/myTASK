function renderKanban() {
    const cols = { "未完了": "list-todo", "進行中": "list-doing", "完了": "list-done" };
    Object.values(cols).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    const urgent = document.getElementById('urgentList');
    if (urgent) urgent.innerHTML = '';

    tasks.sort((a, b) => a.order - b.order).forEach(task => {
        const listEl = document.getElementById(cols[task.status]);
        if (listEl) listEl.appendChild(createTaskCard(task));
    });

    const limit = new Date();
    limit.setHours(0, 0, 0, 0);
    limit.setDate(limit.getDate() + 3);

    tasks.filter(t => t.status !== "完了" && t.endDate && new Date(t.endDate) <= limit)
        .forEach(t => {
            if (urgent) urgent.appendChild(createTaskCard(t, true));
        });

    initSortable();
}

function createTaskCard(task, isUrgent = false) {
    const div = document.createElement('div');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = task.startDate ? getLocalDate(task.startDate) : null;
    const end = task.endDate ? getLocalDate(task.endDate) : null;

    let cls = '';
    if (task.status === '完了') {
        cls = 'task-done';
    } else {
        if (task.status === '未完了' && start) {
            const diffStart = (start - today) / 86400000;
            if (diffStart < 0) cls = 'overdue'; else if (diffStart <= 1) cls = 'warning';
        }
        if (end && !cls) {
            const diffEnd = (end - today) / 86400000;
            if (diffEnd < 0) cls = 'overdue'; else if (diffEnd <= 1) cls = 'warning';
        }
        if (!cls && task.status === '進行中') { cls = 'doing'; }
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

function initSortable() {
    document.querySelectorAll('.task-list-area').forEach(el => {
        if (el.id === 'urgentList') return;
        new Sortable(el, {
            group: 'kanban',
            animation: 150,
            onEnd: () => {
                const newTasks = [];
                document.querySelectorAll('.task-list-area').forEach(col => {
                    const status = col.dataset.status;
                    if (!status) return;
                    col.querySelectorAll('.task-card').forEach((card, idx) => {
                        const t = tasks.find(x => x.id == card.dataset.id);
                        if (t) {
                            t.status = status;
                            t.order = idx;
                            newTasks.push(t);
                        }
                    });
                });
                tasks = newTasks;
                saveTasks();
            }
        });
    });
}