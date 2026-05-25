const DAY_ZH = ['日', '一', '二', '三', '四', '五', '六']
const DAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const COL_ORDER = [1, 2, 3, 4, 5, 6, 0]

function pad2(n) { return String(n).padStart(2, '0') }

function parseSchedule(s) {
  if (!s) return null
  const map = { '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
  const m = s.match(/週([日一二三四五六])\s*(\d{1,2})[:：](\d{2})/)
  if (!m) return null
  const dow = map[m[1]]
  const h = parseInt(m[2], 10)
  const mi = parseInt(m[3], 10)
  return { dow, h, mi, minutes: h * 60 + mi }
}

function getISOWeek(d) {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  return 1 + Math.ceil((firstThursday - target) / (7 * 24 * 3600 * 1000))
}

export default function WeeklySchedule({ students, logs, onOpenDetail }) {
  const today = new Date()
  const todayDow = today.getDay()
  const nowMinutes = today.getHours() * 60 + today.getMinutes()

  const columns = COL_ORDER.map(dow => {
    const sessions = students
      .map(s => {
        const p = parseSchedule(s.schedule)
        if (!p || p.dow !== dow) return null
        const sLogs = logs[s.student_id] || []
        const lastLog = sLogs[sLogs.length - 1]
        const isPayTime = lastLog && lastLog.cyclePos === 4
        return { student: s, parse: p, isPayTime, sessionCount: sLogs.length }
      })
      .filter(Boolean)
      .sort((a, b) => a.parse.minutes - b.parse.minutes)
    return { dow, sessions }
  })

  const totalSessions = columns.reduce((n, c) => n + c.sessions.length, 0)

  return (
    <section className="sched">
      <div className="sec-label">
        <span>T — 教師課表 / Weekly Schedule</span>
        <div className="sec-label-r">
          <span>{pad2(totalSessions)} 堂 / 週</span>
          <span>{pad2(columns.filter(c => c.sessions.length > 0).length)} 個工作日</span>
          <span>本週 W{pad2(getISOWeek(today))}</span>
        </div>
      </div>

      <div className="sched-grid">
        {columns.map(col => {
          const isToday = col.dow === todayDow
          return (
            <div key={col.dow} className={'sched-col' + (isToday ? ' today' : '')}>
              <div className="sched-col-head">
                <div>
                  <div className="sched-col-day">週{DAY_ZH[col.dow]}</div>
                  <div className="sched-col-en">{DAY_EN[col.dow]}</div>
                </div>
                {isToday && <span className="sched-col-now">Today</span>}
              </div>

              <div className="sched-col-body">
                {col.sessions.length === 0 ? (
                  <div className="sched-empty">— 無排課 —</div>
                ) : col.sessions.map(({ student, parse, isPayTime, sessionCount }) => {
                  const isLive = isToday && Math.abs(nowMinutes - parse.minutes) <= 60
                  return (
                    <div
                      key={student.student_id}
                      className={'sched-row' + (isPayTime ? ' pay' : '') + (isLive ? ' live' : '')}
                      onClick={() => onOpenDetail(student.student_id)}
                    >
                      <div className="sched-row-top">
                        <span className="sched-time">
                          {pad2(parse.h)}<span className="sched-time-sep">:</span>{pad2(parse.mi)}
                        </span>
                        {isPayTime && <span className="sched-pay-tag">收費</span>}
                      </div>
                      <div className="sched-name">{student.name}</div>
                      <div className="sched-course">{student.course}</div>
                      <div className="sched-tb">{student.textbook || '—'} · 第 {student.textbook_page || '—'} 頁</div>
                      <div className="sched-meta">
                        <span>第 {pad2(sessionCount)} 堂</span>
                        <span className="sched-meta-sep">/</span>
                        <span>週期 {pad2(Math.ceil(Math.max(sessionCount, 1) / 4))}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="sched-col-foot">
                <span>SESSIONS</span>
                <span><strong>{pad2(col.sessions.length)}</strong></span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
