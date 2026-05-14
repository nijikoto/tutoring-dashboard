export function formatDate(iso) {
  const d = new Date(iso)
  return (
    d.getFullYear() + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    String(d.getDate()).padStart(2, '0')
  )
}

export function formatDT(iso) {
  const d = new Date(iso)
  return (
    formatDate(iso) + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0')
  )
}
