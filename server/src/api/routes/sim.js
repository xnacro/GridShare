import { Router } from 'express'
import { store } from '../../state/store.js'

export const simRouter = Router()

const ACTIONS = new Set(['pause', 'resume', 'reset', 'setSpeed', 'jumpToDemo'])

simRouter.get('/sim/status', (req, res) => {
  res.json(store.engine.clock.status)
})

simRouter.post('/sim/control', (req, res, next) => {
  try {
    const { action, speed } = req.body ?? {}
    if (!ACTIONS.has(action)) {
      const err = new Error(`action must be one of ${[...ACTIONS].join(', ')}`)
      err.status = 400
      throw err
    }
    switch (action) {
      case 'pause':
        store.engine.pause()
        break
      case 'resume':
        store.engine.resume()
        break
      case 'reset':
        store.reset()
        break
      case 'jumpToDemo':
        store.jumpToDemo()
        break
      case 'setSpeed':
        store.engine.setSpeed(speed)
        break
    }
    res.json(store.engine.clock.status)
  } catch (err) {
    next(err)
  }
})
