import { useState } from 'react'

const MONTHS_EN = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const DOWS_SHORT = ['S','M','T','W','T','F','S']

function pad2(n) { return String(n).padStart(2, '0') }

function parseScheduledDay(schedule) {
  if (!schedule) return null
  const map = { '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
  const match = schedule.match(/週([日一二三四五六])/)
  return match ? (map[match[1]] ?? null) : null
}

function toLocalDateStr(iso) {
  const d = new Date(iso)
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

export default function SessionCalendar({ logs, schedule }) {
  const [current, setCurrent] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const scheduledDay = parseScheduledDay(schedule)
  const sessionMap = {}
  logs.forEach(l => {
    const ds = toLocalDateStr(l.time)
    const isMakeup = scheduledDay !== null && new Date(l.time).getDay() !== scheduledDay
    sessionMap[ds] = { makeup: isMakeup }
  })

  const y = current.getFullYear()
  const m = current.getMonth()
  const today = new Date()
  const firstDay = new Date(y, m, 1).getDay()
  const lastDay = new Date(y, m + 1, 0).getDate()
  const prevLastDay = new Date(y, m, 0).getDate()

  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevLastDay - i, inMonth: false, key: 'p' + i })
  for (let d = 1; d <= lastDay; d++) {
    const ds = `${y}-${pad2(m + 1)}-${pad2(d)}`
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate()
    cells.push({ d, ds, inMonth: true, today: isToday, session: sessionMap[ds] || null, key: ds })
  }
  const totalCells = Math.ceil(cells.length / 7) * 7
  let leadDay = 1
  while (cells.length < totalCells) cells.push({ d: leadDay++, inMonth: false, key: 'n' + leadDay })

  return (
    <div className="cal">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={() => setCurrent(new Date(y, m - 1, 1))}>‹</button>
        <div className="cal-month">{MONTHS_EN[m]}<span className="yr">{y}</span></div>
        <button className="cal-nav-btn" onClick={() => setCurrent(new Date(y, m + 1, 1))}>›</button>
      </div>
      <div className="cal-grid">
        {DOWS_SHORT.map((d, i) => <div key={'h' + i} className="cal-dow">{d}</div>)}
        {cells.map(cell => (
          <div key={cell.key} className={'cal-cell' + (cell.inMonth ? ' in-month' : '') + (cell.today ? ' today' : '')}>
            <span className="cal-day">{cell.d}</span>
            {cell.session && <div className={'cal-dot' + (cell.session.makeup ? ' makeup' : '')} />}
          </div>
        ))}
      </div>
      <div className="cal-legend">
        <div className="cal-legend-item">
          <div className="cal-legend-dot" style={{ background: 'var(--amber)' }} />
          Regular
        </div>
        {scheduledDay !== null && (
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: 'var(--fg)', height: 2 }} />
            Makeup
          </div>
        )}
      </div>
    </div>
  )
}
