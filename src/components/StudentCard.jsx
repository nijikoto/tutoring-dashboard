import { formatDT, formatShort } from '../utils/date'

export default function StudentCard({ student, logs, onRecord, disabled, open, onToggle, onOpenDetail, onFeeReceived }) {

  const total = logs.length
  const sortedByDate = [...logs].sort((a, b) => new Date(a.time) - new Date(b.time))
  const cyclePosMap = Object.fromEntries(sortedByDate.map((l, i) => [l.session_number, (i % 4) + 1]))
  const lastLog = sortedByDate[sortedByDate.length - 1]
  const lastCyclePos = lastLog ? cyclePosMap[lastLog.session_number] : 0
  const isPayTime = total > 0 && lastCyclePos === 4

  const lastPayLog = [...sortedByDate].reverse().find(l => cyclePosMap[l.session_number] === 4)
  const feeReceived = !!(lastPayLog?.paymentReceivedAt)
  const showFeeSection = feeReceived ? isPayTime : !!lastPayLog

  const dotsFilled = isPayTime ? 4 : lastCyclePos
  const btnClass = 'start-btn'
  const btnText = (isPayTime && !feeReceived) ? '▶ 開始上課，寄送收費單' : '▶ 開始上課'

  const recentLogs = [...logs].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 4)

  return (
    <div className={'student-card' + (open ? ' card-open' : '')}>
      <div className="card-header" onClick={onToggle}>
        <div className="card-top">
          <div
            className="avatar"
            style={{ background: student.avatar_color, cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); onOpenDetail() }}
          >
            {student.initials}
          </div>
          <div className="student-info">
            <div className="student-name">{student.name}</div>
            <div className="course-name">{student.course}</div>
          </div>
          <i className="ti ti-chevron-down chevron"></i>
        </div>

        <div className="progress-row">
          <div className="dots">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={'dot' + (i <= dotsFilled ? ' filled' : '')}
              />
            ))}
          </div>
          <div className="count-label">共 {total} 堂</div>
        </div>

        <button
          className={btnClass}
          disabled={disabled}
          onClick={e => { e.stopPropagation(); onRecord(student.student_id) }}
        >
          {btnText}
        </button>

        {showFeeSection && (
          feeReceived ? (
            <div className="fee-received-status" onClick={e => e.stopPropagation()}>
              <i className="ti ti-circle-check"></i>
              <span>學費已收到</span>
              <span className="fee-timestamp">{formatShort(lastPayLog.paymentReceivedAt)}</span>
            </div>
          ) : (
            <button className="fee-btn" onClick={e => { e.stopPropagation(); onFeeReceived() }}>
              <i className="ti ti-cash"></i> 收到學費
            </button>
          )
        )}
      </div>

      <div className="accordion-body" style={{ maxHeight: open ? '500px' : '0' }}>
        <div className="accordion-inner">
          <div className="history-title">上課紀錄（最近4堂）</div>
          {logs.length === 0 ? (
            <div className="no-log">尚無上課紀錄</div>
          ) : (
            recentLogs.map(l => {
              const computedCyclePos = cyclePosMap[l.session_number] ?? l.cyclePos
              const isPay = computedCyclePos === 4
              return (
                <div key={l.session_number} className="log-item">
                  <span className="log-num">{l.session_number}</span>
                  <span className="log-date">{formatDT(l.time)}</span>
                  <span className="log-badge badge-normal">
                    {'第 ' + computedCyclePos + ' 堂'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
