import { useState, useEffect } from 'react'
import TopBar from './components/TopBar'
import Clock from './components/Clock'
import StatusBar from './components/StatusBar'
import CardsGrid from './components/CardsGrid'
import WeeklySchedule from './components/WeeklySchedule'
import StudentDetailCard from './components/StudentDetailCard'
import Toast from './components/Toast'
import { fetchData, postLog, postEmail, postUpdateStudent, postMarkPaymentReceived, postDeleteLog } from './api/sheets'
import { buildEmail, buildFeeReceivedEmail } from './utils/email'
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

  async function recordFeeReceived(sid) {
    const student = students.find(s => s.student_id === sid)
    const studentLogs = logs[sid] || []
    const lastPayLog = [...studentLogs].reverse().find(l => l.isPay === true || l.isPay === 'true' || l.isPay === 'TRUE')
    if (!lastPayLog) return
    const now = new Date().toISOString()
    await postMarkPaymentReceived({ student_id: sid, session_number: lastPayLog.session_number, timestamp: now })
    setLogs(prev => ({
      ...prev,
      [sid]: prev[sid].map(l =>
        l.session_number === lastPayLog.session_number ? { ...l, paymentReceivedAt: now } : l
      )
    }))
    const email = buildFeeReceivedEmail(student)
    await postEmail({ to: student.email, subject: email.subject, body: email.body })
  }

  async function sendPaymentEmailManual(sid) {
    const student = students.find(s => s.student_id === sid)
    const studentLogs = logs[sid] || []
    const sorted = [...studentLogs].sort((a, b) => new Date(a.time) - new Date(b.time))
    const lastFourthIdx = sorted.reduce((found, _, i) => ((i % 4) + 1 === 4 ? i : found), -1)
    if (lastFourthIdx < 0) throw new Error('找不到第四堂紀錄')
    await sendPaymentEmail(student, sorted, lastFourthIdx)
  }

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
      const validStudents = (data.students || []).filter(s => s.student_id)
      data.students = validStudents
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
      setStatus({ msg: '已同步 Google Sheets ✓', type: 'ok' })
    } catch (e) {
      setStatus({ msg: '同步失敗：' + e.message, type: 'err' })
    } finally {
      setSyncing(false)
    }
  }

  async function deleteLog(sid, sessionNumber) {
    setStatus({ msg: '刪除中...', type: '' })
    try {
      await postDeleteLog({ student_id: sid, session_number: sessionNumber })
      setLogs(prev => ({
        ...prev,
        [sid]: prev[sid].filter(l => l.session_number !== sessionNumber)
      }))
      showToast('已刪除第 ' + sessionNumber + ' 堂紀錄')
      setStatus({ msg: '已儲存至 Google Sheets ✓', type: 'ok' })
    } catch (e) {
      setStatus({ msg: '刪除失敗：' + e.message, type: 'err' })
    }
  }

  async function retroLog(sid, dateStr, time) {
    const student = students.find(x => x.student_id === sid)
    const studentLogs = logs[sid] || []
    const lastLog = studentLogs.length > 0 ? studentLogs[studentLogs.length - 1] : null
    const cyclePos = lastLog ? (lastLog.cyclePos % 4) + 1 : 1
    const sessionNum = lastLog ? Math.max(...studentLogs.map(l => l.session_number)) + 1 : 1
    const isPaySession = cyclePos === 4

    const [h, min] = time ? time.split(':').map(Number) : [12, 0]
    const [yr, mo, dy] = dateStr.split('-').map(Number)
    const timestamp = new Date(yr, mo - 1, dy, h, min).toISOString()

    setStatus({ msg: '補打卡記錄中...', type: '' })
    try {
      await postLog({ student_id: sid, session_number: sessionNum, cycle_position: cyclePos, timestamp, is_pay_session: isPaySession })
      const newLog = { time: timestamp, cyclePos, session_number: sessionNum, isPay: isPaySession }
      setLogs(prev => ({
        ...prev,
        [sid]: [...(prev[sid] || []), newLog].sort((a, b) => a.session_number - b.session_number)
      }))
      showToast('✓ ' + student.name + ' ' + dateStr + ' 補打卡完成')
      setStatus({ msg: '已儲存至 Google Sheets ✓', type: 'ok' })
    } catch (e) {
      setStatus({ msg: '補打卡失敗：' + e.message, type: 'err' })
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
        setTimeout(() => {
          const sorted = [...updatedLogs].sort((a, b) => new Date(a.time) - new Date(b.time))
          const fourthIdx = sorted.findIndex(l => l.session_number === sessionNum)
          sendPaymentEmail(student, sorted, fourthIdx).catch(() => {})
        }, 65 * 60 * 1000)
        showToast('💰 ' + student.name + ' 第 ' + Math.ceil(sessionNum / 4) + ' 週期完成，帳單已排程寄出')
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

  async function sendPaymentEmail(student, sortedLogs, fourthIdx) {
    const cycleLogs = sortedLogs.slice(Math.max(0, fourthIdx - 3), fourthIdx + 1)
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
      <CardsGrid students={students} logs={logs} onRecord={recordClass} recording={recording} openCards={openCards} onToggle={toggleCard} onOpenDetail={openDetail} onFeeReceived={recordFeeReceived} />
      <WeeklySchedule students={students} logs={logs} onOpenDetail={openDetail} />
      {activeStudent && (
        <StudentDetailCard
          student={students.find(s => s.student_id === activeStudent)}
          logs={logs[activeStudent] || []}
          onClose={closeDetail}
          onSave={(updates) => updateStudent(activeStudent, updates)}
          onRetroLog={(dateStr, time) => retroLog(activeStudent, dateStr, time)}
          onDeleteLog={(sessionNumber) => deleteLog(activeStudent, sessionNumber)}
          onSendPaymentEmail={() => sendPaymentEmailManual(activeStudent)}
        />
      )}
      <Toast msg={toast} />
    </>
  )
}
