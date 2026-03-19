function renderGantt() {
    const ganttScroll = document.getElementById('ganttScrollContainer');
    if (!ganttScroll) return;
    ganttScroll.innerHTML = '';

    const ganttTasks = tasks.filter(t => t.startDate && t.endDate).sort((a, b) => {
        const gA = a.group || "未設定"; const gB = b.group || "未設定";
        if (gA < gB) return -1; if (gA > gB) return 1;
        const sA = getLocalDate(a.startDate).getTime(); const sB = getLocalDate(b.startDate).getTime();
        if (sA !== sB) return sA - sB;
        return getLocalDate(a.endDate).getTime() - getLocalDate(b.endDate).getTime();
    });

    if (ganttTasks.length === 0) {
        ganttScroll.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:var(--text-sub); padding-top: 100px;">
                <div style="font-size:3rem; opacity:0.3; margin-bottom:15px;">📊</div>
                <div style="font-weight:bold; font-size:1.1rem;">表示できるタスクがありません</div>
            </div>`;
        return;
    }

    const dates = ganttTasks.flatMap(t => [getLocalDate(t.startDate), getLocalDate(t.endDate)]);
    let minDate = new Date(Math.min(...dates));
    let maxDate = new Date(Math.max(...dates));
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 7);

    const dayWidth = 45;
    const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1;
    const timelineWidth = totalDays * dayWidth;
    const labelWidth = 340;

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const innerChart = document.createElement('div');
    innerChart.className = 'gantt-chart-inner';

    const headerRow = document.createElement('div');
    headerRow.className = 'gantt-header-row';
    headerRow.innerHTML = `
        <div class="gantt-label-header">
            <div style="flex:1;">タスク名</div>
            <div style="width:80px; text-align:center;">作業者</div>
            <div style="width:70px; text-align:center;">状況</div>
        </div>`;

    const timelineBgHeader = document.createElement('div');
    timelineBgHeader.style.display = 'flex';
    timelineBgHeader.style.width = `${timelineWidth}px`;
    timelineBgHeader.style.minWidth = `${timelineWidth}px`;
    timelineBgHeader.style.flexShrink = '0';
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate); d.setDate(d.getDate() + i);
        const cell = document.createElement('div');
        cell.className = `gantt-day-cell ${d.getDay() === 0 || d.getDay() === 6 ? 'weekend' : ''}`;
        cell.style.width = `${dayWidth}px`; cell.style.minWidth = `${dayWidth}px`;
        cell.innerHTML = `${d.getMonth() + 1}/${d.getDate()}`;
        timelineBgHeader.appendChild(cell);
    }
    headerRow.appendChild(timelineBgHeader);
    innerChart.appendChild(headerRow);

    const chartArea = document.createElement('div');
    chartArea.className = 'gantt-chart-area';

    let currentGroup = null;
    let groupWrapper = null;

    ganttTasks.forEach(task => {
        const groupName = task.group || "未設定";
        if (groupName !== currentGroup) {
            currentGroup = groupName;
            groupWrapper = document.createElement('div');
            groupWrapper.className = 'gantt-group-wrapper';
            groupWrapper.innerHTML = `
            <div class="gantt-group-header-row">
                <div class="gantt-group-name">
                    <img src="assets/icon-pen.png" class="footer-icon">
                    <span>${groupName}</span>
                </div>
                <div style="width:${timelineWidth}px; min-width:${timelineWidth}px; flex-shrink:0;"></div>
            </div>`;
            chartArea.appendChild(groupWrapper);
        }

        const s = getLocalDate(task.startDate);
        const e = getLocalDate(task.endDate);
        const left = Math.max(0, (s - minDate) / 86400000) * dayWidth;
        const width = (Math.max(0, (e - s) / 86400000) + 1) * dayWidth;

        let barCls = '';
        if (task.status === '完了') { barCls = 'task-done'; }
        else {
            if (task.status === '未完了' && s) {
                const diffStart = (s - today) / 86400000;
                if (diffStart < 0) barCls = 'overdue'; else if (diffStart <= 1) barCls = 'warning';
            }
            if (e && !barCls) {
                const diffEnd = (e - today) / 86400000;
                if (diffEnd < 0) barCls = 'overdue'; else if (diffEnd <= 1) barCls = 'warning';
            }
            if (!barCls && task.status === '進行中') barCls = 'doing';
        }

        const row = document.createElement('div');
        row.className = 'gantt-row';
        row.innerHTML = `
            <div class="gantt-label">
                <div class="g-col-title" title="${task.title}">${task.title}</div>
                <div class="g-col-user" title="${task.user}">${task.user}</div>
                <div class="g-col-status" data-status="${task.status}">${task.status}</div>
            </div>
            <div class="gantt-timeline" style="width:${timelineWidth}px; min-width:${timelineWidth}px; flex-shrink:0;">
                <div class="gantt-bar ${barCls}" style="left:${left}px; width:${width}px" onclick="openEditModal(${task.id})">${Math.ceil(width / dayWidth)}日</div>
            </div>
        `;
        groupWrapper.appendChild(row);
    });

    const todayIndex = (today - minDate) / 86400000;
    if (todayIndex >= 0 && todayIndex <= totalDays) {
        const line = document.createElement('div');
        line.className = 'today-line';
        line.style.left = `${labelWidth + (todayIndex * dayWidth) + (dayWidth / 2)}px`;
        chartArea.appendChild(line);
    }

    innerChart.appendChild(chartArea);
    ganttScroll.appendChild(innerChart);

    setTimeout(() => {
        if (ganttScroll && todayIndex >= 0) {
            ganttScroll.scrollLeft = Math.max(0, (todayIndex - 3) * dayWidth);
        }
    }, 10);
}