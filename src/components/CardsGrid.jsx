import StudentCard from './StudentCard'

export default function CardsGrid({ students, logs, onRecord, recording }) {
  return (
    <div className="cards-grid">
      {students.map(s => (
        <StudentCard
          key={s.student_id}
          student={s}
          logs={logs[s.student_id] || []}
          onRecord={onRecord}
          disabled={recording.has(s.student_id)}
        />
      ))}
    </div>
  )
}
