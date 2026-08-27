import express from 'express'
import { cors } from './api/cors.js'
import { errorHandler } from './api/errorHandler.js'
import { communityRouter } from './api/routes/community.js'
import { marketRouter } from './api/routes/market.js'
import { simRouter } from './api/routes/sim.js'
import { streamRouter } from './api/routes/stream.js'

// Builds the Express app without binding a port, so tests (and anything
// else) can exercise it directly.
export function createApp() {
  const app = express()

  app.use(cors)
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.get('/', (req, res) => {
    res.send('GridShare API Server')
  })

  app.use('/api', communityRouter)
  app.use('/api', marketRouter)
  app.use('/api', simRouter)
  app.use('/api', streamRouter)

  app.use(errorHandler)

  return app
}
