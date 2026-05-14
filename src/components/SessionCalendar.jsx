import { useState } from 'react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOWS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function parseScheduledDay(schedule) {
  if (!schedule) return null
  const map = { '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
  const match = schedule.match(/週([日一二三四五六])/)
  return match ? (map[match[1]] ?? null) : null
}

function toLocalDateStr(iso) {
  const d = new Date(iso)
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export default function SessionCalendar({ logs, schedule }) {
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const scheduledDay = parseScheduledDay(schedule)

  const sessionMap = {}
  logs.forEach(l => {
    const dateStr = toLocalDateStr(l.time)
    const isMakeup = scheduledDay !== null && new Date(l.time).getDay() !== scheduledDay
    sessionMap[dateStr] = { makeup: isMakeup }
  })

  const y = current.getFullYear()
  const m = current.getMonth()
  const today     = new Date()
  const firstDay  = new Date(y, m, 1).getDay()
  const lastDay   = new Date(y, m + 1, 0).getDate()

  function pad(n) { return String(n).padStart(2, '0') }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ empty: true, key: 'e' + i })
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate()
    cells.push({ d, dateStr, isToday, session: sessionMap[dateStr] || null, key: dateStr })
  }

  return (
    <div className="cal-wrap">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={() => setCurrent(new Date(y, m - 1, 1))}>
          <i className="ti ti-chevron-left"></i>
        </button>
        <div className="cal-month">{MONTHS[m]} {y}</div>
        <button className="cal-nav-btn" onClick={() => setCurrent(new Date(y, m + 1, 1))}>
          <i className="ti ti-chevron-right"></i>
        </button>
      </div>

      <div className="cal-grid">
        {DOWS.map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map(cell => {
          if (cell.empty) return <div key={cell.key} className="cal-cell" />
          const { d, isToday, session } = cell
          const cls = ['cal-cell', session && 'has-session', isToday && 'today'].filter(Boolean).join(' ')
          return (
            <div key={cell.key} className={cls}>
              <div className="cal-day">{d}</div>
              {session && (
                <div className={'cal-dot' + (session.makeup ? ' makeup' : '')} />
              )}
            </div>
          )
        })}
      </div>

      <div className="cal-legend">
        <div className="cal-legend-item">
          <div className="cal-legend-dot" style={{ background: 'rgba(255,255,255,0.7)' }} /> Regular
        </div>
        {scheduledDay !== null && (
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: 'rgba(255,182,210,0.9)' }} /> Makeup
          </div>
        )}
      </div>
    </div>
  )
}
