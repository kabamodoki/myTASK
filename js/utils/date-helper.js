function getLocalDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
}