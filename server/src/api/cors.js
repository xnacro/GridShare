// Minimal hand-written CORS for local dev (client on a different Vite port
// than the API). Deliberately not the `cors` package -- see Phase L's plan
// notes: one header on one dev-only cross-origin case doesn't justify a new
// dependency.
export function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
}
