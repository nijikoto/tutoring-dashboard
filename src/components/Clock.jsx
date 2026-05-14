import { useState, useEffect } from 'react'

const DAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const dateStr =
    now.getFullYear() + ' / ' +
    String(now.getMonth() + 1).padStart(2, '0') + ' / ' +
    String(now.getDate()).padStart(2, '0') +
    '  週' + DAYS[now.getDay()]

  return (
    <div className="clock-section">
      <div id="live-clock">{hh}:{mm}:{ss}</div>
      <div className="clock-date">{dateStr}</div>
    </div>
  )
}
