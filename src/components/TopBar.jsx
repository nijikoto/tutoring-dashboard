export default function TopBar({ onSync, syncing }) {
  return (
    <div className="top-bar">
      <div className="brand">
        <div className="brand-icon"><i className="ti ti-school"></i></div>
        TutorFee
      </div>
      <button className="sync-btn" onClick={onSync} disabled={syncing}>
        <i className="ti ti-refresh"></i> 同步
      </button>
    </div>
  )
}
