# GridShare V2 — Design System & Visual Identity Specification

**Design Philosophy**: *Sustainable Energy + Premium Modern Software*  
GridShare avoids noisy "AI startup" tropes (neon glows, saturated gradients, purple cards everywhere) in favor of an elegant, calm, high-contrast, nature-grounded climate-tech aesthetic.

---

## 1. Color Palette & Token Hierarchy

```
CANVAS & SURFACES
┌──────────────────────────────────┬──────────────────────────────────┐
│ Canvas Warm Off-White: #F5F7F3   │ Soft Warm Alternate:   #EEF1EB   │
├──────────────────────────────────┼──────────────────────────────────┤
│ Pure Surface White:    #FFFFFF   │ Elevated Card Surface: #FBFCFA   │
└──────────────────────────────────┴──────────────────────────────────┘

TEXT HIERARCHY
┌──────────────────────────────────┬──────────────────────────────────┐
│ Deep Graphite (Primary):#15211B  │ Forest Ink (Brand Text):#17382B  │
├──────────────────────────────────┼──────────────────────────────────┤
│ Secondary Text:        #5E6A63   │ Muted Metadata:        #87918B   │
└──────────────────────────────────┴──────────────────────────────────┘

BORDERS & DIVIDERS
┌──────────────────────────────────┬──────────────────────────────────┐
│ Soft Subdued Border:   #DCE4DE   │ Strong Interactive:    #C7D2CB   │
└──────────────────────────────────┴──────────────────────────────────┘

SEMANTIC ENERGY TOKENS
┌──────────────────────────────────┬──────────────────────────────────┐
│ Deep Forest (Header/CTA):#12392B │ Forest Midtone:        #17513B   │
├──────────────────────────────────┼──────────────────────────────────┤
│ Emerald (Surplus/Trade):#209B67  │ Bright Energy Accent:  #41C98A   │
├──────────────────────────────────┼──────────────────────────────────┤
│ Soft Emerald Surface:  #E7F6EE   │ Solar Gold (Yield):    #E7AA31   │
├──────────────────────────────────┼──────────────────────────────────┤
│ Soft Solar Surface:    #FFF3D7   │ Battery Amber (Storage):#D79A27  │
├──────────────────────────────────┼──────────────────────────────────┤
│ Grid Utility Blue:     #397BD2   │ Soft Blue Surface:     #EAF2FC   │
├──────────────────────────────────┼──────────────────────────────────┤
│ Deficit Coral:         #D85D5D   │ Soft Coral Surface:    #FDECEC   │
├──────────────────────────────────┼──────────────────────────────────┤
│ Hornet AI Violet:      #7359C8   │ Soft AI Violet Surface:#F1EDFF   │
└──────────────────────────────────┴──────────────────────────────────┘
```

> **Strict Color Rule**: The interface is primarily **Warm Neutral (`#F5F7F3`) + White (`#FFFFFF`) + Deep Forest (`#12392B`)**. Vibrant semantic colors (Emerald, Solar Gold, AI Violet, Coral) are used strictly for status indicators, metrics, and energy flow conduits — never as garish full-card background fills.

---

## 2. Typography Scale & Hierarchy

All typography uses **`Inter`** (`font-sans`) for UI and clean monospace (`font-mono`) for numerical values, timestamps, and currency calculations.

| Role | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | 44px – 52px | 1.15 | Black / 900 | Hero greetings & community net headlines |
| **Page Title** | 30px – 34px | 1.2 | ExtraBold / 800 | Top of primary views (`/ai`, `/network`, `/marketplace`) |
| **Section Title** | 18px – 20px | 1.3 | Bold / 700 | Card & section headers |
| **Primary Value** | 28px – 36px | 1.1 | Black / 900 | Metric numbers (`6.8 kW`, `+4.7 kW`, `₹4.50`) |
| **Secondary Value**| 20px – 24px | 1.2 | Bold / 700 | Sub-metrics (`40% SOC`, `1.0 kWh`) |
| **Body Standard** | 15px – 16px | 1.5 | Regular / 400 & Medium / 500 | Explanations, cards, paragraphs |
| **Small / Helper** | 13px – 14px | 1.4 | Medium / 500 | Form labels, table cells, secondary stats |
| **Metadata / Unit**| 12px – 13px | 1.3 | SemiBold / 600 | Units, timestamps, model provenance |

---

## 3. Spacing Scale (Tokens)

GridShare enforces a 4px/8px incremental spacing scale:
- **`space-1`** (4px): Micro gaps between status dots and text.
- **`space-2`** (8px): Gaps between inline buttons, tags, badges.
- **`space-3`** (12px): Internal padding for compact cards and table cells.
- **`space-4`** (16px): Standard padding inside cards and modals.
- **`space-5`** (20px): Padding inside large feature surfaces.
- **`space-6`** (24px): Standard gap between grid columns and rows.
- **`space-8`** (32px): Major vertical section separation.
- **`space-12`** (48px): Page hero margin and layout gutters.

---

## 4. Border Radii & Elevation Shadows

### Border Radii
- **`rounded-pill`** (`9999px`): Centered floating navigation, filter chips, action pills.
- **`rounded-3xl`** (`24px`): Hero greeting banners, modal containers, 3D viewport shells.
- **`rounded-2xl`** (`18px`): Standard primary cards, decision panels, feature boxes.
- **`rounded-xl`** (`12px`): Sub-cards, buttons, input fields, dropdown select boxes.
- **`rounded-lg`** (`8px`): Badges, tooltips, segmented tab controls.

### Shadows
- **`shadow-subtle`**: `0 1px 2px 0 rgba(20, 32, 25, 0.03)`
- **`shadow-card`**: `0 1px 3px 0 rgba(20, 32, 25, 0.04), 0 1px 2px -1px rgba(20, 32, 25, 0.04)`
- **`shadow-elevated`**: `0 4px 12px -2px rgba(20, 32, 25, 0.06), 0 2px 6px -1px rgba(20, 32, 25, 0.03)`
- **`shadow-modal`**: `0 20px 25px -5px rgba(20, 32, 25, 0.08), 0 8px 10px -6px rgba(20, 32, 25, 0.04)`

---

## 5. Glassmorphism Guidelines (Restrained & Purposeful)

Glass surfaces are applied **sparingly** to floating navigation, status chips, and light overlays:
- **Background**: `rgba(255, 255, 255, 0.75)`
- **Backdrop Blur**: `blur(16px)`
- **Border**: `1px solid rgba(220, 228, 222, 0.65)`
- **Prohibited**: Never use dark neon translucent glass or high-contrast chromatic aberration.

---

## 6. Iconography System

GridShare uses **FontAwesome Solid Icons** (`@fortawesome/free-solid-svg-icons`) centralized in `client/src/icons/iconRegistry.js`:
- `faGaugeHigh` $\rightarrow$ Overview
- `faBolt` $\rightarrow$ Energy Network
- `faBrain` $\rightarrow$ Hornet AI
- `faStore` $\rightarrow$ Marketplace
- `faBatteryThreeQuarters` $\rightarrow$ Battery ESS
- `faHouse` $\rightarrow$ My Home
- `faReceipt` $\rightarrow$ Transactions
- `faChartLine` $\rightarrow$ Analytics
- `faWandMagicSparkles` $\rightarrow$ Scenarios
- `faMicrochip` $\rightarrow$ Devices
- `faServer` $\rightarrow$ System Health
- `faSun` $\rightarrow$ Solar Yield
- `faTowerBroadcast` $\rightarrow$ Utility Grid

---

## 7. Interaction States & Motion

- **Navigation Collapse**: Smooth 300ms cubic-bezier transition (`transition-all duration-300 ease-out`).
- **Energy Flow Conduits**: Smooth 3D particle motion at 60 FPS in Three.js without CPU re-renders.
- **Workflow State Transitions**: `RECOMMENDED` $\rightarrow$ `[ Review & Confirm ]` $\rightarrow$ `Confirm Dispatch` $\rightarrow$ `Action Approved` with subtle fade-in toast feedback.
