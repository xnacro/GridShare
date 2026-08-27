import { Router } from 'express'
import { store } from '../../state/store.js'

export const streamRouter = Router()

const PING_INTERVAL_MS = 15000

// Server-Sent Events: one-directional push of the full snapshot on every
// simulation tick. See Phase L's plan notes for why SSE over Socket.IO --
// this is a one-page dashboard needing server->client push, not
// bidirectional messaging, and EventSource needs no client library.
streamRouter.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.flushHeaders?.()

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  send('snapshot', store.getSnapshot())

  const onUpdate = (snapshot) => send('snapshot', snapshot)
  store.on('update', onUpdate)

  // Idle connections can be dropped by proxies/browsers after 30-60s with
  // no traffic; a comment ping is invisible to the client but keeps it alive.
  const pingTimer = setInterval(() => res.write(': ping\n\n'), PING_INTERVAL_MS)

  req.on('close', () => {
    clearInterval(pingTimer)
    store.off('update', onUpdate)
  })
})
