import { useState, useEffect, useRef } from 'react'
import { THEMES, THEME_KEY, MODE_KEY, applyTheme } from '../utils/theme'

export function useThemeState() {
  const [theme, setTheme] = useState(() => {
    try { return THEMES.find(t => t.id === localStorage.getItem(THEME_KEY)) || THEMES[0] }
    catch { return THEMES[0] }
  })
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(MODE_KEY) === 'dark' ? 'dark' : 'light' }
    catch { return 'light' }
  })

  useEffect(() => { applyTheme(theme, mode) }, [theme, mode])

  function pickTheme(t) {
    setTheme(t)
    try { localStorage.setItem(THEME_KEY, t.id) } catch {}
  }
  function toggleMode() {
    setMode(m => {
      const n = m === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(MODE_KEY, n) } catch {}
      return n
    })
  }
  return { theme, mode, pickTheme, toggleMode }
}

function ModeToggle({ mode, onToggle }) {
  const isDark = mode === 'dark'
  return (
    <button className="mode-toggle" onClick={onToggle} title={isDark ? 'Switch to light' : 'Switch to dark'}>
      <span className="mode-toggle-track">
        <span className={'mode-toggle-knob ' + (isDark ? 'dark' : 'light')}>
          {isDark ? '☾' : '☀'}
        </span>
      </span>
      <span className="mode-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

function ThemePicker({ theme, mode, onPick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function renderSwatch(side) {
    return (
      <div className="theme-swatch">
        <span style={{ background: side.bg }}></span>
        <span style={{ background: side.g1 }}></span>
        <span style={{ background: side.accent }}></span>
      </div>
    )
  }

  return (
    <div className="theme-picker" ref={ref}>
      <button className="theme-trigger" onClick={() => setOpen(o => !o)} title="Theme">
        <span className="theme-trigger-dot" style={{ background: theme[mode].accent }}></span>
      </button>
      {open && (
        <div className="theme-panel">
          <div className="theme-panel-h">
            <span>Theme · {mode}</span>
            <span style={{ color: 'var(--grey-2)' }}>04</span>
          </div>
          <div className="theme-list">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={'theme-opt' + (theme.id === t.id ? ' active' : '')}
                onClick={() => { onPick(t); setOpen(false) }}
              >
                <div className="theme-opt-swatches">
                  {renderSwatch(t.light)}
                  {renderSwatch(t.dark)}
                </div>
                <div className="theme-opt-text">
                  <div className="theme-opt-name">{t.name}</div>
                  <div className="theme-opt-sub">{t.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TopBar({ onSync, syncing, theme, mode, onPickTheme, onToggleMode }) {
  const now = new Date()
  return (
    <div className="top-bar">
      <div className="brand">
        <div className="brand-mark">⌗</div>
        <div className="brand-name">
          {theme.name} · V2.0
          <strong>Tutoring Dashboard</strong>
        </div>
      </div>
      <div className="top-meta">
        <div className="top-meta-row">
          <span>{now.getFullYear()} EDITION</span>
          <span className="sep">/</span>
          <span>DM MONO</span>
          <span className="sep">/</span>
          <span>NT$ · TPE</span>
        </div>
      </div>
      <div className="top-actions">
        <button className="mbtn" onClick={onSync} disabled={syncing}>
          <span style={{ display: 'inline-block', transform: syncing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }}>↻</span>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
        <a href="http://localhost:5180" className="mbtn compact" style={{ textDecoration: 'none' }}>⇄ Classic</a>
        <ModeToggle mode={mode} onToggle={onToggleMode} />
        <ThemePicker theme={theme} mode={mode} onPick={onPickTheme} />
      </div>
    </div>
  )
}
