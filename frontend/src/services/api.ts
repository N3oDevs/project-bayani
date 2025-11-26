export async function predictImage(file: File) {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    throw new Error(`Predict failed: ${res.status}`)
  }

  return res.json()
}
