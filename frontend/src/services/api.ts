export async function predictImage(file: File) {
  const form = new FormData()
  form.append('file', file)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://c23df3c2d06a-7860.proxy.runpod.net'
  const res = await fetch(`${baseUrl}/predict`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    throw new Error(`Predict failed: ${res.status}`)
  }

  return res.json()
}
