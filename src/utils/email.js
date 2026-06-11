import templates from './email-templates.json'

function fill(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

export function buildFeeReceivedEmail(student) {
  const t = templates.paymentReceived
  const vars = { name: student.name }
  return {
    subject: fill(t.subject, vars),
    body: fill(t.body, vars),
  }
}

export function buildEmail(student, dates, total) {
  const isJapanese = student.course === '日文課'
  const t = isJapanese ? templates.paymentRequest.japanese : templates.paymentRequest.english

  const dateLines = isJapanese
    ? dates.map(d => `　・${d}`).join('\n')
    : dates.map(d => `  - ${d}`).join('\n')

  const vars = {
    name: student.name,
    price: Number(student.price).toLocaleString(),
    total: total.toLocaleString(),
    dateLines,
  }

  return {
    subject: fill(t.subject, vars),
    body: fill(t.body, vars),
  }
}
