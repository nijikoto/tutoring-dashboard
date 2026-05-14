export default function StatusBar({ msg, type }) {
  return (
    <div className={'status-bar' + (type ? ' ' + type : '')}>{msg}</div>
  )
}
