# GridShare ML Solar Dataset Audit Report
**Dataset Source**: NLR NSRDB Meteosat IODC (Physical Solar Model v3)  
**Location**: Guwahati, Assam, India (Lat: 26.13, Lon: 91.74, Elev: 76.0m)  
**Time Horizon / Year**: 2019 (Full Annual Cycle)  
**Generated At**: 2026-08-28  
**Audit Verdict**: ✅ **VALIDATED & SUITABLE FOR SOLAR RESOURCE FORECASTING**  

---

## 1. Executive Summary & Raw File Characteristics

| Attribute | Value / Specification | Technical Notes |
| :--- | :--- | :--- |
| **File Name** | `meteosat_guwahati_2019.csv` | Official NSRDB Meteosat IODC export |
| **File Location** | `ml/data/raw/meteosat/meteosat_guwahati_2019.csv` | Preserved untouched raw file |
| **File Size** | `1.74 MB` (1,824,736 bytes) | CSV with 2-line station metadata header |
| **Total Observations** | `35,040` rows | 15-minute intervals over 365 days ($365 \times 96 = 35,040$) |
| **Columns** | `11` attributes | Calendar + Irradiance + Ambient Weather |
| **Temporal Span** | `2019-01-01 00:00:00` to `2019-12-31 23:45:00` | 100% complete 2019 annual coverage |
| **Measured Sampling Delta** | **15 minutes** (Strictly 100%) | Zero skipped time slots, zero duplicates |
| **Missing Values** | **0 NaN values (0.00%)** | Serially complete physical model synthesis |

---

## 2. Sensor Schema & Measurement Units

| Column Name | Physical Quantity | Standard Unit | Role in GridShare ML |
| :--- | :--- | :--- | :--- |
| `GHI` | **Global Horizontal Irradiance** | $\text{W/m}^2$ | **Primary Forecasting Target** (`target_15m_ghi`) |
| `DNI` | **Direct Normal Irradiance** | $\text{W/m}^2$ | Beam irradiance predictor |
| `DHI` | **Diffuse Horizontal Irradiance** | $\text{W/m}^2$ | Scattered solar radiation predictor |
| `Temperature` | **Dry Bulb Ambient Temperature** | $^\circ\text{C}$ | Module thermal efficiency predictor |
| `Relative Humidity` | **Atmospheric Relative Humidity** | $\%$ | Cloud / aerosol moisture proxy |
| `Wind Speed` | **Wind Speed at 10m** | $\text{m/s}$ | PV panel convective cooling predictor |

---

## 3. Solar Resource Distribution (`GHI`) & Day/Night Breakdown

Solar irradiance exhibits strict diurnal cycling with a high proportion of zero nighttime readings:

```
┌─────────────────────────────────────────────────────────────┐
│  Nighttime Observations (GHI = 0 W/m²):   18,040  (51.48%)  │
├─────────────────────────────────────────────────────────────┤
│  Daytime Active Solar (GHI > 0 W/m²):     17,000  (48.52%)  │
└─────────────────────────────────────────────────────────────┘
```

| Irradiance Metric | Full Dataset (All Hours) | Daytime Only ($GHI > 0$) | Technical Interpretation |
| :--- | :---: | :---: | :--- |
| **Minimum** | `0.0 W/m²` | `1.0 W/m²` | Sunset/sunrise threshold |
| **25th Percentile (P25)** | `0.0 W/m²` | `142.0 W/m²` | Low-angle morning/evening sun |
| **Median (P50)** | `0.0 W/m²` | `338.0 W/m²` | Typical daytime diffuse/direct mix |
| **Mean** | `178.82 W/m²` | **360.05 W/m²** | True diurnal productive irradiance |
| **75th Percentile (P75)** | `334.0 W/m²` | `645.0 W/m²` | High-irradiance midday sunlight |
| **95th Percentile (P95)** | `740.0 W/m²` | `915.0 W/m²` | Peak summer clear-sky solar noon |
| **Maximum** | `990.0 W/m²` | `990.0 W/m²` | Theoretical solar noon peak |
| **Standard Deviation** | `263.73 W/m²` | `273.47 W/m²` | Dynamic diurnal variability |

---

## 4. Physical Consistency & Environmental Boundary Checks

| Physical Check | Expected Valid Range | Observed Empirical Value | Status |
| :--- | :--- | :--- | :--- |
| **Negative GHI / DNI / DHI** | $\ge 0\,\text{W/m}^2$ | `0` negative values | ✅ **PASS** |
| **Extraterrestrial Upper Limit** | $< 1400\,\text{W/m}^2$ | Max observed: `990.0 W/m²` | ✅ **PASS** |
| **Ambient Temperature** | $-5^\circ\text{C}$ to $+50^\circ\text{C}$ | `8.8^\circ	ext{C}` to `37.8^\circ	ext{C}` (Guwahati sub-tropical) | ✅ **PASS** |
| **Relative Humidity** | $0\%$ to $100\%$ | `20.47\%` to `100.0\%` (Monsoon dynamics) | ✅ **PASS** |
| **Wind Speed** | $0\,\text{m/s}$ to $35\,\text{m/s}$ | `0.1\,\text{m/s}` to `2.3000000000000003\,\text{m/s}` | ✅ **PASS** |

---

## 5. Distinction: Solar Resource Forecasting vs PV Output Estimation

> [!IMPORTANT]
> - **Empirical Solar Resource**: This dataset measures physical atmospheric irradiance ($GHI$, $DNI$, $DHI$).
> - **Estimated PV Output**: Electrical generation from a specific rooftop array requires module parameters:
>   $$\text{Estimated PV (kW)} = \frac{GHI}{1000} \times \text{Capacity}_{\text{kWp}} \times \eta \times \text{LossFactor}$$
> - The core ML model (`solar_v1`) forecasts $GHI$ ($	ext{W/m}^2$). The prediction API applies a transparent, configurable conversion layer with explicit assumptions.
