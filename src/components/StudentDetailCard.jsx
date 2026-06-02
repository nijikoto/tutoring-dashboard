import { useState, useEffect } from 'react'
import { formatDateOnly, formatDT } from '../utils/date'
import SessionCalendar from './SessionCalendar'

export default function StudentDetailCard({ student, logs, onClose, onSave, onRetroLog }) {
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
  const recentLogs = [...logs].slice(-8).reverse()
  const filledLinks = links.filter(Boolean)
  const canAddLink = filledLinks.length < 2

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
                  const isPay = l.isPay === true || l.isPay === 'true' || l.isPay === 'TRUE'
                  return (
                    <div key={l.session_number} className="detail-log-item">
                      <span className="log-num">{l.session_number}</span>
                      <span className="log-date">{formatDT(l.time)}</span>
                      <span className={'log-badge ' + (isPay ? 'badge-pay' : 'badge-normal')}>
                        {'第 ' + l.cyclePos + ' 堂'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {student.meet_link && (
              <button className="detail-meet-btn" style={{ marginTop: '16px' }} onClick={() => window.open(student.meet_link, '_blank')}>
                <i className="ti ti-video"></i> Google Meet
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
