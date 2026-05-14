const API = 'https://script.google.com/macros/s/AKfycbw3JYFhA-1rsXTX814NpWhxF__4sirX6ECwmSqEdhJlBiWWo7npvCpGWUR_aGoA5c0tsg/exec'

export async function fetchData() {
  const res = await fetch(API + '?t=' + Date.now())
  const data = await res.json()
  if (!data.success) throw new Error(data.error)
  return data
}

export async function postLog(payload) {
  const res = await fetch(API, {
    method: 'POST',
    body: JSON.stringify({ action: 'addLog', ...payload }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error)
  return data
}

export async function postEmail(payload) {
  await fetch(API, {
    method: 'POST',
    body: JSON.stringify({ action: 'sendEmail', ...payload }),
  })
}
