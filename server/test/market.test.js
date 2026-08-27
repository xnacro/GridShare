import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { MarketStore } from '../src/market/store.js'
import { DEMO_HOUSEHOLD_ID } from '../src/config/constants.js'

function fixtureHouseholds() {
  return [
    { id: DEMO_HOUSEHOLD_ID, label: 'House 12', generationKw: 4.3, consumptionKw: 2.8 }, // surplus 1.5
    { id: 'house-07', label: 'House 07', generationKw: 6.8, consumptionKw: 2.1 }, // surplus 4.7
    { id: 'house-34', label: 'House 34', generationKw: 1.2, consumptionKw: 4.0 }, // deficit
  ]
}

describe('MarketStore ownership rule', () => {
  test('rejects a seller that is not the demo household', () => {
    const market = new MarketStore({ households: fixtureHouseholds() })
    assert.throws(
      () => market.listSurplus({ sellerId: 'house-07', kwh: 1, priceRs: 5 }),
      (err) => err.status === 403,
    )
  })

  test('accepts the demo household selling its own surplus', () => {
    const market = new MarketStore({ households: fixtureHouseholds() })
    const listing = market.listSurplus({ sellerId: DEMO_HOUSEHOLD_ID, kwh: 1, priceRs: 5 })
    assert.equal(listing.sellerId, DEMO_HOUSEHOLD_ID)
    assert.equal(market.listings.length, 1)
  })
})

describe('MarketStore quantity validation', () => {
  test('rejects non-positive kwh', () => {
    const market = new MarketStore({ households: fixtureHouseholds() })
    assert.throws(
      () => market.listSurplus({ sellerId: DEMO_HOUSEHOLD_ID, kwh: 0, priceRs: 5 }),
      (err) => err.status === 400,
    )
  })

  test('rejects non-positive priceRs', () => {
    const market = new MarketStore({ households: fixtureHouseholds() })
    assert.throws(
      () => market.listSurplus({ sellerId: DEMO_HOUSEHOLD_ID, kwh: 1, priceRs: -1 }),
      (err) => err.status === 400,
    )
  })

  test('rejects listing more than the seller currently has available', () => {
    const market = new MarketStore({ households: fixtureHouseholds() }) // house-12 surplus is 1.5
    assert.throws(
      () => market.listSurplus({ sellerId: DEMO_HOUSEHOLD_ID, kwh: 100, priceRs: 5 }),
      (err) => err.status === 400,
    )
  })
})

describe('MarketStore trades', () => {
  test('buying an unknown listing is rejected', () => {
    const market = new MarketStore({ households: fixtureHouseholds() })
    assert.throws(
      () => market.buyListing({ listingId: 'nope', buyerId: 'house-07' }),
      (err) => err.status === 409,
    )
  })

  test('a successful buy is atomic: listing removed, exactly one trade added', () => {
    const market = new MarketStore({ households: fixtureHouseholds() })
    const listing = market.listSurplus({ sellerId: DEMO_HOUSEHOLD_ID, kwh: 1, priceRs: 5 })
    const trade = market.buyListing({ listingId: listing.id, buyerId: 'house-34' })

    assert.equal(market.listings.length, 0)
    assert.equal(market.trades.length, 1)
    assert.equal(trade.sellerLabel, 'House 12')
    assert.equal(trade.buyerLabel, 'House 34')
    assert.equal(trade.kwh, 1)
  })

  test('buying your own listing is rejected', () => {
    const market = new MarketStore({ households: fixtureHouseholds() })
    const listing = market.listSurplus({ sellerId: DEMO_HOUSEHOLD_ID, kwh: 1, priceRs: 5 })
    assert.throws(
      () => market.buyListing({ listingId: listing.id, buyerId: DEMO_HOUSEHOLD_ID }),
      (err) => err.status === 400,
    )
  })
})
