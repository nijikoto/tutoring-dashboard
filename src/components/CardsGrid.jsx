import { useState } from 'react'
import StudentCard from './StudentCard'

export default function CardsGrid({ students, logs, onRecord, recording, openCards, onToggle, onOpenDetail, onFeeReceived }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className={'cards-grid' + (hover ? ' has-hover' : '')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {students.map((s, i) => (
        <StudentCard
          key={s.student_id}
          student={s}
          logs={logs[s.student_id] || []}
          onRecord={onRecord}
          disabled={recording.has(s.student_id)}
          open={openCards.has(s.student_id)}
          onToggle={() => onToggle(s.student_id)}
          onOpenDetail={() => onOpenDetail(s.student_id)}
          onFeeReceived={() => onFeeReceived(s.student_id)}
          index={i}
        />
      ))}
    </div>
  )
}
