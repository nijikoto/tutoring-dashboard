export function buildEmail(student, dates, total) {
  const isJapanese = student.course === '日文課'

  if (isJapanese) {
    const dateLines = dates.map(d => `　・${d}`).join('\n')
    return {
      subject: `【授業料のお知らせ】${student.name}さん`,
      body:
`${student.name}さん、こんにちは！

今期の授業が4回完了しましたので、授業料のお知らせをお送りします。

【受講日】
${dateLines}

【授業料】
　単価：NT$${Number(student.price).toLocaleString()} × 4回
　合計：NT$${total.toLocaleString()}

お支払いの方法についてはご確認ください。
ご不明な点がございましたら、お気軽にご連絡ください。

どうぞよろしくお願いいたします。`,
    }
  }

  const dateLines = dates.map(d => `  - ${d}`).join('\n')
  return {
    subject: `[Tuition Payment] ${student.name}`,
    body:
`Hi ${student.name},

We have completed 4 lessons this cycle. Here is your tuition summary:

Lesson Dates:
${dateLines}

Tuition Fee:
  NT$${Number(student.price).toLocaleString()} × 4 lessons = NT$${total.toLocaleString()}

Please arrange the payment at your earliest convenience.
Feel free to reach out if you have any questions!

Best regards,`,
  }
}
