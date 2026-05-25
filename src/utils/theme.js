export const THEMES = [
  {
    id: 'amber', name: 'Parchment × Amber', sub: 'Original — Print Editorial',
    light: { bg:'#f3f3ef', g0:'#ecece7', g1:'#d9dbd6', g2:'#bfc1bd', g3:'#8a8a85', g4:'#5e5e58',
             ink:'#111111', inkRGB:'17,17,17', border:'#c8c8c2', border2:'#b8b8b2',
             accent:'#f7c531', accentInk:'#111111', accentInkRGB:'17,17,17' },
    dark:  { bg:'#16140f', g0:'#1f1d18', g1:'#2c2924', g2:'#3a362e', g3:'#928c80', g4:'#b8b1a3',
             ink:'#f0ede4', inkRGB:'240,237,228', border:'#3d3a32', border2:'#4a463c',
             accent:'#f7c531', accentInk:'#111111', accentInkRGB:'17,17,17' },
  },
  {
    id: 'stone', name: 'Stone × Vermillion', sub: 'Industrial — Tokyo Metro',
    light: { bg:'#ebe7df', g0:'#e0dcd2', g1:'#d2cdc1', g2:'#b8b2a6', g3:'#827d72', g4:'#544f46',
             ink:'#100e0a', inkRGB:'16,14,10', border:'#b3ada1', border2:'#a39d92',
             accent:'#e2451c', accentInk:'#ffffff', accentInkRGB:'255,255,255' },
    dark:  { bg:'#14130f', g0:'#1d1c16', g1:'#2a2820', g2:'#3a3729', g3:'#8e887a', g4:'#b4ad9c',
             ink:'#ebe7df', inkRGB:'235,231,223', border:'#3d3a2d', border2:'#4a4737',
             accent:'#ff5a2a', accentInk:'#ffffff', accentInkRGB:'255,255,255' },
  },
  {
    id: 'moss', name: 'Linen × Pine', sub: 'Apothecary — Forest Calm',
    light: { bg:'#ebe9df', g0:'#e0ded3', g1:'#d1cfc2', g2:'#b6b4a4', g3:'#7d7e6c', g4:'#525345',
             ink:'#0e1108', inkRGB:'14,17,8', border:'#aeac9c', border2:'#9e9c8c',
             accent:'#2d6a3e', accentInk:'#ffffff', accentInkRGB:'255,255,255' },
    dark:  { bg:'#11130d', g0:'#1a1c15', g1:'#262a1f', g2:'#363a2c', g3:'#8e927e', g4:'#b3b69e',
             ink:'#e8e9dd', inkRGB:'232,233,221', border:'#393c2d', border2:'#494c3a',
             accent:'#5fb073', accentInk:'#0a160e', accentInkRGB:'10,22,14' },
  },
  {
    id: 'klein', name: 'Cream × Klein Blue', sub: 'Museum Plaque — MoMA',
    light: { bg:'#efeadd', g0:'#e6dfd0', g1:'#dcd3bf', g2:'#c4b9a0', g3:'#84796a', g4:'#574e42',
             ink:'#0d0c0a', inkRGB:'13,12,10', border:'#bdb29a', border2:'#ada288',
             accent:'#0042ff', accentInk:'#ffffff', accentInkRGB:'255,255,255' },
    dark:  { bg:'#0e0d09', g0:'#181610', g1:'#23201a', g2:'#332f25', g3:'#8e8676', g4:'#b3a994',
             ink:'#efeadd', inkRGB:'239,234,221', border:'#363225', border2:'#443f30',
             accent:'#5478ff', accentInk:'#ffffff', accentInkRGB:'255,255,255' },
  },
]

export const THEME_KEY = 'tutoring-dashboard-theme-pa'
export const MODE_KEY  = 'tutoring-dashboard-mode-pa'

export function applyTheme(theme, mode) {
  const r = document.documentElement
  const t = theme[mode] || theme.light
  r.style.setProperty('--bg',          t.bg)
  r.style.setProperty('--fg',          t.ink)
  r.style.setProperty('--ink-rgb',     t.inkRGB)
  r.style.setProperty('--grey-0',      t.g0)
  r.style.setProperty('--grey-1',      t.g1)
  r.style.setProperty('--grey-2',      t.g2)
  r.style.setProperty('--grey-3',      t.g3)
  r.style.setProperty('--grey-4',      t.g4)
  r.style.setProperty('--border',      t.border)
  r.style.setProperty('--border-2',    t.border2)
  r.style.setProperty('--amber',       t.accent)
  r.style.setProperty('--amber-ink',   t.accentInk)
  r.style.setProperty('--on-accent',   t.accentInk)
  r.style.setProperty('--on-accent-rgb', t.accentInkRGB)
  r.setAttribute('data-mode', mode)
  r.setAttribute('data-theme', theme.id)
}

// Bootstrap before React mounts to avoid flash
;(function bootstrapTheme() {
  try {
    const tid = localStorage.getItem(THEME_KEY) || 'amber'
    const m   = localStorage.getItem(MODE_KEY)  || 'light'
    const t   = THEMES.find(x => x.id === tid) || THEMES[0]
    applyTheme(t, m === 'dark' ? 'dark' : 'light')
  } catch {}
})()
