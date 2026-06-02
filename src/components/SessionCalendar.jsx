import { useState, useRef, useEffect } from 'react'

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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINS  = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function TimeSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="ts-wrap" ref={ref}>
      <button className="ts-trigger" onClick={() => setOpen(o => !o)}>
        {value}
        <i className="ti ti-chevron-down ts-arrow" />
      </button>
      {open && (
        <ul className="ts-list">
          {options.map(opt => (
            <li
              key={opt}
              className={'ts-item' + (opt === value ? ' selected' : '')}
              onMouseDown={() => { onChange(opt); setOpen(false) }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SessionCalendar({ logs, schedule, onRetroLog }) {
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [pendingDate, setPendingDate] = useState(null)
  const [pendingTime, setPendingTime] = useState('12:00')

  const scheduledDay = parseScheduledDay(schedule)

  const sessionMap = {}
  logs.forEach(l => {
    const dateStr = toLocalDateStr(l.time)
    const isMakeup = scheduledDay !== null && new Date(l.time).getDay() !== scheduledDay
    sessionMap[dateStr] = { makeup: isMakeup }
  })

  const y = current.getFullYear()
  const m = current.getMonth()
  const today    = new Date()
  const todayStr = toLocalDateStr(today.toISOString())
  const firstDay = new Date(y, m, 1).getDay()
  const lastDay  = new Date(y, m + 1, 0).getDate()

  function pad(n) { return String(n).padStart(2, '0') }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ empty: true, key: 'e' + i })
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate()
    const isPast  = dateStr <= todayStr
    cells.push({ d, dateStr, isToday, isPast, session: sessionMap[dateStr] || null, key: dateStr })
  }

  function parseScheduledTime(sched) {
    const match = sched?.match(/(\d{1,2}):(\d{2})/)
    if (!match) return null
    const h = String(parseInt(match[1])).padStart(2, '0')
    const rawMin = parseInt(match[2])
    const snapped = MINS.reduce((prev, cur) =>
      Math.abs(parseInt(cur) - rawMin) < Math.abs(parseInt(prev) - rawMin) ? cur : prev
    )
    return h + ':' + snapped
  }

  function handleCellClick(cell) {
    if (!onRetroLog || cell.session || !cell.isPast) return
    if (pendingDate?.dateStr === cell.dateStr) { setPendingDate(null); return }
    setPendingDate(cell)
    setPendingTime(parseScheduledTime(schedule) ?? '12:00')
  }

  function confirmRetroLog() {
    if (!pendingDate) return
    onRetroLog(pendingDate.dateStr, pendingTime)
    setPendingDate(null)
  }

  function changeMonth(delta) {
    setCurrent(new Date(y, m + delta, 1))
    setPendingDate(null)
  }

  const [ph, pm] = pendingTime.split(':')

  return (
    <div className="cal-wrap">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={() => changeMonth(-1)}>
          <i className="ti ti-chevron-left"></i>
        </button>
        <div className="cal-month">{MONTHS[m]} {y}</div>
        <button className="cal-nav-btn" onClick={() => changeMonth(1)}>
          <i className="ti ti-chevron-right"></i>
        </button>
      </div>

      <div className="cal-grid">
        {DOWS.map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map(cell => {
          if (cell.empty) return <div key={cell.key} className="cal-cell" />
          const { d, isToday, session, isPast } = cell
          const isClickable = onRetroLog && !session && isPast
          const isPending   = pendingDate?.dateStr === cell.dateStr
          const cls = [
            'cal-cell',
            session      && 'has-session',
            isToday      && 'today',
            isClickable  && 'retro-target',
            isPending    && 'retro-pending',
          ].filter(Boolean).join(' ')
          return (
            <div key={cell.key} className={cls} onClick={() => handleCellClick(cell)}>
              <div className="cal-day">{d}</div>
              {session && (
                <div className={'cal-dot' + (session.makeup ? ' makeup' : '')} />
              )}
            </div>
          )
        })}
      </div>

      {pendingDate && (
        <div className="cal-retro-confirm">
          <span className="cal-retro-date">{pendingDate.dateStr.replace(/-/g, '/')}</span>
          <div className="cal-retro-time">
            <TimeSelect options={HOURS} value={ph} onChange={h => setPendingTime(h + ':' + pm)} />
            <span className="cal-retro-time-sep">:</span>
            <TimeSelect options={MINS} value={pm} onChange={min => setPendingTime(ph + ':' + min)} />
          </div>
          <button className="cal-retro-btn confirm" onClick={confirmRetroLog}><i className="ti ti-check"></i></button>
          <button className="cal-retro-btn cancel" onClick={() => setPendingDate(null)}>✕</button>
        </div>
      )}

      <div className="cal-legend">
        <div className="cal-legend-item">
          <div className="cal-legend-dot" style={{ background: '#ffd14d' }} /> Regular
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
