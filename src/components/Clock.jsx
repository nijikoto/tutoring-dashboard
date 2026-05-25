import { useState, useEffect } from 'react'

const DOW_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DOW_ZH = ['日', '一', '二', '三', '四', '五', '六']

function pad2(n) { return String(n).padStart(2, '0') }

function getWeekNumber(d) {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  return 1 + Math.ceil((firstThursday - target) / (7 * 24 * 3600 * 1000))
}

export default function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = pad2(now.getHours())
  const mm = pad2(now.getMinutes())
  const ss = pad2(now.getSeconds())

  return (
    <div className="clock-row">
      <div className="clock-left">
        <div><span className="clock-kv-key">DAY</span> <span className="clock-kv-val">{DOW_EN[now.getDay()]} · 週{DOW_ZH[now.getDay()]}</span></div>
        <div><span className="clock-kv-key">WEEK</span> <span className="clock-kv-val">W{pad2(getWeekNumber(now))}</span></div>
      </div>
      <div className="clock-mid">
        <div className="clock-num">
          {hh}<span className="colon">:</span>{mm}<span className="colon">:</span>{ss}
        </div>
        <div className="clock-sub">
          {now.getFullYear()} · {pad2(now.getMonth() + 1)} · {pad2(now.getDate())}
        </div>
      </div>
      <div className="clock-right">
        <div><span className="clock-kv-key">TZ</span> <span className="clock-kv-val">UTC+8</span></div>
        <div><span className="clock-kv-key">UPTIME</span> <span className="clock-kv-val">{hh}H {mm}M</span></div>
      </div>
    </div>
  )
}
