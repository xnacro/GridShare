import { DEMO_HOUSEHOLD_ID } from '../config/constants.js'

// In-memory marketplace: listings + settled trades, CLAUDE.MD §7.3/§10.
// The seller is always the demo household -- this is the server-side twin
// of the ownership fix already made client-side in Marketplace.jsx (a
// household can only ever sell its own surplus, never a neighbor's), now
// actually enforced rather than just hidden in the UI.
export class MarketStore {
  constructor({ households }) {
    this.households = households
    this._listingSeq = 0
    this._tradeSeq = 0
    this.reset()
  }

  reset() {
    this.listings = []
    this.trades = []
  }

  _findHousehold(id) {
    return this.households.find((h) => h.id === id)
  }

  listSurplus({ sellerId, kwh, priceRs }) {
    if (sellerId !== DEMO_HOUSEHOLD_ID) {
      const err = new Error('Only your own household can list its surplus for sale')
      err.status = 403
      throw err
    }
    if (!(typeof kwh === 'number' && kwh > 0)) {
      const err = new Error('kwh must be a positive number')
      err.status = 400
      throw err
    }
    if (!(typeof priceRs === 'number' && priceRs > 0)) {
      const err = new Error('priceRs must be a positive number')
      err.status = 400
      throw err
    }
    const seller = this._findHousehold(sellerId)
    if (!seller) {
      const err = new Error('Unknown seller household')
      err.status = 400
      throw err
    }
    const available = Math.max(seller.generationKw - seller.consumptionKw, 0)
    if (kwh > available + 1e-6) {
      const err = new Error(`${seller.label} only has ${available.toFixed(1)} kWh of surplus available right now`)
      err.status = 400
      throw err
    }

    this._listingSeq += 1
    const listing = {
      id: `listing-${this._listingSeq}`,
      sellerId,
      sellerLabel: seller.label,
      kwh,
      priceRs,
    }
    this.listings.unshift(listing)
    return listing
  }

  buyListing({ listingId, buyerId }) {
    const listing = this.listings.find((l) => l.id === listingId)
    if (!listing) {
      const err = new Error('Listing no longer available')
      err.status = 409
      throw err
    }
    if (buyerId === listing.sellerId) {
      const err = new Error('Cannot buy your own listing')
      err.status = 400
      throw err
    }
    const buyer = this._findHousehold(buyerId)
    if (!buyer) {
      const err = new Error('Unknown buyer household')
      err.status = 400
      throw err
    }

    this.listings = this.listings.filter((l) => l.id !== listingId)
    this._tradeSeq += 1
    const trade = {
      id: `trade-${this._tradeSeq}`,
      time: new Date().toISOString(),
      sellerLabel: listing.sellerLabel,
      buyerLabel: buyer.label,
      kwh: listing.kwh,
      priceRs: listing.priceRs,
    }
    this.trades.unshift(trade)
    return trade
  }

  getState() {
    return { listings: this.listings, trades: this.trades }
  }
}
