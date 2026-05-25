import { useState, useEffect, useMemo } from 'react'
import TopBar, { useThemeState } from './components/TopBar'
import Clock from './components/Clock'
import StatusBar from './components/StatusBar'
import CardsGrid from './components/CardsGrid'
import WeeklySchedule from './components/WeeklySchedule'
import StudentDetailCard from './components/StudentDetailCard'
import Toast from './components/Toast'
import { fetchData, postLog, postEmail, postUpdateStudent, postMarkPaymentReceived } from './api/sheets'
import { buildEmail, buildFeeReceivedEmail } from './utils/email'
import { formatDate } from './utils/date'

export default function App() {
  const themeState = useThemeState()
  const [students, setStudents] = useState([])
  const [logs, setLogs] = useState({})
  const [status, setStatus] = useState({ msg: 'INITIALISING…', type: 'busy' })
  const [toast, setToast] = useState({ msg: '', kind: '' })
  const [syncing, setSyncing] = useState(false)
  const [recording, setRecording] = useState(new Set())
  const [openCards, setOpenCards] = useState(new Set())
  const [activeStudent, setActiveStudent] = useState(null)

  useEffect(() => { syncData() }, [])

  function showToast(msg, kind = '') {
    setToast({ msg, kind })
    setTimeout(() => setToast({ msg: '', kind: '' }), 3500)
  }

  function openDetail(sid) { setActiveStudent(sid) }
  function closeDetail() { setActiveStudent(null) }

  function toggleCard(sid) {
    setOpenCards(prev => {
      const n = new Set(prev)
      n.has(sid) ? n.delete(sid) : n.add(sid)
      return n
    })
  }

  async function syncData() {
    setSyncing(true)
    setStatus({ msg: 'SYNCING WITH LEDGER…', type: 'busy' })
    try {
      const data = await fetchData()
      const newLogs = {}
      data.students.forEach(s => { newLogs[s.student_id] = [] })
      ;(data.sessions || []).forEach(row => {
        if (newLogs[row.student_id] !== undefined) {
          newLogs[row.student_id].push({
            time: row.timestamp,
            cyclePos: Number(row.cycle_position),
            session_number: Number(row.session_number),
            isPay: row.is_pay_session,
            paymentReceivedAt: row.payment_received_at || '',
          })
        }
      })
      data.students.forEach(s => {
        newLogs[s.student_id].sort((a, b) => a.session_number - b.session_number)
      })
      setStudents(data.students)
      setLogs(newLogs)
      setStatus({ msg: 'SYNCED ✓  ' + new Date().toLocaleTimeString('en-GB'), type: 'ok' })
    } catch (e) {
      setStatus({ msg: 'SYNC FAILED — ' + e.message, type: 'err' })
    } finally {
      setSyncing(false)
    }
  }

  async function recordClass(sid) {
    const student = students.find(x => x.student_id === sid)
    const studentLogs = logs[sid] || []
    const lastLog = studentLogs.length > 0 ? studentLogs[studentLogs.length - 1] : null
    const cyclePos = lastLog ? (lastLog.cyclePos % 4) + 1 : 1
    const sessionNum = lastLog ? Math.max(...studentLogs.map(l => l.session_number)) + 1 : 1
    const now = new Date().toISOString()
    const isPaySession = cyclePos === 4

    if (student.meet_link) window.open(student.meet_link, '_blank')

    setRecording(prev => new Set(prev).add(sid))
    setStatus({ msg: 'RECORDING SESSION…', type: 'busy' })
    try {
      await postLog({ student_id: sid, session_number: sessionNum, cycle_position: cyclePos, timestamp: now, is_pay_session: isPaySession })
      const newLog = { time: now, cyclePos, session_number: sessionNum, isPay: isPaySession, paymentReceivedAt: '' }
      setLogs(prev => ({ ...prev, [sid]: [...studentLogs, newLog] }))

      if (isPaySession) {
        setTimeout(() => {
          sendPaymentEmail(student, [...studentLogs, newLog], sessionNum).catch(() => {})
        }, 65 * 60 * 1000)
        showToast(student.name + ' · 第 ' + Math.ceil(sessionNum / 4) + ' 週期完成，帳單已排程寄出', 'amber')
      } else {
        showToast(student.name + ' · 第 ' + sessionNum + ' 堂已記錄')
      }
      setStatus({ msg: 'SAVED ✓  ' + new Date().toLocaleTimeString('en-GB'), type: 'ok' })
    } catch (e) {
      setStatus({ msg: 'SAVE FAILED — ' + e.message, type: 'err' })
    } finally {
      setRecording(prev => { const s = new Set(prev); s.delete(sid); return s })
    }
  }

  async function sendPaymentEmail(student, studentLogs, lastSessionNum) {
    const startSession = lastSessionNum - 3
    const cycleLogs = studentLogs
      .filter(l => l.session_number >= startSession && l.session_number <= lastSessionNum)
      .sort((a, b) => a.session_number - b.session_number)
    const dates = cycleLogs.map(l => formatDate(l.time))
    const total = Number(student.price) * 4
    const email = buildEmail(student, dates, total)
    await postEmail({ to: student.email, subject: email.subject, body: email.body })
  }

  async function recordFeeReceived(sid) {
    const student = students.find(s => s.student_id === sid)
    const studentLogs = logs[sid] || []
    const lastPayLog = [...studentLogs].reverse().find(l => l.isPay === true || l.isPay === 'true' || l.isPay === 'TRUE')
    if (!lastPayLog) return
    const now = new Date().toISOString()
    await postMarkPaymentReceived({ student_id: sid, session_number: lastPayLog.session_number, timestamp: now })
    setLogs(prev => ({
      ...prev,
      [sid]: prev[sid].map(l => l.session_number === lastPayLog.session_number ? { ...l, paymentReceivedAt: now } : l)
    }))
    const email = buildFeeReceivedEmail(student)
    await postEmail({ to: student.email, subject: email.subject, body: email.body })
    showToast(student.name + ' · 學費已標記為已收到', 'amber')
  }

  async function updateStudent(sid, updates) {
    await postUpdateStudent({ student_id: sid, ...updates })
    setStudents(prev => prev.map(s => s.student_id === sid ? { ...s, ...updates } : s))
  }

  const stats = useMemo(() => {
    let paid = 0, due = 0
    Object.entries(logs).forEach(([sid, arr]) => {
      const lastPay = [...arr].reverse().find(l => l.isPay === true || l.isPay === 'true' || l.isPay === 'TRUE')
      if (lastPay) {
        if (lastPay.paymentReceivedAt) paid++
        else if (arr[arr.length - 1]?.cyclePos === 4) due++
      }
    })
    return { count: students.length, paid, due }
  }, [students, logs])

  function pad2(n) { return String(n).padStart(2, '0') }

  return (
    <div className="frame">
      <TopBar
        onSync={syncData}
        syncing={syncing}
        theme={themeState.theme}
        mode={themeState.mode}
        onPickTheme={themeState.pickTheme}
        onToggleMode={themeState.toggleMode}
      />
      <Clock />
      <StatusBar msg={status.msg} type={status.type} count={stats.count} paidCount={stats.paid} dueCount={stats.due} />

      <div className="sec-label">
        <span>S — 學生管理 / Students</span>
        <div className="sec-label-r">
          <span>{pad2(students.length)} 位</span>
          <span>已收 {pad2(stats.paid)}</span>
          <span>待收 {pad2(stats.due)}</span>
          <span>點擊頁籤 → 詳情</span>
        </div>
      </div>

      <CardsGrid
        students={students}
        logs={logs}
        onRecord={recordClass}
        recording={recording}
        openCards={openCards}
        onToggle={toggleCard}
        onOpenDetail={openDetail}
        onFeeReceived={recordFeeReceived}
      />

      <WeeklySchedule students={students} logs={logs} onOpenDetail={openDetail} />

      <div style={{ marginTop: 56, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--grey-3)' }}>
        <span>TUTORING DASHBOARD · V2.0</span>
        <span>{new Date().getFullYear()} · 一人一頁 · 一週一堂 · 四堂一週期</span>
      </div>

      {activeStudent && (
        <StudentDetailCard
          student={students.find(s => s.student_id === activeStudent)}
          logs={logs[activeStudent] || []}
          onClose={closeDetail}
          onSave={(updates) => updateStudent(activeStudent, updates)}
        />
      )}

      <Toast msg={toast.msg} kind={toast.kind} />
    </div>
  )
}
