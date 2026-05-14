import ThemePicker from './ThemePicker'

export default function TopBar({ onSync, syncing }) {
  return (
    <div className="top-bar">
      <div className="brand">
        <div className="brand-icon"><i className="ti ti-school"></i></div>
        TutorFee
      </div>
      <div className="top-bar-actions">
        <button className="sync-btn" onClick={onSync} disabled={syncing}>
          <i className="ti ti-refresh"></i> 同步
        </button>
        <ThemePicker />
      </div>
    </div>
  )
}
