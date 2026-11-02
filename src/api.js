async function request(path, options) {
  let response
  try {
    response = await fetch(path, options)
  } catch {
    throw new Error('API 서버에 연결하지 못했습니다. npm run dev가 실행 중인지 확인하세요.')
  }
  if (response.status === 204) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? 'API 서버에 연결하지 못했습니다. npm run dev가 실행 중인지 확인하세요.')
  return body
}

export const fetchProducts = () => request('/api/products')

export const createProduct = (product) =>
  request('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  })

export const deleteProduct = (code) =>
  request(`/api/products/${encodeURIComponent(code)}`, { method: 'DELETE' })
