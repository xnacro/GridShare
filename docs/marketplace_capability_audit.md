# GridShare — P2P Marketplace Capability Audit

This document audits the P2P double-auction energy marketplace, order book mechanics, continuous matching algorithm, and financial settlement model.

---

## 1. What is Implemented vs. Simulated vs. Conceptual

| Component | Status | Reality |
|---|---|---|
| Order Book (Sell Offers / Buy Requests) | IMPLEMENTED | Backed by `market_offers` and `market_requests` database tables. Supports manual creation, cancellation, partial fills. |
| Double-Auction Matching Engine | IMPLEMENTED | Continuous double-auction algorithm sorting asks ASC and bids DESC, clearing at uniform midpoint price. |
| Automated Order Ingestion from Telemetry | IMPLEMENTED | `auto_sync_orders_from_telemetry()` automatically generates sell offers from prosumer surpluses and buy requests from consumer deficits. |
| Bilateral Energy Transactions | IMPLEMENTED | Logged in `energy_transactions` with immutable timestamp, seller, buyer, volume, price, and total INR value. |
| Optimization Audit Trail | IMPLEMENTED | Every market execution creates an explainable audit record in `optimization_decisions`. |
| Physical Power Routing / Substation Inverters | SIMULATED | The platform models virtual energy balances; no hardware switchgear or power electronics routing is controlled. |
| Real Financial / Bank / Wallet Payments | SIMULATED | All INR monetary figures represent simulated economic valuations (₹4.50/kWh P2P vs ₹6.10/kWh grid benchmark). No real banking API is integrated. |

---

## 2. Continuous Double-Auction Algorithm Details

1. **Ordering & Priority**:
   - **Seller Asks**: Sorted by `min_price_per_kwh ASC`, then FIFO by `created_at ASC` (cheapest solar sold first).
   - **Buyer Bids**: Sorted by `max_price_per_kwh DESC`, then FIFO by `created_at ASC` (highest paying consumer served first).
2. **Spread & Clearing Condition**:
   - Match executes if and only if `offer.min_price_per_kwh <= request.max_price_per_kwh`.
   - Matching terminates immediately upon ask-bid spread divergence.
3. **Execution Price**:
   - Clearing price is computed as the fair midpoint:
     $$P_{\text{clearing}} = \frac{P_{\text{min\_ask}} + P_{\text{max\_bid}}}{2}$$
   - Example: Ask @ ₹4.00/kWh, Bid @ ₹5.00/kWh → Clears @ ₹4.50/kWh.
   - Seller receives ₹4.50/kWh (better than ₹3.50 grid feed-in tariff).
   - Buyer pays ₹4.50/kWh (cheaper than ₹6.10 grid retail tariff).
   - Peer surplus split equally.
4. **Partial Fills**:
   - Trade volume is $\min(\text{offer.remaining\_kwh}, \text{request.remaining\_kwh})$.
   - Residual volume remains `PARTIALLY_FILLED` in the order book for the next matching iteration.

---

## 3. Marketplace Endpoints

- `GET /api/market/offers`: Fetch active/open sell orders.
- `POST /api/market/offers`: Place a new sell order.
- `DELETE /api/market/offers/<id>`: Cancel a sell order.
- `GET /api/market/requests`: Fetch active/open buy requests.
- `POST /api/market/requests`: Place a new buy request.
- `DELETE /api/market/requests/<id>`: Cancel a buy request.
- `POST /api/market/match`: Run double-auction matching engine.
- `GET /api/market/transactions`: Query executed bilateral transaction history.
