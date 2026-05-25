import { formatDT, formatShort } from '../utils/date'

function pad2(n) { return String(n).padStart(2, '0') }

export default function StudentCard({ student, logs, onRecord, disabled, open, onToggle, onOpenDetail, onFeeReceived, index }) {
  const total = logs.length
  const lastCyclePos = total > 0 ? logs[total - 1].cyclePos : 0
  const isPayTime = total > 0 && lastCyclePos === 4

  const lastPayLog = [...logs].reverse().find(l => l.isPay === true || l.isPay === 'true' || l.isPay === 'TRUE')
  const feeReceived = !!(lastPayLog?.paymentReceivedAt)
  const showFeeSection = feeReceived ? isPayTime : !!lastPayLog

  const dotsFilled = isPayTime ? 4 : lastCyclePos
  const recentLogs = [...logs].slice(-4).reverse()

  return (
    <div className={'scard' + (open ? ' card-open' : '') + (isPayTime ? ' pay-time' : '')}>
      <button className="scard-tab" onClick={onOpenDetail} title="Open detail">
        <span className="scard-tab-idx">{pad2((index ?? 0) + 1)}</span>
        <span className="scard-tab-name">{student.name}</span>
      </button>

      <div className="scard-body">
        <div className="scard-head" onClick={onToggle}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-mute)', marginBottom: 4 }}>
              {student.course}
            </div>
            <div className="scard-course">{student.textbook || '—'}</div>
            <div style={{ marginTop: 6, fontSize: 9, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {student.schedule || '—'} · 第 {student.textbook_page || '—'} 頁
            </div>
          </div>
          <span className="scard-chevron">▾</span>
        </div>

        <div className="scard-progress">
          <div className="dots">
            {[1, 2, 3, 4].map(i => (
              <span key={i} className={'dot' + (isPayTime ? ' pay' : i <= dotsFilled ? ' filled' : '')} />
            ))}
          </div>
          <div className="scard-count">
            堂 <strong>{pad2(total)}</strong> · 週期 {pad2(Math.ceil(Math.max(total, 1) / 4))}
          </div>
        </div>

        <div className="scard-actions">
          <button
            className={'mbtn' + (isPayTime ? ' amber' : '')}
            disabled={disabled}
            onClick={e => { e.stopPropagation(); onRecord(student.student_id) }}
          >
            {disabled ? '記錄中…' : '▶ 開始上課'}
          </button>

          {showFeeSection && (
            feeReceived ? (
              <div className="fee-received" onClick={e => e.stopPropagation()}>
                <span className="check">✓</span>
                <span>學費已收到</span>
                <span className="ts">{formatShort(lastPayLog.paymentReceivedAt)}</span>
              </div>
            ) : (
              <button
                className="mbtn amber"
                onClick={e => { e.stopPropagation(); onFeeReceived() }}
              >
                ＄ 收到學費
              </button>
            )
          )}
        </div>

        <div className="acc-body">
          <div className="acc-inner">
            <div className="acc-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>上課紀錄 · 最近 4 堂</span>
              <span style={{ color: 'var(--text-quiet)' }}>{pad2(recentLogs.length)} / {pad2(total)}</span>
            </div>
            {logs.length === 0 ? (
              <div className="no-log">尚無上課紀錄</div>
            ) : recentLogs.map(l => {
              const isPay = l.isPay === true || l.isPay === 'true' || l.isPay === 'TRUE'
              return (
                <div key={l.session_number} className="log-row">
                  <span className="log-idx">{pad2(l.session_number)}</span>
                  <span className="log-date">{formatDT(l.time)}</span>
                  <span className={'log-badge ' + (isPay ? 'pay' : 'normal')}>第 {l.cyclePos} 堂</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
