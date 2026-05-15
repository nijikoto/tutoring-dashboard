import { useState, useEffect } from 'react'
import TopBar from './components/TopBar'
import Clock from './components/Clock'
import StatusBar from './components/StatusBar'
import CardsGrid from './components/CardsGrid'
import StudentDetailCard from './components/StudentDetailCard'
import Toast from './components/Toast'
import { fetchData, postLog, postEmail, postUpdateStudent } from './api/sheets'
import { buildEmail } from './utils/email'
import { formatDate } from './utils/date'

export default function App() {
  const [students, setStudents] = useState([])
  const [logs, setLogs] = useState({})
  const [status, setStatus] = useState({ msg: '連接中...', type: '' })
  const [toast, setToast] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [recording, setRecording] = useState(new Set())
  const [openCards, setOpenCards] = useState(new Set())
  const [activeStudent, setActiveStudent] = useState(null)

  function openDetail(sid) { setActiveStudent(sid) }
  function closeDetail() { setActiveStudent(null) }

  async function updateStudent(sid, updates) {
    await postUpdateStudent({ student_id: sid, ...updates })
    setStudents(prev => prev.map(s => s.student_id === sid ? { ...s, ...updates } : s))
  }

  function toggleCard(sid) {
    setOpenCards(prev => {
      const next = new Set(prev)
      next.has(sid) ? next.delete(sid) : next.add(sid)
      return next
    })
  }

  useEffect(() => { syncData() }, [])

  async function syncData() {
    setSyncing(true)
    setStatus({ msg: '同步中...', type: '' })
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
          })
        }
      })
      data.students.forEach(s => {
        newLogs[s.student_id].sort((a, b) => a.session_number - b.session_number)
      })
      setStudents(data.students)
      setLogs(newLogs)
      setStatus({ msg: '已同步 Google Sheets ✓', type: 'ok' })
    } catch (e) {
      setStatus({ msg: '同步失敗：' + e.message, type: 'err' })
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
    setStatus({ msg: '記錄中...', type: '' })
    try {
      await postLog({ student_id: sid, session_number: sessionNum, cycle_position: cyclePos, timestamp: now, is_pay_session: isPaySession })
      const newLog = { time: now, cyclePos, session_number: sessionNum, isPay: isPaySession }
      const updatedLogs = [...studentLogs, newLog]
      setLogs(prev => ({ ...prev, [sid]: updatedLogs }))

      if (isPaySession) {
        try {
          await sendPaymentEmail(student, updatedLogs, sessionNum)
          showToast('💰 ' + student.name + ' 第 ' + Math.ceil(sessionNum / 4) + ' 週期完成，帳單已寄出！')
        } catch {
          showToast('⚠️ 課堂已記錄，但帳單寄送失敗')
        }
      } else {
        showToast('✓ ' + student.name + ' 第 ' + sessionNum + ' 堂已記錄')
      }
      setStatus({ msg: '已儲存至 Google Sheets ✓', type: 'ok' })
    } catch (e) {
      setStatus({ msg: '儲存失敗：' + e.message, type: 'err' })
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

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  return (
    <>
      <TopBar onSync={syncData} syncing={syncing} />
      <Clock />
      <StatusBar msg={status.msg} type={status.type} />
      <div style={{ padding: '0 20px 12px', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="section-title">學生管理</div>
      </div>
      <CardsGrid students={students} logs={logs} onRecord={recordClass} recording={recording} openCards={openCards} onToggle={toggleCard} onOpenDetail={openDetail} />
      {activeStudent && (
        <StudentDetailCard
          student={students.find(s => s.student_id === activeStudent)}
          logs={logs[activeStudent] || []}
          onClose={closeDetail}
          onSave={(updates) => updateStudent(activeStudent, updates)}
        />
      )}
      <Toast msg={toast} />
    </>
  )
}
