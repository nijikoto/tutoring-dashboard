import { useState, useEffect } from 'react'

export default function Toast({ msg, kind = '' }) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [k, setK] = useState('')

  useEffect(() => {
    if (msg) { setText(msg); setK(kind); setVisible(true) }
    else setVisible(false)
  }, [msg, kind])

  return (
    <div className={'toast ' + (k === 'amber' ? 'amber ' : '') + (visible ? 'show' : '')}>
      <span className="mark">{k === 'amber' ? '$' : '✓'}</span>
      <span>{text}</span>
    </div>
  )
}
