import StudentCard from './StudentCard'

export default function CardsGrid({ students, logs, onRecord, recording, openCards, onToggle, onOpenDetail }) {
  return (
    <div className="cards-grid">
      {students.map(s => (
        <StudentCard
          key={s.student_id}
          student={s}
          logs={logs[s.student_id] || []}
          onRecord={onRecord}
          disabled={recording.has(s.student_id)}
          open={openCards.has(s.student_id)}
          onToggle={() => onToggle(s.student_id)}
          onOpenDetail={() => onOpenDetail(s.student_id)}
        />
      ))}
    </div>
  )
}
