# Folder 1: Diagramy dla Ekspertow (Architekci Oprogramowania, SecOps / Bezpieczenstwo Sieci, Specjalisci Smart Grid)

Katalog zawiera techniczne diagramy architektoniczne, sieciowe i pomiarowe projektu:

1. **EXP-01: Architektura C4 & Zero-Trust Edge (Rust Scrubber + Go API + Python RAG + SHA-256)**
2. **EXP-02: Topologia Optyczna DWDM (< 5 ms) & Korytarz Smart Grid (Ustka 2.5 GW — Slupsk 400 kV — Trojmiasto)**
3. **EXP-03: Algorytm Walidacji Sygnalu AQI / dCi (Detekcja Flatline Faults & Korekta Higroskopijna RH > 85%)**
4. **EXP-04: Schemat Zasilania i Szyny Danych Biurka Anti-Gravity (1000W Stacjonarnie / 340Wh Off-Grid 13.7h)**

---

## EXP-01: Architektura C4 & Zero-Trust Edge

```mermaid
flowchart LR
  Client["Klient / Sygnalista (Zero-Cookie)"] -->|TLS 1.3 / Brak Logowania IP| RustEdge["Rust Edge Scrubber (Strip EXIF/XMP/OLE)"]
  RustEdge -->|Zanonimizowany Strumien| GoAPI["Go Microservices API (RODO Art. 25/32)"]
  GoAPI -->|Szyfrowanie Spoczynkowe| Vault["Magazyn Izolowany AES-256-GCM"]
  GoAPI -->|Walidacja Klauzul| PyRAG["Python NLP Guardrails (Zero Data Retention)"]
  PyRAG -->|BERTScore F1: 0.87 / CodeBLEU: 0.74| GoAPI
  GoAPI -->|Append-Only Hash| ShaLedger["Rejestr Audytowy SHA-256 Chain (NIS2)"]
```

---

## EXP-02: Topologia Optyczna DWDM (< 5 ms) & Korytarz Smart Grid 400 kV

```mermaid
flowchart TB
  Ustka["Wezel Ustka: Port / Baza O&M Offshore (PGE Baltica 2 & 3 - 2.5 GW)"] <-->|Swiatlowod DWDM 3.84 ms| Slupsk["Wezel Slupsk: GPZ Wierzbiecino 400 kV (Smart Grid Hub)"]
  Slupsk <-->|Swiatlowod DWDM 3.42 ms| Gdansk["Wezel Trojmiasto: Hotel Gdansk (Referencyjny SLA)"]
  Ustka -->|Telemetria PM2.5 + RH%| Validator["Silnik Walidacji Python dCi (Flatline & Higroskopia)"]
  Slupsk -->|Telemetria 400 kV + AQI| Validator
  Gdansk -->|Telemetria Miejska SLA| Validator
  Validator -->|Tunel WireGuard / Tailscale| NOC["Mission Control (MacBook Pro M1 / RTO < 2h)"]
```

---

## EXP-03: Algorytm Walidacji Sygnalu AQI / dCi

```mermaid
flowchart TD
  Input["Odczyt Surowy: PM2.5, RH%, Okno N Probek, Latencja DWDM"] --> VarCheck{"Wariancja probek sigma^2 < 0.0005?"}
  VarCheck -->|TAK: Zawieszenie ADC| Flatline["Status: REJECTED_FLATLINE (dCi = 0.18)"]
  VarCheck -->|NIE: Sygnal dynamiczny| RhCheck{"Wilgotnosc Wzgledna RH > 85%?"}
  RhCheck -->|TAK: Mgla morska| ApplyK["Korekta Higroskopijna: PM_corr = PM_raw * k"]
  RhCheck -->|NIE: RH <= 85%| NoK["Brak korekty: k = 1.000"]
  ApplyK --> LatencyCheck{"Latencja DWDM < 5.0 ms?"}
  NoK --> LatencyCheck
  LatencyCheck -->|TAK: 3.42 - 3.84 ms| ValidOut["Publikacja Rekordu: dCi 0.92 - 0.98 (PASS)"]
  LatencyCheck -->|NIE: >= 5.0 ms| AlertOut["Flaga: LATENCY_ALERT (Obnizenie dCi)"]
```

---

## EXP-04: Schemat Zasilania i Szyny Danych Biurka Anti-Gravity

```mermaid
flowchart LR
  Solar["Panel Solarny PV (22.5W -> 60W / 100W)"] -->|MPPT DC| Solix["Stacja Anker SOLIX C200 (192Wh LiFePO4) + 2x Powerbank (148Wh) = 340Wh"]
  Solix -->|USB-C PD 61W| M1["MacBook Pro M1 (Wezel Tailscale / Jump Desktop)"]
  Solix -->|USB-C PD 45W| Dual["Acer Dual 2x18.5 PD193QT (10-pkt Dotyk)"]
  Solix -->|USB-C PD 30W+22W| Tablets["iPad Pro M5 + MatePad 11.5 PaperMatte"]
  ACGrid["Zasilanie Stacjonarne ~1000W AC"] -->|Thunderbolt 5 / HDMI| BaseStation["MBP i9 (96W) + Acer i5 (90W) + Samsung 27 8K (240W) + Projektor 120 4K (250W)"]
```
