import { formatDT } from '../utils/date'

export default function StudentCard({ student, logs, onRecord, disabled, open, onToggle }) {

  const total = logs.length
  const cyclePos = total % 4
  const isPayTime = total > 0 && cyclePos === 0

  const dotsFilled = isPayTime ? 4 : cyclePos
  const btnClass = 'start-btn' + (isPayTime ? ' pay-mode' : '')
  const btnText = isPayTime ? '💰 已收費，開始新週期' : '▶ 開始上課'

  const recentLogs = [...logs].slice(-4).reverse()

  return (
    <div className={'student-card' + (open ? ' card-open' : '')}>
      <div className="card-header" onClick={onToggle}>
        <div className="card-top">
          <div className="avatar" style={{ background: student.avatar_color }}>
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
                className={'dot' + (isPayTime ? ' pay-alert' : i <= dotsFilled ? ' filled' : '')}
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
      </div>

      <div className="accordion-body" style={{ maxHeight: open ? '500px' : '0' }}>
        <div className="accordion-inner">
          <div className="history-title">上課紀錄（最近4堂）</div>
          {logs.length === 0 ? (
            <div className="no-log">尚無上課紀錄</div>
          ) : (
            recentLogs.map(l => {
              const isPay = l.session_number % 4 === 0
              return (
                <div key={l.session_number} className="log-item">
                  <span className="log-num">{l.session_number}</span>
                  <span className="log-date">{formatDT(l.time)}</span>
                  <span className={'log-badge ' + (isPay ? 'badge-pay' : 'badge-normal')}>
                    {isPay ? '收費' : '第 ' + l.cyclePos + ' 堂'}
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
