function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(viewName + 'View').classList.add('active');

    const targetNav = document.querySelector(`[onclick="switchView('${viewName}')"]`);
    if (targetNav) targetNav.classList.add('active');

    if (viewName === 'gantt') renderGantt();
}

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
    closeEditModal();
}

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

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

function changeTheme(themeName) {
    document.body.className = themeName;
    try {
        localStorage.setItem('selectedTheme', themeName);
    } catch (e) { }
}

window.onload = () => {
    const cat = document.getElementById('taskCategory');
    const eCat = document.getElementById('editCategory');
    ["設計", "製造", "試験", "調査", "その他"].forEach(c => {
        cat.add(new Option(c, c));
        eCat.add(new Option(c, c));
    });

    let savedTheme = "";
    try {
        savedTheme = localStorage.getItem('selectedTheme') || "";
    } catch (e) { }

    document.body.className = savedTheme;
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = savedTheme;

    renderKanban();
};