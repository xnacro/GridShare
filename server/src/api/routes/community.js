import { Router } from 'express'
import { store } from '../../state/store.js'

export const communityRouter = Router()

communityRouter.get('/community', (req, res) => {
  res.json(store.getSnapshot())
})

communityRouter.get('/households/:id', (req, res) => {
  const snapshot = store.getSnapshot()
  const household = snapshot.households.find((h) => h.id === req.params.id)
  if (!household) {
    res.status(404).json({ error: 'Household not found' })
    return
  }
  res.json(household)
})
