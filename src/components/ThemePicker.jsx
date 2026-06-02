import { useState, useEffect, useRef } from 'react'

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function getContrastAccent(bgHex) {
  const [h, , l] = hexToHsl(bgHex)
  const accentH = (h + 210) % 360
  const accentL = l < 45 ? 72 : 28
  return hslToHex(accentH, 90, accentL)
}

const PRESETS = [
  { name: '海軍藍', bg: '#1e2d4a' },
  { name: '深墨綠', bg: '#0d3325' },
  { name: '深紫',   bg: '#2a1a4a' },
  { name: '深磚紅', bg: '#3d1515' },
  { name: '深橄欖', bg: '#2a2d10' },
  { name: '深靛',   bg: '#0f1a3d' },
  { name: '墨夜',   bg: '#141414' },
].map(p => ({ ...p, accent: getContrastAccent(p.bg) }))

const DEFAULT_THEME = PRESETS[0]
const STORAGE_KEY = 'tutoring-dashboard-theme'

function applyTheme(theme) {
  document.documentElement.style.setProperty('--bg', theme.bg)
  document.documentElement.style.setProperty('--accent', theme.accent)
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
    const accent = getContrastAccent(bg)
    selectTheme({ name: '自訂', bg, accent })
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
                style={{ background: p.bg, borderColor: p.accent }}
                onClick={() => selectTheme(p)}
                title={p.name}
              >
                <span className="swatch-accent" style={{ background: p.accent }} />
              </button>
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
