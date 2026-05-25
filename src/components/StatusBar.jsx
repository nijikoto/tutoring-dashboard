function pad2(n) { return String(n).padStart(2, '0') }

export default function StatusBar({ msg, type, count = 0, paidCount = 0, dueCount = 0 }) {
  return (
    <div className={'status-bar' + (type ? ' ' + type : '')}>
      <div>
        <span className="status-dot"></span>
        {msg}
      </div>
      <div style={{ display: 'flex', gap: '24px' }}>
        <span><span style={{ color: 'var(--grey-2)' }}>學生 </span>{pad2(count)}</span>
        <span><span style={{ color: 'var(--grey-2)' }}>本月已收 </span>{pad2(paidCount)}</span>
        <span><span style={{ color: 'var(--grey-2)' }}>待收 </span>{pad2(dueCount)}</span>
      </div>
    </div>
  )
}
