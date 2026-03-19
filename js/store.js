let tasks = [];

try {
    tasks = JSON.parse(localStorage.getItem('myTasks')) || [];
} catch (e) {
    // プレビュー環境等でのエラー回避
}

function saveTasks() {
    try {
        localStorage.setItem('myTasks', JSON.stringify(tasks));
    } catch (e) {}
    
    renderKanban();
    if (document.getElementById('ganttView').classList.contains('active')) {
        renderGantt();
    }
}