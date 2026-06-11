import { useState, useEffect } from 'react'
import { formatDateOnly, formatDT } from '../utils/date'
import SessionCalendar from './SessionCalendar'

export default function StudentDetailCard({ student, logs, onClose, onSave, onRetroLog, onDeleteLog, onSendPaymentEmail }) {
  const [editPage, setEditPage] = useState(student.textbook_page ?? '')
  const [links, setLinks] = useState([
    student.gamma_link_1 || '',
    student.gamma_link_2 || '',
  ])
  const [addingLink, setAddingLink] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [savingPage, setSavingPage] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  const [savingMakeup, setSavingMakeup] = useState(false)
  const [makeupBump, setMakeupBump] = useState(0)
  const [saveError, setSaveError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [meetLink, setMeetLink] = useState(student.meet_link || '')
  const [editingMeet, setEditingMeet] = useState(false)
  const [savingMeet, setSavingMeet] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailMsg, setEmailMsg] = useState({ text: '', ok: true })

  const makeupCount = Number(student.makeup_count) || 0

  async function handleMakeupDelta(delta) {
    const next = Math.max(0, makeupCount + delta)
    if (next === makeupCount) return
    setSavingMakeup(true)
    setMakeupBump(b => b + 1)
    try { await onSave({ makeup_count: next }) }
    catch { showSaveError('待補課儲存失敗，請重試') }
    finally { setSavingMakeup(false) }
  }
  const [closing, setClosing] = useState(false)

  function showSaveError(msg) {
    setSaveError(msg)
    setTimeout(() => setSaveError(''), 3000)
  }

  const thisYear = new Date().getFullYear()
  const yearCount = logs.filter(l => new Date(l.time).getFullYear() === thisYear).length
  const sortedLogs = [...logs].sort((a, b) => new Date(a.time) - new Date(b.time))
  const cyclePosMap = Object.fromEntries(sortedLogs.map((l, i) => [l.session_number, (i % 4) + 1]))
  const lastFourthSession = [...sortedLogs].filter((_, i) => (i % 4) + 1 === 4).slice(-1)[0]?.session_number
  const recentLogs = [...logs].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)
  const filledLinks = links.filter(Boolean)
  const canAddLink = filledLinks.length < 2

  async function handleSendPaymentEmail() {
    setSendingEmail(true)
    setEmailMsg({ text: '', ok: true })
    try {
      await onSendPaymentEmail()
      setEmailMsg({ text: '✓ 繳費通知已寄出', ok: true })
      setTimeout(() => setEmailMsg({ text: '', ok: true }), 3000)
    } catch (e) {
      setEmailMsg({ text: e.message || '寄送失敗，請重試', ok: false })
      setTimeout(() => setEmailMsg({ text: '', ok: true }), 3000)
    } finally {
      setSendingEmail(false)
    }
  }

  async function saveMeetLink() {
    setSavingMeet(true)
    try {
      await onSave({ meet_link: meetLink })
      setEditingMeet(false)
    } catch {
      showSaveError('Meet 連結儲存失敗，請重試')
    } finally {
      setSavingMeet(false)
    }
  }

  function handleClose() {
    setClosing(true)
    setTimeout(() => onClose(), 180)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function onKeyDown(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function handleSavePage() {
    setSavingPage(true)
    try {
      await onSave({ textbook_page: editPage })
    } catch {
      showSaveError('儲存失敗，請重試')
    } finally {
      setSavingPage(false)
    }
  }

  async function saveLinks(nextLinks) {
    setSavingLinks(true)
    try {
      await onSave({ gamma_link_1: nextLinks[0] || '', gamma_link_2: nextLinks[1] || '' })
    } catch {
      showSaveError('連結儲存失敗，請重試')
    } finally {
      setSavingLinks(false)
    }
  }

  async function handleDeleteLink(idx) {
    const next = links.map((l, i) => i === idx ? '' : l)
    setLinks(next)
    await saveLinks(next)
  }

  async function handleAddLink() {
    if (!newLinkUrl.trim()) return
    const emptyIdx = links.findIndex(l => !l)
    const next = links.map((l, i) => i === emptyIdx ? newLinkUrl.trim() : l)
    setLinks(next)
    setNewLinkUrl('')
    setAddingLink(false)
    await saveLinks(next)
  }

  return (
    <div className={'detail-overlay' + (closing ? ' closing' : '')} onClick={handleClose}>
      <div className={'detail-card' + (closing ? ' closing' : '')} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="detail-header">
          <div className="avatar detail-avatar" style={{ background: student.avatar_color }}>
            {student.initials}
          </div>
          <div className="detail-header-info">
            <div className="detail-name">{student.name}</div>
            <div className="course-name">{student.course}</div>
            {student.schedule && (
              <div className="schedule-tag">
                <i className="ti ti-clock"></i> {student.schedule}
              </div>
            )}
          </div>
          <button className="detail-close-btn" onClick={handleClose}>
            <i className="ti ti-x"></i>
          </button>
        </div>

        <hr className="detail-divider" />

        {/* Two columns */}
        <div className="detail-two-col">

          {/* Left */}
          <div className="detail-col">
            <div className="detail-section-title">
              <i className="ti ti-info-circle"></i> 基本資料
            </div>
            <div className="detail-info-grid">
              <div className="detail-info-block">
                <div className="detail-info-label">開始上課日</div>
                <div className="detail-info-value">{formatDateOnly(student.start_date)}</div>
              </div>
              <div className="detail-info-block">
                <div className="detail-info-label">今年累積堂數</div>
                <div className="detail-info-value accent">{yearCount} 堂</div>
              </div>
              <div className="detail-info-block full">
                <div className="detail-info-label">課本進度</div>
                <div className="detail-progress-row">
                  <span className="detail-muted">{student.textbook || '—'}　第</span>
                  <input
                    className="detail-page-input"
                    type="number"
                    value={editPage}
                    min={1}
                    onChange={e => setEditPage(e.target.value)}
                  />
                  <span className="detail-muted">頁</span>
                  <button className="detail-save-btn" onClick={handleSavePage} disabled={savingPage}>
                    <i className="ti ti-device-floppy"></i>
                    {savingPage ? '儲存中' : '儲存'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div className="detail-section-title">
                <i className="ti ti-refresh"></i> 待補課
                {makeupCount > 0 && (
                  <span style={{ marginLeft: 'auto', color: '#ffd14d', fontFamily: 'Khand, sans-serif', fontSize: 20, fontWeight: 700 }}>
                    {makeupCount} 堂
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <button className="detail-save-btn" onClick={() => handleMakeupDelta(+1)} disabled={savingMakeup}>
                  + 請假
                </button>
                <button className="detail-save-btn" onClick={() => handleMakeupDelta(-1)} disabled={savingMakeup || makeupCount <= 0}>
                  − 已補課
                </button>
                {makeupCount === 0 && (
                  <span className="detail-muted">無待補課</span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div className="detail-section-title">
                <i className="ti ti-presentation"></i> 白板連結
              </div>
              <div className="detail-gamma-list">
                {links.map((link, i) =>
                  link ? (
                    <div key={i} className="detail-gamma-item">
                      <input
                        className="detail-link-input"
                        type="url"
                        value={link}
                        onChange={e => {
                          const next = links.map((l, idx) => idx === i ? e.target.value : l)
                          setLinks(next)
                        }}
                        onBlur={e => {
                          const next = links.map((l, idx) => idx === i ? e.target.value : l)
                          saveLinks(next)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const next = links.map((l, idx) => idx === i ? e.target.value : l)
                            saveLinks(next)
                            e.target.blur()
                          }
                        }}
                      />
                      <button className="detail-icon-btn btn-link" onClick={() => window.open(link, '_blank')}>
                        <i className="ti ti-external-link"></i>
                      </button>
                      <button className="detail-icon-btn btn-delete" onClick={() => handleDeleteLink(i)} disabled={savingLinks}>
                        <i className="ti ti-trash"></i>
                      </button>
                    </div>
                  ) : null
                )}

                {addingLink ? (
                  <div className="detail-gamma-item">
                    <input
                      className="detail-link-input"
                      type="url"
                      placeholder="貼上連結..."
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                      autoFocus
                    />
                    <button className="detail-icon-btn btn-link" onClick={handleAddLink}>
                      <i className="ti ti-check"></i>
                    </button>
                    <button className="detail-icon-btn btn-delete" onClick={() => { setAddingLink(false); setNewLinkUrl('') }}>
                      <i className="ti ti-x"></i>
                    </button>
                  </div>
                ) : canAddLink && (
                  <button className="detail-add-btn" onClick={() => setAddingLink(true)}>
                    <i className="ti ti-plus"></i> 新增白板
                  </button>
                )}
              </div>
            </div>
          {saveError && <div className="detail-save-error">{saveError}</div>}
          </div>

          <div className="detail-divider-v"></div>

          {/* Right */}
          <div className="detail-col">
            <div className="detail-section-title">
              <i className="ti ti-calendar"></i> 上課紀錄
            </div>
            <div className="detail-record-row">
              <SessionCalendar logs={logs} schedule={student.schedule} onRetroLog={onRetroLog} />
              <div className="detail-log-list">
                {recentLogs.length === 0 ? (
                  <div className="no-log">尚無上課紀錄</div>
                ) : recentLogs.map(l => {
                  const computedCyclePos = cyclePosMap[l.session_number] ?? l.cyclePos
                  const isPay = computedCyclePos === 4
                  const isReceived = isPay && (l.session_number !== lastFourthSession || !!l.paymentReceivedAt)
                  const isConfirming = pendingDelete === l.session_number
                  return (
                    <div key={l.session_number} className={'detail-log-item' + (isConfirming ? ' confirming' : '')}>
                      <span className="log-num">{l.session_number}</span>
                      <span className="log-date">{formatDT(l.time)}</span>
                      {isConfirming ? (
                        <div className="log-delete-confirm">
                          <span className="log-delete-label">刪除？</span>
                          <button className="log-delete-yes" onClick={() => { onDeleteLog(l.session_number); setPendingDelete(null) }}>
                            <i className="ti ti-check"></i>
                          </button>
                          <button className="log-delete-no" onClick={() => setPendingDelete(null)}>
                            <i className="ti ti-x"></i>
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className={'log-badge ' + (isReceived ? 'badge-received' : isPay ? 'badge-pay' : 'badge-normal')}>
                            {'第 ' + computedCyclePos + ' 堂'}
                          </span>
                          {onDeleteLog && (
                            <button className="log-trash-btn" onClick={() => setPendingDelete(l.session_number)}>
                              <i className="ti ti-trash"></i>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              {meetLink && !editingMeet ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="detail-meet-btn" onClick={() => window.open(meetLink, '_blank')}>
                    <i className="ti ti-video"></i> Google Meet
                  </button>
                  <button className="detail-icon-btn btn-link" onClick={() => setEditingMeet(true)}>
                    <i className="ti ti-pencil"></i>
                  </button>
                </div>
              ) : (
                <div className="detail-gamma-item">
                  <input
                    className="detail-link-input"
                    type="url"
                    placeholder="貼上 Google Meet 連結..."
                    value={meetLink}
                    onChange={e => setMeetLink(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveMeetLink()}
                    autoFocus={editingMeet}
                  />
                  <button className="detail-icon-btn btn-link" onClick={saveMeetLink} disabled={savingMeet}>
                    <i className="ti ti-check"></i>
                  </button>
                  <button className="detail-icon-btn btn-delete" onClick={() => { setMeetLink(student.meet_link || ''); setEditingMeet(false) }}>
                    <i className="ti ti-x"></i>
                  </button>
                </div>
              )}
            </div>

            {onSendPaymentEmail && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="detail-email-btn" onClick={handleSendPaymentEmail} disabled={sendingEmail}>
                    <i className="ti ti-mail"></i>
                    {sendingEmail ? '寄送中...' : '寄送繳費通知'}
                  </button>
                </div>
                {emailMsg.text && (
                  <div style={{ marginTop: 6, fontSize: 12, color: emailMsg.ok ? 'rgba(100,220,130,0.85)' : 'rgba(255,120,120,0.85)' }}>
                    {emailMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
