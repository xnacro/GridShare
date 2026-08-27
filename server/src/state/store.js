import { EventEmitter } from 'node:events'
import { SimulationEngine } from '../sim/engine.js'
import { MarketStore } from '../market/store.js'

// The single in-process source of truth: ties the simulation engine to the
// marketplace store and fans out updates to SSE subscribers. No database
// (see Phase L's plan notes: nothing here needs to survive a restart for a
// hackathon demo, and this keeps the whole thing self-contained).
class Store extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(50)
    this.engine = new SimulationEngine()
    this.market = new MarketStore({ households: this.engine.households })
    this.engine.clock.on('tick', () => this.emit('update', this.getSnapshot()))
  }

  start() {
    this.engine.start()
  }

  getSnapshot() {
    return {
      ...this.engine.getSnapshot(),
      market: this.market.getState(),
      simStatus: this.engine.clock.status,
    }
  }

  reset() {
    this.engine.reset()
    this.market.reset()
    this.emit('update', this.getSnapshot())
  }

  jumpToDemo() {
    this.engine.jumpToDemo()
    this.market.reset()
    this.emit('update', this.getSnapshot())
  }

  listSurplus(body) {
    const listing = this.market.listSurplus(body)
    this.emit('update', this.getSnapshot())
    return listing
  }

  buyListing(body) {
    const trade = this.market.buyListing(body)
    this.emit('update', this.getSnapshot())
    return trade
  }
}

export const store = new Store()
