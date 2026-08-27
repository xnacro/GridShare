// Thin fetch wrapper for the marketplace mutations. Reads never go through
// here -- they arrive via the shared SSE connection in CommunityContext.jsx.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export function listSurplus({ sellerId, kwh, priceRs }) {
  return postJSON('/api/market/listings', { sellerId, kwh, priceRs })
}

export function buyListing({ listingId, buyerId }) {
  return postJSON('/api/market/trades', { listingId, buyerId })
}

export { API_BASE }
