import { useState, useEffect } from 'react'

export default function Toast({ msg }) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    if (msg) {
      setText(msg)
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [msg])

  return (
    <div className={'toast' + (visible ? ' show' : '')}>{text}</div>
  )
}
