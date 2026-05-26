import { NotebookPen } from 'lucide-react'
import ThemePicker from './ThemePicker'

export default function TopBar({ onSync, syncing }) {
  return (
    <div className="top-bar">
      <div className="brand">
        <div className="brand-icon"><NotebookPen size={14} /></div>
        Tutoring Dashboard
      </div>
      <div className="top-bar-actions">
        <button className="sync-btn" onClick={onSync} disabled={syncing}>
          <i className="ti ti-refresh"></i> 同步
        </button>
        <a href="http://localhost:5174" className="sync-btn" style={{ textDecoration: 'none' }}>⇄ Folder</a>
        <ThemePicker />
      </div>
    </div>
  )
}
