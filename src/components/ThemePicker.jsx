import { useState, useEffect, useRef } from 'react'

const PRESETS = [
  { name: '番茄紅', bg: '#ba4a43', accent: '#c7534b' },
  { name: '靛紫',   bg: '#4a4580', accent: '#7F77DD' },
  { name: '海藍',   bg: '#1a4a7a', accent: '#378ADD' },
  { name: '青綠',   bg: '#0d5e45', accent: '#1D9E75' },
  { name: '珊瑚橘', bg: '#8a3820', accent: '#D85A30' },
  { name: '玫瑰粉', bg: '#7a2e4a', accent: '#D4537E' },
  { name: '墨夜',   bg: '#2a2a2a', accent: '#888780' },
]

const DEFAULT_THEME = PRESETS[0]
const STORAGE_KEY = 'tutoring-dashboard-theme'

function applyTheme(theme) {
  document.documentElement.style.setProperty('--bg', theme.bg)
  document.documentElement.style.setProperty('--red', theme.accent)
  document.documentElement.style.setProperty('--btn-txt', theme.accent)
}

export default function ThemePicker() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const t = saved ? JSON.parse(saved) : DEFAULT_THEME
      applyTheme(t)
      return t
    } catch {
      return DEFAULT_THEME
    }
  })
  const containerRef = useRef(null)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function selectTheme(preset) {
    setTheme(preset)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preset))
  }

  function handleCustom(e) {
    const bg = e.target.value
    selectTheme({ name: '自訂', bg, accent: bg })
  }

  return (
    <div className="theme-picker" ref={containerRef}>
      <button className="theme-btn" onClick={() => setOpen(o => !o)} title="主題色">
        <i className="ti ti-palette"></i>
        <span className="theme-dot" style={{ background: theme.accent }}></span>
      </button>

      {open && (
        <div className="theme-panel">
          <div className="theme-panel-title">主題色</div>
          <div className="theme-swatches">
            {PRESETS.map(p => (
              <button
                key={p.name}
                className={'swatch' + (theme.bg === p.bg ? ' active' : '')}
                style={{ background: p.bg }}
                onClick={() => selectTheme(p)}
                title={p.name}
              />
            ))}
          </div>
          <div className="theme-custom-row">
            <span className="theme-panel-title" style={{ margin: 0 }}>自訂</span>
            <label className="custom-swatch" title="自訂顏色">
              <input type="color" value={theme.bg} onChange={handleCustom} />
              <span className="custom-plus">+</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
