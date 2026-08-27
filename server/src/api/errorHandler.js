// Central error middleware, CLAUDE.MD §21: a bad request or a store
// rejection (invalid trade, unknown household) must return a clean 4xx
// instead of a stack trace or a hung request.
export function errorHandler(err, req, res, next) {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500
  if (status >= 500) {
    console.error(err)
  }
  res.status(status).json({ error: err.message || 'Unexpected error' })
}
