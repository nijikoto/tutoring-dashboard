import { useState, useEffect } from 'react'
import { formatDateOnly, formatDT } from '../utils/date'
import SessionCalendar from './SessionCalendar'

function pad2(n) { return String(n).padStart(2, '0') }

export default function StudentDetailCard({ student, logs, onClose, onSave }) {
  const [editPage, setEditPage] = useState(student.textbook_page ?? '')
  const [links, setLinks] = useState([student.gamma_link_1 || '', student.gamma_link_2 || ''])
  const [addingLink, setAddingLink] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [savingPage, setSavingPage] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  const [savingMakeup, setSavingMakeup] = useState(false)
  const [makeupBump, setMakeupBump] = useState(0)
  const [saveError, setSaveError] = useState('')
  const [closing, setClosing] = useState(false)

  const makeupCount = Number(student.makeup_count) || 0
  const thisYear = new Date().getFullYear()
  const yearCount = logs.filter(l => new Date(l.time).getFullYear() === thisYear).length
  const recentLogs = [...logs].slice(-8).reverse()
  const filledLinks = links.filter(Boolean)
  const canAddLink = filledLinks.length < 2
  const cyclesDone = Math.floor(logs.length / 4)
  const isPayTime = logs.length > 0 && logs[logs.length - 1].cyclePos === 4

  function showSaveError(m) { setSaveError(m); setTimeout(() => setSaveError(''), 3000) }

  function handleClose() {
    setClosing(true)
    setTimeout(() => onClose(), 200)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  async function handleSavePage() {
    setSavingPage(true)
    try { await onSave({ textbook_page: editPage }) }
    catch { showSaveError('儲存失敗，請重試') }
    finally { setSavingPage(false) }
  }

  async function saveLinks(next) {
    setSavingLinks(true)
    try { await onSave({ gamma_link_1: next[0] || '', gamma_link_2: next[1] || '' }) }
    catch { showSaveError('連結儲存失敗，請重試') }
    finally { setSavingLinks(false) }
  }

  async function handleDeleteLink(i) {
    const next = links.map((l, idx) => idx === i ? '' : l)
    setLinks(next)
    await saveLinks(next)
  }

  async function handleMakeupDelta(delta) {
    const next = Math.max(0, makeupCount + delta)
    if (next === makeupCount) return
    setSavingMakeup(true)
    setMakeupBump(b => b + 1)
    try { await onSave({ makeup_count: next }) }
    catch { showSaveError('待補課儲存失敗，請重試') }
    finally { setSavingMakeup(false) }
  }

  async function handleAddLink() {
    if (!newLinkUrl.trim()) return
    const emptyIdx = links.findIndex(l => !l)
    const next = links.map((l, idx) => idx === emptyIdx ? newLinkUrl.trim() : l)
    setLinks(next)
    setNewLinkUrl('')
    setAddingLink(false)
    await saveLinks(next)
  }

  return (
    <div className={'detail-overlay' + (closing ? ' closing' : '')} onClick={handleClose}>
      <div className="detail-card" onClick={e => e.stopPropagation()}>

        <div className="detail-doc-head">
          <div className="detail-doc-left">
            <span className="id">FILE / {student.student_id.toUpperCase()}</span>
            <span>STUDENT RECORD</span>
            <span style={{ margin: '0 10px', color: 'var(--grey-2)' }}>/</span>
            <span>{logs.length} SESSIONS LOGGED</span>
          </div>
          <div className="detail-doc-right">
            {student.meet_link && (
              <button className="mbtn compact" onClick={() => window.open(student.meet_link, '_blank')}>
                ▶ Google Meet
              </button>
            )}
            <button className="mbtn compact" onClick={handleClose}>× Close · ESC</button>
          </div>
        </div>

        <div className="detail-hero">
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div className={'hero-mark' + (isPayTime ? ' amber' : '')}>{student.initials}</div>
            <div>
              <div className="detail-name">{student.name}</div>
              <div className="detail-sub">
                <span>{student.course}</span>
                <span className="sep">/</span>
                <span>{student.schedule || 'NO SCHEDULE'}</span>
                <span className="sep">/</span>
                <span>{student.email}</span>
              </div>
            </div>
          </div>
          <div className="detail-hero-meta">
            <div>OPENED · <strong>{formatDateOnly(student.start_date)}</strong></div>
            <div>RATE · <strong>NT${Number(student.price).toLocaleString()} / 堂</strong></div>
            <div>CYCLES DONE · <strong>{pad2(cyclesDone)}</strong></div>
            <div className={makeupCount > 0 ? 'hero-makeup amber' : 'hero-makeup'}>
              MAKEUPS · <strong>{pad2(makeupCount)}</strong>
            </div>
          </div>
        </div>

        <div className="detail-cols">
          <div>
            <div className="detail-section">
              <div className="detail-section-label">
                <span>01 — 基本資料 / Basic Info</span>
                <span className="detail-section-num">5 fields</span>
              </div>
              <div className="info-rows">
                <div className="info-row">
                  <span className="info-key">開始上課日</span>
                  <span className="info-val">{formatDateOnly(student.start_date)}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">累積堂數 · 今年</span>
                  <span className="info-val big">{pad2(yearCount)}<span className="unit">堂</span></span>
                </div>
                <div className="info-row">
                  <span className="info-key">累積堂數 · 總計</span>
                  <span className="info-val">{pad2(logs.length)} 堂 · {pad2(cyclesDone)} 週期</span>
                </div>
                <div className="info-row">
                  <span className="info-key">收費 · 單堂</span>
                  <span className="info-val">NT${Number(student.price).toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">收費 · 週期 (×4)</span>
                  <span className="info-val">NT${(Number(student.price) * 4).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="detail-section makeup-section">
              <div className="detail-section-label">
                <span>02 — 待補課 / Make-ups</span>
                <span className="detail-section-num">{makeupCount > 0 ? `${makeupCount} pending` : 'none'}</span>
              </div>
              <div className="makeup-row">
                <div className={'makeup-num' + (makeupCount > 0 ? ' has' : '')} key={makeupBump}>
                  <span className="makeup-fig">{pad2(makeupCount)}</span>
                  <span className="makeup-unit">堂<span className="makeup-unit-sub">待補</span></span>
                </div>
                <div className="makeup-actions">
                  <button className="mbtn compact" onClick={() => handleMakeupDelta(+1)} disabled={savingMakeup} title="學生請假 → 待補課 +1">
                    + 請假
                  </button>
                  <button className="mbtn compact" onClick={() => handleMakeupDelta(-1)} disabled={savingMakeup || makeupCount <= 0} title="完成補課 → 待補課 −1">
                    − 已補課
                  </button>
                </div>
              </div>
              <div className="makeup-hint">
                {makeupCount > 0
                  ? `有 ${makeupCount} 堂尚未補回 — 安排補課後按「已補課」`
                  : '學生請假時按「請假」累計，補課完成後按「已補課」核銷'}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">
                <span>03 — 課本進度 / Textbook</span>
                <span className="detail-section-num">Editable</span>
              </div>
              <div className="tb-row">
                <span className="tb-name">{student.textbook || '—'}</span>
              </div>
              <div className="tb-row" style={{ borderBottom: 'none' }}>
                <span className="tb-key">第</span>
                <input className="tb-input" type="number" min={1} value={editPage} onChange={e => setEditPage(e.target.value)} />
                <span className="tb-key">頁</span>
                <button className="mbtn compact" onClick={handleSavePage} disabled={savingPage} style={{ marginLeft: 'auto' }}>
                  {savingPage ? '儲存中…' : '⬇ 儲存'}
                </button>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">
                <span>04 — 白板連結 / Whiteboard</span>
                <span className="detail-section-num">{filledLinks.length} / 2</span>
              </div>
              <div className="gam-list">
                {links.map((link, i) => link ? (
                  <div key={i} className="gam-item">
                    <input
                      className="gam-input"
                      type="url"
                      value={link}
                      onChange={e => { const next = links.map((l, idx) => idx === i ? e.target.value : l); setLinks(next) }}
                      onBlur={e => { const next = links.map((l, idx) => idx === i ? e.target.value : l); saveLinks(next) }}
                      onKeyDown={e => { if (e.key === 'Enter') { const next = links.map((l, idx) => idx === i ? e.target.value : l); saveLinks(next); e.target.blur() } }}
                    />
                    <button className="mbtn icon compact" onClick={() => window.open(link, '_blank')} title="Open">↗</button>
                    <button className="mbtn icon compact" onClick={() => handleDeleteLink(i)} disabled={savingLinks} title="Delete">×</button>
                  </div>
                ) : null)}

                {addingLink ? (
                  <div className="gam-item">
                    <input className="gam-input" type="url" placeholder="貼上連結…" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLink()} autoFocus />
                    <button className="mbtn icon compact" onClick={handleAddLink} title="Add">✓</button>
                    <button className="mbtn icon compact" onClick={() => { setAddingLink(false); setNewLinkUrl('') }} title="Cancel">×</button>
                  </div>
                ) : canAddLink && (
                  <button className="add-link-btn" onClick={() => setAddingLink(true)}>
                    <span>+</span> 新增白板連結
                  </button>
                )}
              </div>
              {saveError && <div className="save-error">{saveError}</div>}
            </div>
          </div>

          <div className="detail-divider-v"></div>

          <div>
            <div className="detail-section">
              <div className="detail-section-label">
                <span>05 — 上課紀錄 / Sessions</span>
                <span className="detail-section-num">{pad2(logs.length)} total</span>
              </div>
              <div className="records-row">
                <SessionCalendar logs={logs} schedule={student.schedule} />
                <div className="detail-log-list">
                  {recentLogs.length === 0 ? (
                    <div className="no-log">尚無上課紀錄</div>
                  ) : recentLogs.map(l => {
                    const isPay = l.isPay === true || l.isPay === 'true' || l.isPay === 'TRUE'
                    return (
                      <div key={l.session_number} className="detail-log-row">
                        <span className="detail-log-idx">{pad2(l.session_number)}</span>
                        <span className="detail-log-date">{formatDT(l.time)}</span>
                        <span className={'log-badge ' + (isPay ? 'pay' : 'normal')}>第 {l.cyclePos} 堂</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">
                <span>06 — 排程 / Schedule</span>
              </div>
              <div className="info-rows">
                <div className="info-row">
                  <span className="info-key">每週時段</span>
                  <span className="info-val">{student.schedule || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Google Meet</span>
                  <span className="info-val" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, color: student.meet_link ? 'var(--fg)' : 'var(--grey-3)' }}>
                    {student.meet_link || '— 未設定 —'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Email</span>
                  <span className="info-val" style={{ fontSize: 11 }}>{student.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--grey-3)' }}>
          <span>END OF FILE / {student.student_id.toUpperCase()}</span>
          <span>ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  )
}
