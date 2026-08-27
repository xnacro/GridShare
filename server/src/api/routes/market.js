import { Router } from 'express'
import { store } from '../../state/store.js'

export const marketRouter = Router()

marketRouter.get('/market/listings', (req, res) => {
  res.json(store.market.getState().listings)
})

marketRouter.post('/market/listings', (req, res, next) => {
  try {
    const { sellerId, kwh, priceRs } = req.body ?? {}
    const listing = store.listSurplus({ sellerId, kwh, priceRs })
    res.status(201).json(listing)
  } catch (err) {
    next(err)
  }
})

marketRouter.get('/market/trades', (req, res) => {
  res.json(store.market.getState().trades)
})

marketRouter.post('/market/trades', (req, res, next) => {
  try {
    const { listingId, buyerId } = req.body ?? {}
    const trade = store.buyListing({ listingId, buyerId })
    res.status(201).json(trade)
  } catch (err) {
    next(err)
  }
})
