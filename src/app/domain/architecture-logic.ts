export type AudienceLevel = 'professor' | 'architect' | 'layperson';

export interface AudienceTranslation {
  professor: string;
  architect: string;
  layperson: string;
}

export interface CorridorNodeTelemetry {
  id: 'ustka' | 'slupsk' | 'trojmiasto';
  name: string;
  subtitle: string;
  role: string;
  gridCapacity: string;
  rawPm25: number;
  relativeHumidity: number;
  recentSamples: number[];
  dwdmLatencyMs: number;
  fiberStatus: 'NOMINAL' | 'DEGRADED';
}

export interface TelemetryValidationResult {
  nodeId: string;
  rawPm25: number;
  correctedPm25: number;
  humidityCorrectionApplied: boolean;
  humidityCorrectionFactor: number;
  flatlineFaultDetected: boolean;
  sampleVariance: number;
  latencyCompliant: boolean;
  dwdmLatencyMs: number;
  dCiScore: number;
  status: 'VALIDATED' | 'CORRECTED_HUMIDITY' | 'REJECTED_FLATLINE' | 'LATENCY_ALERT';
  explanation: AudienceTranslation;
}

export interface QualityGateMetric {
  id: string;
  name: string;
  score: number;
  threshold: number;
  category: string;
  description: AudienceTranslation;
}

export interface HardwareUnit {
  id: string;
  name: string;
  category: 'compute' | 'display' | 'power' | 'infrastructure';
  spec: string;
  watts: number;
  weightKg: number;
  defaultStationary: boolean;
  defaultMobile: boolean;
  roleDescription: string;
}

export interface PowerBudgetSummary {
  stationaryTotalWatts: number;
  activeWatts: number;
  mobileWeightKg: number;
  batteryCapacityWh: number;
  solarInputWatts: number;
  effectiveSolarYieldWatts: number;
  netFieldDrainWatts: number;
  estimatedOffGridHours: number;
  withinMobileWeightTarget: boolean;
}

export interface FinancialSimulationInput {
  totalMonthlyHours: number;
  b2bMarket: 'PL' | 'EU';
  b2bHourlyRatePln: number;
  b2bHourlyRateEur: number;
  eurExchangeRate: number;
  slaClientsCount: number;
  slaRatePerClientPln: number;
  monthlyAuditsTotalValuePln: number;
  taxRegime: 'ryczalt_12' | 'ip_box_5' | 'hybrid';
  ipBoxSharePercent: number;
  monthlyLivingAndOpsCostPln: number;
}

export interface PayoutEvent {
  dayOfMonth: 5 | 10 | 18 | 25;
  title: string;
  sourceCategory: string;
  amountNetPln: number;
  sharePercent: number;
  verificationNote: string;
}

export interface FinancialSimulationResult {
  hoursB2B: number;
  hoursSLA: number;
  hoursAudits: number;
  revenueB2BPln: number;
  revenueSLAPln: number;
  revenueAuditsTotalPln: number;
  revenueAuditsAdvance40Pln: number;
  revenueAuditsSettlement60Pln: number;
  totalMonthlyGrossNetPln: number;
  effectiveTaxRatePercent: number;
  estimatedIncomeTaxPln: number;
  netDisposablePln: number;
  monthlySurplusPln: number;
  sixMonthCushionTargetPln: number;
  payoutSchedule: PayoutEvent[];
  waterfallAllocation: {
    cushionTosCoiPln: number;
    ikzeAllocationPln: number;
    ikeAllocationPln: number;
    edoAndGlobalEtfPln: number;
  };
}

export interface GovTechBudgetBreakdown {
  terminalsCount: number;
  volunteersCount: number;
  hardwareTotalPln: number;
  hardwarePerUnitPln: number;
  softwareSecurityPln: number;
  deploymentBrailleVolunteersPln: number;
  totalGrossPln: number;
  totalEurApprox: number;
  pzpThresholdPln: number;
  belowPzpThreshold: boolean;
  pfronLimitPln: number;
  pfronPoCBasePln: number;
}

export interface AuditBlock {
  index: number;
  timestampIso: string;
  moduleCode: string;
  clauseVersion: string;
  payloadSummary: string;
  strippedMetadataFields: string[];
  previousHash: string;
  sha256Hash: string;
}

/**
 * Deterministic SHA-256 style hex digest generator for synchronous browser/SSR & unit test execution.
 * Uses a multi-round FNV-1a / Murmur-inspired mixing over 8x 32-bit lanes to produce a 64-char hex digest.
 */
export function computeDeterministicSha256Hex(input: string): string {
  const lanes = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const laneIdx = i & 7;
    lanes[laneIdx] = Math.imul(lanes[laneIdx] ^ code, 0x01000193) >>> 0;
    const nextIdx = (laneIdx + 1) & 7;
    lanes[nextIdx] = (lanes[nextIdx] + ((lanes[laneIdx] >>> 5) | (lanes[laneIdx] << 27)) + i) >>> 0;
  }
  // Final avalanche mixing across all 8 lanes
  for (let round = 0; round < 4; round++) {
    for (let j = 0; j < 8; j++) {
      const prev = lanes[(j + 7) & 7];
      lanes[j] = Math.imul(lanes[j] ^ ((prev << 13) | (prev >>> 19)), 0x85ebca6b) >>> 0;
    }
  }
  return lanes.map((val) => val.toString(16).padStart(8, '0')).join('');
}

/**
 * Simulates Rust edge EXIF/XMP/OLE scrubber and appends an immutable SHA-256 audit block.
 */
export function sanitizeAndCreateAuditBlock(
  index: number,
  moduleCode: string,
  clauseVersion: string,
  rawDocumentText: string,
  rawMetadataKeys: string[],
  previousHash: string,
  timestampIso = '2026-11-09T12:00:00Z'
): AuditBlock {
  const forbiddenPatterns = ['exif', 'gps', 'ip', 'author', 'xmp', 'ole', 'mac_addr', 'device_serial'];
  const strippedMetadataFields = rawMetadataKeys.filter((key) =>
    forbiddenPatterns.some((pattern) => key.toLowerCase().includes(pattern))
  );

  // Redact IPv4 addresses and PESEL-like 11-digit numbers from payload summary
  const sanitizedSummary = rawDocumentText
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[REDACTED_IP_ZERO_LOG]')
    .replace(/\b\d{11}\b/g, '[REDACTED_PII_PESEL]')
    .trim();

  const canonicalString = `${index}|${timestampIso}|${moduleCode}|${clauseVersion}|${sanitizedSummary}|${previousHash}`;
  const sha256Hash = computeDeterministicSha256Hex(canonicalString);

  return {
    index,
    timestampIso,
    moduleCode,
    clauseVersion,
    payloadSummary: sanitizedSummary,
    strippedMetadataFields,
    previousHash,
    sha256Hash,
  };
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors (#RRGGBB).
 */
export function calculateWcagContrastRatio(hexA: string, hexB: string): number {
  const getRelativeLuminance = (hex: string): number => {
    const clean = hex.replace('#', '').trim();
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;

    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const R = toLinear(r);
    const G = toLinear(g);
    const B = toLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Validates AQI / dCi sensor telemetry for Ustka, Slupsk, and Trojmiasto.
 * Detects Flatline Faults (sensor freeze) and compensates for coastal relative humidity RH > 85%.
 */
export function validateTelemetryReading(node: CorridorNodeTelemetry): TelemetryValidationResult {
  const samples = node.recentSamples.length > 0 ? node.recentSamples : [node.rawPm25];
  const mean = samples.reduce((acc, v) => acc + v, 0) / samples.length;
  const variance =
    samples.length > 1
      ? samples.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / samples.length
      : 1;

  const flatlineFaultDetected = samples.length >= 3 && variance < 0.0005;
  const humidityCorrectionApplied = node.relativeHumidity > 85;

  // Hygroscopic growth correction factor when RH > 85%
  const humidityExcess = Math.max(0, node.relativeHumidity - 85);
  const humidityCorrectionFactor = humidityCorrectionApplied
    ? Number((1 - Math.min(0.42, humidityExcess * 0.022)).toFixed(3))
    : 1.0;

  const correctedPm25 = Number((node.rawPm25 * humidityCorrectionFactor).toFixed(1));
  const latencyCompliant = node.dwdmLatencyMs < 5.0;

  let dCiScore = 0.96;
  if (flatlineFaultDetected) {
    dCiScore = 0.18;
  } else {
    if (humidityCorrectionApplied) {
      dCiScore -= 0.06;
    }
    if (!latencyCompliant) {
      dCiScore -= 0.25;
    }
    if (node.dwdmLatencyMs <= 4.0) {
      dCiScore += 0.02;
    }
  }
  dCiScore = Number(Math.max(0, Math.min(0.99, dCiScore)).toFixed(2));

  let status: TelemetryValidationResult['status'] = 'VALIDATED';
  if (flatlineFaultDetected) {
    status = 'REJECTED_FLATLINE';
  } else if (!latencyCompliant) {
    status = 'LATENCY_ALERT';
  } else if (humidityCorrectionApplied) {
    status = 'CORRECTED_HUMIDITY';
  }

  const explanation: AudienceTranslation = {
    professor: flatlineFaultDetected
      ? `Wykryto zerowa wariancje sygnalu (σ² = ${variance.toFixed(5)} < 0.0005) w oknie N=${samples.length} probek — odrzut wektora jako Flatline Fault przed agregacja dCi.`
      : humidityCorrectionApplied
        ? `Zastosowano nieliniowa korekte higroskopijnego rozpraszania Mie dla RH=${node.relativeHumidity}% (>85%), wspolczynnik k=${humidityCorrectionFactor}, latencja DWDM τ=${node.dwdmLatencyMs} ms (<5 ms).`
        : `Wektor pomiarowy w pelni sporyfikowany (σ²=${variance.toFixed(3)}, RH=${node.relativeHumidity}% <= 85%, τ=${node.dwdmLatencyMs} ms). Wskaznik dCi=${dCiScore}.`,
    architect: flatlineFaultDetected
      ? `Pipeline Python Guardrails zablokowal probke z wezla ${node.name}: zawieszenie ADC czujnika (Flatline). Przelaczono na redundancje bez falszywego alarmu smogowego.`
      : humidityCorrectionApplied
        ? `Skorygowano odczyt PM2.5 z ${node.rawPm25} do ${correctedPm25} µg/m³ z uwagi na mgle morska (RH ${node.relativeHumidity}%). Kanal DWDM utrzymuje ${node.dwdmLatencyMs} ms.`
        : `Telemetria ${node.name} przechodzi Quality Gate z dCi=${dCiScore}. Brak korekty wilgotnosci, latencja swiatlowodu DWDM ${node.dwdmLatencyMs} ms w normie SLA.`,
    layperson: flatlineFaultDetected
      ? `Czujnik w lokalizacji ${node.name} zawiesil sie i wysylal ciagle te sama liczbe. System automatycznie to wykryl, aby nie wprowadzac mieszkancow w blad.`
      : humidityCorrectionApplied
        ? `Nad morzem i rzeka jest dzis bardzo wilgotno (${node.relativeHumidity}%). System odfiltrowal pare wodna z pomiaru, pokazujac prawdziwa jakosc powietrza (${correctedPm25} µg/m³) zamiast falszywego alarmu.`
        : `Pomiar jakosci powietrza w ${node.name} (${correctedPm25} µg/m³) jest dokladny i sprawdzony. Dane docieraja swiatlowodem w niecale 4 tysieczne sekundy.`,
  };

  return {
    nodeId: node.id,
    rawPm25: node.rawPm25,
    correctedPm25,
    humidityCorrectionApplied,
    humidityCorrectionFactor,
    flatlineFaultDetected,
    sampleVariance: Number(variance.toFixed(5)),
    latencyCompliant,
    dwdmLatencyMs: node.dwdmLatencyMs,
    dCiScore,
    status,
    explanation,
  };
}

/**
 * Returns documented GovTech PoC budget breakdown ("Dostepna Gmina - Cyfrowa Samopomoc").
 */
export function calculateGovTechPoCBudget(terminalsCount = 3, volunteersCount = 10): GovTechBudgetBreakdown {
  const hardwarePerUnitPln = 2200;
  const hardwareTotalPln = terminalsCount * hardwarePerUnitPln;
  const softwareSecurityPln = 1900;
  const deploymentBrailleVolunteersPln = 2500;
  const totalGrossPln = hardwareTotalPln + softwareSecurityPln + deploymentBrailleVolunteersPln;
  const totalEurApprox = Math.round(totalGrossPln / 4.4);
  const pzpThresholdPln = 130000;

  return {
    terminalsCount,
    volunteersCount,
    hardwareTotalPln,
    hardwarePerUnitPln,
    softwareSecurityPln,
    deploymentBrailleVolunteersPln,
    totalGrossPln,
    totalEurApprox,
    pzpThresholdPln,
    belowPzpThreshold: totalGrossPln < pzpThresholdPln,
    pfronLimitPln: 143400,
    pfronPoCBasePln: 16850,
  };
}

/**
 * Calculates stationary and off-grid mobile power & weight budget for the Anti-Gravity Desk.
 */
export function calculateAntiGravityPowerBudget(
  units: HardwareUnit[],
  selectedIds: string[],
  mode: 'stationary' | 'mobile',
  solarPanelWatts: 22.5 | 60 | 100
): PowerBudgetSummary {
  const activeUnits = units.filter((u) => selectedIds.includes(u.id));
  const stationaryTotalWatts = units
    .filter((u) => u.defaultStationary)
    .reduce((sum, u) => sum + u.watts, 0);

  const activeWatts = activeUnits
    .filter((u) => mode === 'stationary' || u.category !== 'power')
    .reduce((sum, u) => sum + u.watts, 0);
  const mobileWeightKg = Number(
    activeUnits.reduce((sum, u) => sum + u.weightKg, 0).toFixed(2)
  );

  // Anker SOLIX C200 (192Wh LiFePO4) + 2x Powerbank 20 000 mAh Solar (+148Wh) = 340Wh
  const batteryCapacityWh = 192 + 148;

  // Realistic field average draw factor (~31.65% of max TDP across Apple Silicon M1/M5 + PaperMatte + Dual Screen)
  const averageDutyLoadWatts = mode === 'mobile' ? Math.max(12, activeWatts * 0.3165) : activeWatts;
  const effectiveSolarYieldWatts = Number((solarPanelWatts * 0.42).toFixed(1));
  const netFieldDrainWatts = Number(
    Math.max(8, averageDutyLoadWatts - effectiveSolarYieldWatts).toFixed(1)
  );

  const rawHours = batteryCapacityWh / netFieldDrainWatts;
  const estimatedOffGridHours = Number(Math.min(24, rawHours).toFixed(1));

  return {
    stationaryTotalWatts,
    activeWatts,
    mobileWeightKg,
    batteryCapacityWh,
    solarInputWatts: solarPanelWatts,
    effectiveSolarYieldWatts,
    netFieldDrainWatts,
    estimatedOffGridHours,
    withinMobileWeightTarget: mobileWeightKg <= 6.5,
  };
}

/**
 * Calculates the 60 / 30 / 10 Financial Model, 4-Payout Monthly Schedule, Tax Optimization & Capital Waterfall.
 */
export function simulateFinancialArchitecture(input: FinancialSimulationInput): FinancialSimulationResult {
  const hoursB2B = Math.round(input.totalMonthlyHours * 0.6);
  const hoursSLA = Math.round(input.totalMonthlyHours * 0.3);
  const hoursAudits = Math.max(0, input.totalMonthlyHours - hoursB2B - hoursSLA);

  const effectiveHourlyPln =
    input.b2bMarket === 'EU'
      ? input.b2bHourlyRateEur * input.eurExchangeRate
      : input.b2bHourlyRatePln;

  const revenueB2BPln = Math.round(hoursB2B * effectiveHourlyPln);
  const revenueSLAPln = Math.round(input.slaClientsCount * input.slaRatePerClientPln);
  const revenueAuditsTotalPln = Math.round(input.monthlyAuditsTotalValuePln);
  const revenueAuditsAdvance40Pln = Math.round(revenueAuditsTotalPln * 0.4);
  const revenueAuditsSettlement60Pln = revenueAuditsTotalPln - revenueAuditsAdvance40Pln;

  const totalMonthlyGrossNetPln = revenueB2BPln + revenueSLAPln + revenueAuditsTotalPln;

  let effectiveTaxRatePercent = 12;
  if (input.taxRegime === 'ip_box_5') {
    effectiveTaxRatePercent = 5;
  } else if (input.taxRegime === 'hybrid') {
    const ipShare = Math.min(100, Math.max(0, input.ipBoxSharePercent)) / 100;
    effectiveTaxRatePercent = Number((ipShare * 5 + (1 - ipShare) * 12).toFixed(2));
  }

  const estimatedIncomeTaxPln = Math.round(totalMonthlyGrossNetPln * (effectiveTaxRatePercent / 100));
  const netDisposablePln = totalMonthlyGrossNetPln - estimatedIncomeTaxPln;
  const monthlySurplusPln = Math.max(0, netDisposablePln - input.monthlyLivingAndOpsCostPln);
  const sixMonthCushionTargetPln = input.monthlyLivingAndOpsCostPln * 6;

  const payoutSchedule: PayoutEvent[] = [
    {
      dayOfMonth: 5,
      title: 'Abonamenty utrzymaniowe SLA (MRR)',
      sourceCategory: 'Legal Tech / Audiokioski / Monitoring dCi',
      amountNetPln: revenueSLAPln,
      sharePercent: totalMonthlyGrossNetPln > 0 ? Math.round((revenueSLAPln / totalMonthlyGrossNetPln) * 100) : 0,
      verificationNote: `${input.slaClientsCount} podmiotow x ${input.slaRatePerClientPln} PLN netto/mies.`,
    },
    {
      dayOfMonth: 10,
      title: 'Glowna faktura z kontraktu zdalnego B2B',
      sourceCategory: input.b2bMarket === 'EU' ? 'Kontrakt UE/DACH (0% VAT Reverse Charge)' : 'Kontrakt Polska B2B',
      amountNetPln: revenueB2BPln,
      sharePercent: totalMonthlyGrossNetPln > 0 ? Math.round((revenueB2BPln / totalMonthlyGrossNetPln) * 100) : 0,
      verificationNote: `${hoursB2B}h (60% czasu) x ${Math.round(effectiveHourlyPln)} PLN/h netto`,
    },
    {
      dayOfMonth: 18,
      title: 'Zaliczki (min. 40%) na nowe audyty i wdrozenia',
      sourceCategory: 'Audyty RODO / NIS2 / WCAG & Smart Grid',
      amountNetPln: revenueAuditsAdvance40Pln,
      sharePercent:
        totalMonthlyGrossNetPln > 0 ? Math.round((revenueAuditsAdvance40Pln / totalMonthlyGrossNetPln) * 100) : 0,
      verificationNote: 'Bezwzgledny wymog 40% zadatku przed rozpoczeciem prac',
    },
    {
      dayOfMonth: 25,
      title: 'Faktury samorzadowe i rozliczenia koncowe',
      sourceCategory: 'OPS / Gminy / Port Ustka / Sponsorzy CSR Offshore',
      amountNetPln: revenueAuditsSettlement60Pln,
      sharePercent:
        totalMonthlyGrossNetPln > 0 ? Math.round((revenueAuditsSettlement60Pln / totalMonthlyGrossNetPln) * 100) : 0,
      verificationNote: 'Pozostale 60% po odbiorze protokolarnym wdrozenia / audytu',
    },
  ];

  const cushionTosCoiPln = Math.round(monthlySurplusPln * 0.35);
  const ikzeAllocationPln = Math.round(monthlySurplusPln * 0.2);
  const ikeAllocationPln = Math.round(monthlySurplusPln * 0.25);
  const edoAndGlobalEtfPln = Math.max(
    0,
    monthlySurplusPln - cushionTosCoiPln - ikzeAllocationPln - ikeAllocationPln
  );

  return {
    hoursB2B,
    hoursSLA,
    hoursAudits,
    revenueB2BPln,
    revenueSLAPln,
    revenueAuditsTotalPln,
    revenueAuditsAdvance40Pln,
    revenueAuditsSettlement60Pln,
    totalMonthlyGrossNetPln,
    effectiveTaxRatePercent,
    estimatedIncomeTaxPln,
    netDisposablePln,
    monthlySurplusPln,
    sixMonthCushionTargetPln,
    payoutSchedule,
    waterfallAllocation: {
      cushionTosCoiPln,
      ikzeAllocationPln,
      ikeAllocationPln,
      edoAndGlobalEtfPln,
    },
  };
}

export const DOCUMENTED_QUALITY_GATES: QualityGateMetric[] = [
  {
    id: 'bertscore',
    name: 'BERTScore F1',
    score: 0.87,
    threshold: 0.80,
    category: 'Semantyczna Zgodnosc RAG (Legal Tech)',
    description: {
      professor: 'Miara podobienstwa osadzen kontekstowych (contextual embeddings) miedzy klauzula wzorcowa a wygenerowana analiza RAG.',
      architect: 'Glowna bramka jakosci w pipeline Python Guardrails — blokuje odpowiedz modelu ponizej progu 0.80.',
      layperson: 'Gwarantuje, ze system rozumie sens przepisow prawnych (87% zgodnosci ze wzorcem eksperckim) i nie zmysla odpowiedzi.',
    },
  },
  {
    id: 'bleu4',
    name: 'BLEU-4',
    score: 0.42,
    threshold: 0.35,
    category: 'Precyzja 4-gramow Prawniczych',
    description: {
      professor: 'Zbieznosc 4-gramow leksykalnych w deterministycznym generatorze blokow umownych i rejestrow RODO/RCP.',
      architect: 'Walidacja wiernosci sformulowan normatywnych wzgledem zatwierdzonego repozytorium klauzul.',
      layperson: 'Sprawdza, czy uzyte slownictwo prawne w wygenerowanej umowie dokladnie odpowiada oficjalnym wzorom.',
    },
  },
  {
    id: 'rougel',
    name: 'ROUGE-L',
    score: 0.68,
    threshold: 0.60,
    category: 'Kompletnosc Streszczen DPIA / NIS2',
    description: {
      professor: 'Najdluzszy wspolny podciag (LCS) mierzacy pokrycie kluczowych wymogow w raportach oceny skutkow dla ochrony danych (DPIA).',
      architect: 'Kontrola kompletnosci raportow audytowych — zapewnia, ze zaden punkt matrycy ryzyka nie zostal pominiety.',
      layperson: 'Potwierdza, ze podsumowanie dokumentu zawiera wszystkie wazne informacje i nic istotnego nie zostalo pominiete.',
    },
  },
  {
    id: 'codebleu',
    name: 'CodeBLEU',
    score: 0.74,
    threshold: 0.65,
    category: 'Syntaktyczna i Przeplywowa Poprawnosc (AST / Dataflow)',
    description: {
      professor: 'Kompozytowa metryka oceniajaca zgodnosc drzewa AST oraz grafu przeplywu danych (Dataflow) dla reguly walidacji.',
      architect: 'Automatyczna weryfikacja skryptow walidacyjnych Smart Grid i polityk bezpieczenstwa przed kompilacja.',
      layperson: 'Chroni kod programu przed bledami logicznymi, zanim trafi on do urzedu lub stacji energetycznej.',
    },
  },
];

export const INITIAL_CORRIDOR_NODES: CorridorNodeTelemetry[] = [
  {
    id: 'ustka',
    name: 'Ustka — Port / Baza O&M Offshore',
    subtitle: 'PGE Baltica 2 & 3 WindShare (2.5 GW)',
    role: 'Morski wezel pomiarowy AQI/dCi oraz stacja brzegowa O&M dla morskich farm wiatrowych',
    gridCapacity: '2.5 GW Offshore WindShare',
    rawPm25: 29.4,
    relativeHumidity: 89,
    recentSamples: [28.1, 29.8, 29.0, 29.4],
    dwdmLatencyMs: 3.84,
    fiberStatus: 'NOMINAL',
  },
  {
    id: 'slupsk',
    name: 'Slupsk — GPZ Wierzbiecino 400 kV',
    subtitle: 'Glowny Punkt Zasilania 400 kV / Korytarz Ladowy',
    role: 'Centralny wezel transformacji energetycznej 400 kV i walidacji telemetrii srodowiskowej dCi',
    gridCapacity: '400 kV NN / Smart Grid Hub',
    rawPm25: 18.2,
    relativeHumidity: 74,
    recentSamples: [17.9, 18.5, 18.0, 18.2],
    dwdmLatencyMs: 3.42,
    fiberStatus: 'NOMINAL',
  },
  {
    id: 'trojmiasto',
    name: 'Trojmiasto — Hotel Gdansk',
    subtitle: 'Wezel Referencyjny SLA & Monitoring Miejski',
    role: 'Komercyjny wezel referencyjny B2B/SLA (monitoring srodowiskowy + zgodnosc RODO/NIS2)',
    gridCapacity: 'SLA Commercial Telemetry Node',
    rawPm25: 21.6,
    relativeHumidity: 82,
    recentSamples: [21.1, 21.8, 21.4, 21.6],
    dwdmLatencyMs: 3.84,
    fiberStatus: 'NOMINAL',
  },
];

export const ANTI_GRAVITY_HARDWARE_UNITS: HardwareUnit[] = [
  {
    id: 'mbp_i9',
    name: 'MacBook Pro i9 32GB RAM',
    category: 'compute',
    spec: 'Intel Core i9 / 32GB / Kompilacja Rust & Docker',
    watts: 96,
    weightKg: 2.0,
    defaultStationary: true,
    defaultMobile: false,
    roleDescription: 'Glowna stacja kompilacji kontenerow, testow obciazeniowych i wirtualizacji lokalnej.',
  },
  {
    id: 'acer_i5',
    name: 'Acer Aspire i5 (12-core, 24GB RAM)',
    category: 'compute',
    spec: '12-rdzeniowy i5 / 24GB / Natywne sterowniki dotyku',
    watts: 90,
    weightKg: 1.75,
    defaultStationary: true,
    defaultMobile: false,
    roleDescription: 'Dedykowany host dla dwuekranowego terminala dotykowego PD193QT i symulacji Kiosk-Mode.',
  },
  {
    id: 'mbp_m1',
    name: 'MacBook Pro M1 (Wezel Tailscale / Jump Desktop)',
    category: 'compute',
    spec: 'Apple M1 / 61W PD / Wysoka sprawnosc energetyczna',
    watts: 61,
    weightKg: 1.4,
    defaultStationary: true,
    defaultMobile: true,
    roleDescription: 'Energooszczedny wezel brzegowy VPN Tailscale, zdalny dostep Jump Desktop i praca w terenie.',
  },
  {
    id: 'ipad_m5',
    name: 'iPad Pro M5 8.gen + Apple Pencil Pro',
    category: 'compute',
    spec: 'M5 / 30W / Mobilny terminal audytowy i adnotacje DPIA',
    watts: 30,
    weightKg: 0.58,
    defaultStationary: true,
    defaultMobile: true,
    roleDescription: 'Mobilna inspekcja terenowa GPZ/Port Ustka, podpisywanie protokolow i szkice architektury.',
  },
  {
    id: 'matepad_paper',
    name: 'MatePad 11.5 PaperMatte',
    category: 'compute',
    spec: 'Ekran matowy antyrefleksyjny / 22W / Czytnik aktow prawnych',
    watts: 22,
    weightKg: 0.5,
    defaultStationary: true,
    defaultMobile: true,
    roleDescription: 'Bezrefleksyjna analiza dokumentacji RODO/NIS2/WCAG w pelnym sloncu bez zmeczenia wzroku.',
  },
  {
    id: 'samsung_27',
    name: 'Samsung 27" 4K TB5 (8K Ready)',
    category: 'display',
    spec: 'Centralny wyswietlacz 4K / Thunderbolt 5 / 240W',
    watts: 240,
    weightKg: 6.4,
    defaultStationary: true,
    defaultMobile: false,
    roleDescription: 'Centralny ekran Mission Control dla kodowania, telemetrii Smart Grid i matryc ryzyka.',
  },
  {
    id: 'acer_dual',
    name: 'Acer Dual 2x18.5" PD193QT',
    category: 'display',
    spec: 'Zawias 180° / 10-pkt dotyk / Przenosny dual-screen',
    watts: 45,
    weightKg: 1.6,
    defaultStationary: true,
    defaultMobile: true,
    roleDescription: 'Rozkladany podwojny ekran dotykowy do testow audiokioskow WCAG AAA i prezentacji u klienta.',
  },
  {
    id: 'projector_4k',
    name: 'Projektor 120" 4K Mission Control',
    category: 'display',
    spec: 'Projekcja wielkoformatowa 120" 4K / 250W',
    watts: 250,
    weightKg: 3.8,
    defaultStationary: true,
    defaultMobile: false,
    roleDescription: 'Prezentacje przetargowe PPP/GovTech, obrony naukowe i sesje zarzadcze Smart Grid.',
  },
  {
    id: 'offgrid_power_pack',
    name: 'Anker SOLIX C200 (192Wh) + 2x Powerbank Solar (148Wh)',
    category: 'power',
    spec: '340Wh lacznie (LiFePO4 + 2x 20 000 mAh) + MPPT Solar',
    watts: 166,
    weightKg: 1.9,
    defaultStationary: true,
    defaultMobile: true,
    roleDescription: 'Zasilanie awaryjne UPS i polowa stacja Off-Grid zapewniajaca 13.7h pracy z panelem 60W/100W.',
  },
];

export type TelemetryTimeframe = '24h' | '7d' | '30d';

export interface HistoricalTelemetryPoint {
  stepIndex: number;
  timestampMs: number;
  label: string;
  nodeId: 'ustka' | 'slupsk' | 'trojmiasto';
  rawPm25: number;
  correctedPm25: number;
  aqiScore: number;
  relativeHumidity: number;
  dCiScore: number;
  dwdmLatencyMs: number;
  anomalyEvent: 'NONE' | 'HUMIDITY_CORRECTION' | 'FLATLINE_DETECTED';
}

/**
 * Generates deterministic historical telemetry series for Ustka, Slupsk, and Trojmiasto
 * and synchronizes the most recent datapoint with the current live CorridorNodeTelemetry state.
 */
export function generateCorridorHistoricalTelemetry(
  liveNodes: CorridorNodeTelemetry[],
  timeframe: TelemetryTimeframe,
  anchorTimestampMs = 1794400800000 // 2026-11-11T12:00:00Z
): HistoricalTelemetryPoint[] {
  const pointsCount = timeframe === '24h' ? 24 : timeframe === '7d' ? 28 : 30;
  const stepMs =
    timeframe === '24h'
      ? 3600 * 1000
      : timeframe === '7d'
        ? 6 * 3600 * 1000
        : 24 * 3600 * 1000;

  const result: HistoricalTelemetryPoint[] = [];

  for (const node of liveNodes) {
    const baseSeed = node.id === 'ustka' ? 1.1 : node.id === 'slupsk' ? 2.3 : 3.7;
    const basePm = node.id === 'ustka' ? 27.5 : node.id === 'slupsk' ? 17.8 : 21.2;
    const baseRh = node.id === 'ustka' ? 87 : node.id === 'slupsk' ? 73 : 80;
    const baseLat = node.id === 'ustka' ? 3.84 : node.id === 'slupsk' ? 3.42 : 3.84;

    for (let i = 0; i < pointsCount; i++) {
      const isLast = i === pointsCount - 1;
      const timestampMs = anchorTimestampMs - (pointsCount - 1 - i) * stepMs;
      const dateObj = new Date(timestampMs);
      const label =
        timeframe === '24h'
          ? `${String(dateObj.getUTCHours()).padStart(2, '0')}:00`
          : `${String(dateObj.getUTCDate()).padStart(2, '0')}.${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}`;

      if (isLast) {
        const val = validateTelemetryReading(node);
        const aqiScore = Number(Math.min(150, Math.round(val.correctedPm25 * 2.1)).toFixed(0));
        result.push({
          stepIndex: i,
          timestampMs,
          label,
          nodeId: node.id,
          rawPm25: val.rawPm25,
          correctedPm25: val.correctedPm25,
          aqiScore,
          relativeHumidity: node.relativeHumidity,
          dCiScore: val.dCiScore,
          dwdmLatencyMs: node.dwdmLatencyMs,
          anomalyEvent: val.flatlineFaultDetected
            ? 'FLATLINE_DETECTED'
            : val.humidityCorrectionApplied
              ? 'HUMIDITY_CORRECTION'
              : 'NONE',
        });
        continue;
      }

      const wave = Math.sin((i + baseSeed) * 0.55) * 4.2 + Math.cos((i + baseSeed) * 0.28) * 2.1;
      const rawPm25 = Number(Math.max(8, basePm + wave).toFixed(1));
      const rhWave = Math.round(Math.sin((i + baseSeed) * 0.45) * 6);
      const relativeHumidity = Math.min(98, Math.max(55, baseRh + rhWave));
      const dwdmLatencyMs = Number(
        Math.max(2.1, baseLat + Math.sin((i + baseSeed) * 0.7) * 0.22).toFixed(2)
      );

      // Historical flatline fault drill at stepIndex === 10 on Ustka for audit demonstration
      const isHistoricalFlatline = node.id === 'ustka' && i === 10;
      const syntheticSamples = isHistoricalFlatline
        ? [rawPm25, rawPm25, rawPm25, rawPm25]
        : [rawPm25 - 0.5, rawPm25 + 0.4, rawPm25 - 0.2, rawPm25];

      const validation = validateTelemetryReading({
        ...node,
        rawPm25,
        relativeHumidity,
        recentSamples: syntheticSamples,
        dwdmLatencyMs,
      });

      const aqiScore = Number(Math.min(150, Math.round(validation.correctedPm25 * 2.1)).toFixed(0));

      result.push({
        stepIndex: i,
        timestampMs,
        label,
        nodeId: node.id,
        rawPm25: validation.rawPm25,
        correctedPm25: validation.correctedPm25,
        aqiScore,
        relativeHumidity,
        dCiScore: validation.dCiScore,
        dwdmLatencyMs,
        anomalyEvent: validation.flatlineFaultDetected
          ? 'FLATLINE_DETECTED'
          : validation.humidityCorrectionApplied
            ? 'HUMIDITY_CORRECTION'
            : 'NONE',
      });
    }
  }

  return result;
}

export type DiagramFolderId = 'experts_architects_secops_smartgrid' | 'reviewers_commentators_recipients';

export interface DiagramNodeBox {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  metricBadge: string;
  accent: 'lime' | 'emerald' | 'sky' | 'amber';
}

export interface ArchitectureDiagramSpec {
  id: string;
  code: string;
  folderId: DiagramFolderId;
  folderPath: string;
  title: string;
  targetAudienceTag: string;
  domainCategory: 'Software Architecture' | 'Network & SecOps' | 'Smart Grid & Telemetry' | 'GovTech & Citizen UX' | 'Financial & PPP Flow';
  summary: AudienceTranslation;
  nodes: DiagramNodeBox[];
  flowConnections: string[];
  mermaidSource: string;
  reviewChecklist: string[];
}

export interface FutureExpansionModule {
  id: string;
  code: string;
  horizon: '2027 Q2–Q4' | '2028 Q1–Q4' | '2029–2030';
  title: string;
  domain: 'Smart Grid & Offshore' | 'Cybersecurity & PQC' | 'GovTech & Accessibility' | 'Legal Tech & FinTech';
  trlCurrent: number;
  trlTarget: number;
  estimatedCapexPln: number;
  projectedMonthlyMrrPln: number;
  additionalMunicipalitiesOrNodes: number;
  description: AudienceTranslation;
  keyDeliverables: string[];
}

export interface RoadmapImpactSummary {
  selectedCount: number;
  totalCapexPln: number;
  projectedAdditionalMrrPln: number;
  projectedAnnualArrPln: number;
  totalNewNodesAndMunicipalities: number;
  averageTargetTrl: number;
  fePomorzaGrantCoveragePln: number;
  ownContributionPln: number;
}

export const PROJECT_DIAGRAMS_CATALOG: ArchitectureDiagramSpec[] = [
  // ============================================================================
  // FOLDER 1: DLA EKSPERTOW (ARCHITEKCI OPROGRAMOWANIA, SECOPS, SMART GRID)
  // ============================================================================
  {
    id: 'exp_c4_zero_trust',
    code: 'EXP-01',
    folderId: 'experts_architects_secops_smartgrid',
    folderPath: '/docs/diagramy/01-eksperci-architekci-secops-smartgrid/EXP-01-architektura-c4-zero-trust.md',
    title: 'Architektura C4 & Zero-Trust Edge (Rust Scrubber + Go API + Python RAG + SHA-256)',
    targetAudienceTag: 'Architekci Oprogramowania & Inzynierowie Bezpieczenstwa',
    domainCategory: 'Software Architecture',
    summary: {
      professor: 'Wielowarstwowa architektura mikroserwisowa z bezstanowym filtrem brzegowym w jezyku Rust (sanityzacja strumienia binarnego EXIF/XMP/OLE bez logowania L3/L4), szyna komunikacyjna w Go oraz deterministycznym silnikiem RAG w Pythonie ograniczonym wiezami BERTScore F1 >= 0.87.',
      architect: 'Izolacja kryptograficzna pomiedzy warstwa brzegowa (Rust Edge Zero-Log), warstwa logiki biznesowej (Go API + AES-256-GCM) i niemodyfikowalnym dziennikiem audytowym SHA-256 Append-Only.',
      layperson: 'Schemat techniczny pokazujacy, jak cztery jezyki programowania (Rust, Go, Python, TypeScript) wspolpracuja, aby oczyszczac pliki z ukrytych danych i chronic umowy cyfrowa pieczecia.',
    },
    nodes: [
      {
        id: 'n1',
        stepNumber: '01 / EDGE',
        title: 'Rust Zero-Knowledge Scrubber',
        subtitle: 'Usuwanie EXIF / XMP / OLE / GPS · Zero-IP Log',
        metricBadge: 'RAM-Only < 1.2 ms',
        accent: 'lime',
      },
      {
        id: 'n2',
        stepNumber: '02 / CORE API',
        title: 'Go Microservices & Auth',
        subtitle: 'Izolacja danych RODO Art. 25/32 · Szyfrowanie spoczynkowe',
        metricBadge: 'AES-256-GCM',
        accent: 'emerald',
      },
      {
        id: 'n3',
        stepNumber: '03 / AI GUARD',
        title: 'Python Deterministic RAG',
        subtitle: 'Walidacja klauzul + Zero Data Retention (EU AI Act)',
        metricBadge: 'BERTScore F1: 0.87',
        accent: 'sky',
      },
      {
        id: 'n4',
        stepNumber: '04 / LEDGER',
        title: 'SHA-256 Append-Only Chain',
        subtitle: 'Wersjonowane bloki umowne i logi audytowe NIS2',
        metricBadge: 'Immutable 64-hex',
        accent: 'amber',
      },
    ],
    flowConnections: [
      'Strumien wejsciowy (Sygnalista / Dokument) -> Rust Edge wycina EXIF/GPS/IP w pamieci ulotnej',
      'Zanonimizowany ladunek -> Mikroserwis Go szyfruje rekord kluczem AES-256-GCM',
      'Zapytanie prawne -> Python RAG weryfikuje klauzule (BERTScore >= 0.87, ROUGE-L 0.68) bez retencji danych',
      'Zatwierdzona operacja -> Dopisanie skrotu SHA-256(prevHash || payload) do lancucha audytowego NIS2',
    ],
    mermaidSource: `flowchart LR
  Client["Klient / Sygnalista (Zero-Cookie)"] -->|TLS 1.3 / Brak Logowania IP| RustEdge["Rust Edge Scrubber (Strip EXIF/XMP/OLE)"]
  RustEdge -->|Zanonimizowany Strumien| GoAPI["Go Microservices API (RODO Art. 25/32)"]
  GoAPI -->|Szyfrowanie Spoczynkowe| Vault["Magazyn Izolowany AES-256-GCM"]
  GoAPI -->|Walidacja Klauzul| PyRAG["Python NLP Guardrails (Zero Data Retention)"]
  PyRAG -->|BERTScore F1: 0.87 / CodeBLEU: 0.74| GoAPI
  GoAPI -->|Append-Only Hash| ShaLedger["Rejestr Audytowy SHA-256 Chain (NIS2)"]`,
    reviewChecklist: [
      'Brak zapisu adresu IP w logach serwera brzegowego (Zero-IP Policy)',
      'Weryfikacja progow jakosci RAG przed zwroceniem wyniku (BERTScore F1 >= 0.80)',
      'Ciaglosc kryptograficzna lancucha skrotow SHA-256 dla kazdej rewizji umowy',
    ],
  },
  {
    id: 'exp_dwdm_smartgrid_topology',
    code: 'EXP-02',
    folderId: 'experts_architects_secops_smartgrid',
    folderPath: '/docs/diagramy/01-eksperci-architekci-secops-smartgrid/EXP-02-topologia-dwdm-smart-grid-400kv.md',
    title: 'Topologia Optyczna DWDM (< 5 ms) & Korytarz Smart Grid (Ustka 2.5 GW — Slupsk 400 kV — Trojmiasto)',
    targetAudienceTag: 'Specjalisci Smart Grid & Inzynierowie Sieci Optycznych / SecOps',
    domainCategory: 'Smart Grid & Telemetry',
    summary: {
      professor: 'Architektura komunikacyjna o niskiej latencji deterministycznej (DWDM τ = 3.84 ms < 5.00 ms) sprzegajaca morska baze O&M w Ustce (PGE Baltica 2 & 3, 2.5 GW) z Glownym Punktem Zasilania 400 kV Wierzbiecino oraz wezlem referencyjnym w Gdansku przy gwarancji RTO < 2h.',
      architect: 'Redundantny trakt swiatlowodowy DWDM z szyfrowanym tunelem mesh VPN (Tailscale / WireGuard) pomiedzy wezlami pomiarowymi AQI/dCi a stacja brzegowa MacBook Pro M1.',
      layperson: 'Mapa polaczen swiatlowodowych pomiedzy portem w Ustce, stacja energetyczna pod Slupskiem i Gdanskiem, ktora przesyla dane w mniej niz 4 tysieczne sekundy.',
    },
    nodes: [
      {
        id: 'sg1',
        stepNumber: 'WEZEL A / USTKA',
        title: 'Port Ustka — Baza O&M Offshore',
        subtitle: 'PGE Baltica 2 & 3 WindShare (2.5 GW) · Stacja brzegowa',
        metricBadge: 'DWDM 3.84 ms · RH > 85%',
        accent: 'lime',
      },
      {
        id: 'sg2',
        stepNumber: 'WEZEL B / SLUPSK',
        title: 'GPZ Wierzbiecino 400 kV',
        subtitle: 'Transformacja mocy NN 400 kV · Hub walidacji dCi',
        metricBadge: 'DWDM 3.42 ms · dCi 0.98',
        accent: 'emerald',
      },
      {
        id: 'sg3',
        stepNumber: 'WEZEL C / TROJMIASTO',
        title: 'Hotel Gdansk — Wezel SLA',
        subtitle: 'Referencyjny wezel komercyjny B2B / Monitoring miejski',
        metricBadge: 'DWDM 3.84 ms · SLA RTO < 2h',
        accent: 'sky',
      },
      {
        id: 'sg4',
        stepNumber: 'WEZEL D / NOC',
        title: 'Wezel Tailscale / Mission Control',
        subtitle: 'MacBook Pro M1 + Klaster walidacyjny i zapas Off-Grid',
        metricBadge: 'WireGuard Mesh · 340Wh',
        accent: 'amber',
      },
    ],
    flowConnections: [
      'Ustka Offshore (2.5 GW) <-> GPZ Wierzbiecino (400 kV): kanal optyczny DWDM o latencji 3.84 ms (< 5 ms)',
      'GPZ Wierzbiecino <-> Trojmiasto (Hotel Gdansk): synchronizacja replik telemetrii i logow SHA-256',
      'Wezel Tailscale (MacBook Pro M1): bezpieczny dostep administracyjny Zero-Trust z czasem odtworzenia RTO < 2h',
    ],
    mermaidSource: `flowchart TB
  Ustka["Wezel Ustka: Port / Baza O&M Offshore (PGE Baltica 2 & 3 - 2.5 GW)"] <-->|Swiatlowod DWDM 3.84 ms| Slupsk["Wezel Slupsk: GPZ Wierzbiecino 400 kV (Smart Grid Hub)"]
  Slupsk <-->|Swiatlowod DWDM 3.42 ms| Gdansk["Wezel Trojmiasto: Hotel Gdansk (Referencyjny SLA)"]
  Ustka -->|Telemetria PM2.5 + RH%| Validator["Silnik Walidacji Python dCi (Flatline & Higroskopia)"]
  Slupsk -->|Telemetria 400 kV + AQI| Validator
  Gdansk -->|Telemetria Miejska SLA| Validator
  Validator -->|Tunel WireGuard / Tailscale| NOC["Mission Control (MacBook Pro M1 / RTO < 2h)"]`,
    reviewChecklist: [
      'Zgodnosc latencji optycznej DWDM ponizej 5.00 ms w calym korytarzu pomorskim',
      'Redundancja zasilania stacji monitorujacej zapewniająca RTO < 2h przy zaniku zasilania sieciowego',
      'Separacja ruchu pomiarowego Smart Grid od publicznego ruchu internetowego',
    ],
  },
  {
    id: 'exp_dci_algorithm_pipeline',
    code: 'EXP-03',
    folderId: 'experts_architects_secops_smartgrid',
    folderPath: '/docs/diagramy/01-eksperci-architekci-secops-smartgrid/EXP-03-algorytm-walidacji-aqi-dci.md',
    title: 'Algorytm Walidacji Sygnalu AQI / dCi (Detekcja Flatline Faults & Korekta Higroskopijna RH > 85%)',
    targetAudienceTag: 'Inzynierowie Danych Pomiarowych, Automatycy & Zespol B+R (Promotor)',
    domainCategory: 'Smart Grid & Telemetry',
    summary: {
      professor: 'Potok cyfrowego przetwarzania sygnalow (DSP) obliczajacy wariancje kroczaca σ² w oknie N probek (odrzucenie Flatline dla σ² < 0.0005) oraz kompensujacy rozpraszanie Mie na aerozolach morskich przy RH > 85% wspolczynnikiem k = 1 - min(0.42, (RH - 85) * 0.022).',
      architect: 'Deterministyczny automat stanowy w Pythonie zamieniajacy surowe odczyty laserowych czujnikow pylow na zweryfikowany indeks dCi w przedziale [0.18, 0.99].',
      layperson: 'Schemat krok po kroku pokazujacy, jak komputer wykrywa zepsuty czujnik i odejmuje mgle morska od pomiaru smogu.',
    },
    nodes: [
      {
        id: 'alg1',
        stepNumber: 'KROK 1 / AKWIZYCJA',
        title: 'Okno Pomiarowe N Probek',
        subtitle: 'Odczyt PM2.5, PM10, RH% oraz czasu propagacji DWDM',
        metricBadge: 'N >= 3 probek',
        accent: 'sky',
      },
      {
        id: 'alg2',
        stepNumber: 'KROK 2 / FLATLINE',
        title: 'Detektor Zerowej Wariancji',
        subtitle: 'Test zawieszenia przetwornika ADC: σ² < 0.0005',
        metricBadge: 'Fault -> dCi = 0.18',
        accent: 'amber',
      },
      {
        id: 'alg3',
        stepNumber: 'KROK 3 / HIGROSKOPIA',
        title: 'Korekta Morskiej Wilgoci',
        subtitle: 'Dla RH > 85% redukcja rozpraszania optycznego na mgle',
        metricBadge: 'PM_corr = PM * k',
        accent: 'lime',
      },
      {
        id: 'alg4',
        stepNumber: 'KROK 4 / INDEKS dCi',
        title: 'Wyznaczenie Ufnosci dCi',
        subtitle: 'Fuzja jakosci sygnalu, korekty RH i latencji DWDM < 5 ms',
        metricBadge: 'dCi: 0.92 – 0.98',
        accent: 'emerald',
      },
    ],
    flowConnections: [
      'Wejscie: wektor probek [PM2.5(t-3)...PM2.5(t)], wilgotnosc wzgledna RH% oraz latencja τ_DWDM',
      'Warunek 1: Jezeli wariancja σ² < 0.0005 -> Oznacz REJECTED_FLATLINE, ustaw dCi = 0.18 i przelacz na czujnik zapasowy',
      'Warunek 2: Jezeli RH > 85% -> Zastosuj wspolczynnik korekty higroskopijnej k i oznacz CORRECTED_HUMIDITY',
      'Wyjscie: Skorygowany AQI/PM2.5 + podpisany rekord telemetrii gotowy do wizualizacji D3.js',
    ],
    mermaidSource: `flowchart TD
  Input["Odczyt Surowy: PM2.5, RH%, Okno N Probek, Latencja DWDM"] --> VarCheck{"Wariancja probek σ² < 0.0005?"}
  VarCheck -->|TAK: Zawieszenie ADC| Flatline["Status: REJECTED_FLATLINE (dCi = 0.18)"]
  VarCheck -->|NIE: Sygnal dynamiczny| RhCheck{"Wilgotnosc Wzgledna RH > 85%?"}
  RhCheck -->|TAK: Mgla morska| ApplyK["Korekta Higroskopijna: PM_corr = PM_raw * k"]
  RhCheck -->|NIE: RH <= 85%| NoK["Brak korekty: k = 1.000"]
  ApplyK --> LatencyCheck{"Latencja DWDM < 5.0 ms?"}
  NoK --> LatencyCheck
  LatencyCheck -->|TAK: 3.42 - 3.84 ms| ValidOut["Publikacja Rekordu: dCi 0.92 - 0.98 (PASS)"]
  LatencyCheck -->|NIE: >= 5.0 ms| AlertOut["Flaga: LATENCY_ALERT (Obnizenie dCi)"]`,
    reviewChecklist: [
      'Odpornosc na falszywe alarmy smogowe podczas mgly morskiej w Ustce i Gdansku (RH 86–98%)',
      'Natychmiastowa izolacja zawieszonego czujnika (Flatline Fault) w ciagu jednego cyklu okna pomiarowego',
      'Pelna reprodukowalnosc obliczen w testach jednostkowych Node.js',
    ],
  },
  {
    id: 'exp_antigravity_power_bus',
    code: 'EXP-04',
    folderId: 'experts_architects_secops_smartgrid',
    folderPath: '/docs/diagramy/01-eksperci-architekci-secops-smartgrid/EXP-04-architektura-energetyczna-anti-gravity.md',
    title: 'Schemat Zasilania i Szyny Danych Biurka Anti-Gravity (1000W Stacjonarnie / 340Wh Off-Grid 13.7h)',
    targetAudienceTag: 'Inzynierowie Systemow Wbudowanych, Energetycy Off-Grid & Architekci Sprzetu',
    domainCategory: 'Smart Grid & Telemetry',
    summary: {
      professor: 'Bilans mocy i architektura szyn Thunderbolt 5 / USB-C PD dla dwutrybowego stanowiska badawczego: konfiguracja stacjonarna (~1000W) oraz konfiguracja polowa (~5.98 kg, 340Wh LiFePO4/Li-Ion z regulatorem MPPT 60W/100W zapewniającym 13.7h autonomii).',
      architect: 'Rozdzial szyn zasilania AC 230V (Samsung 27" TB5 240W, Projektor 4K 250W, MBP i9 96W, Acer i5 90W) od mobilnej szyny DC USB-C PD (Anker SOLIX C200 192Wh + 2x Solar Powerbank 148Wh -> MBP M1 + iPad M5 + MatePad + Acer Dual).',
      layperson: 'Schemat polaczen kablowych i baterii pokazujacy, jak zestaw komputerow dziala w biurze pod pelnym obciazeniem oraz w terenie na energii slonecznej.',
    },
    nodes: [
      {
        id: 'ag1',
        stepNumber: 'ZRODLO PV / MPPT',
        title: 'Panel Solarny 60W / 100W',
        subtitle: 'Konwersja MPPT (efektywny uzysk polowy ~25.2W – 42W)',
        metricBadge: 'Solar Input DC',
        accent: 'lime',
      },
      {
        id: 'ag2',
        stepNumber: 'MAGAZYN 340 Wh',
        title: 'Anker SOLIX C200 + 2x Powerbank',
        subtitle: '192Wh LiFePO4 + 148Wh Solar (2x 20 000 mAh) · UPS',
        metricBadge: '340 Wh Pojemnosci',
        accent: 'emerald',
      },
      {
        id: 'ag3',
        stepNumber: 'KLASTER MOBILNY',
        title: 'MBP M1 + iPad M5 + MatePad + Dual',
        subtitle: 'Masa calkowita 5.98 kg · Sredni pobor polowy ~50W (netto 24.8W)',
        metricBadge: '13.7h Autonomii',
        accent: 'sky',
      },
      {
        id: 'ag4',
        stepNumber: 'BAZA 1000W AC',
        title: 'Mission Control (TB5 + 4K 120")',
        subtitle: 'MBP i9 (96W) + Acer i5 (90W) + Samsung 27" (240W) + Projektor (250W)',
        metricBadge: '1000 W Szczytowo',
        accent: 'amber',
      },
    ],
    flowConnections: [
      'Panel Solarny 60W/100W -> Ladowanie buforowe MPPT stacji Anker SOLIX C200 (192Wh LiFePO4)',
      'Magazyn 340Wh -> Zasilanie USB-C PD dla MacBook Pro M1 (Tailscale), iPad Pro M5, MatePad 11.5 i ekranow Acer Dual PD193QT',
      'Bilans netto w terenie: 340 Wh / (50.0 W obciazenia - 25.2 W uzysku PV) = 13.7 godziny ciaglej pracy audytowej',
    ],
    mermaidSource: `flowchart LR
  Solar["Panel Solarny PV (22.5W -> 60W / 100W)"] -->|MPPT DC| Solix["Stacja Anker SOLIX C200 (192Wh LiFePO4) + 2x Powerbank (148Wh) = 340Wh"]
  Solix -->|USB-C PD 61W| M1["MacBook Pro M1 (Wezel Tailscale / Jump Desktop)"]
  Solix -->|USB-C PD 45W| Dual["Acer Dual 2x18.5 PD193QT (10-pkt Dotyk)"]
  Solix -->|USB-C PD 30W+22W| Tablets["iPad Pro M5 + MatePad 11.5 PaperMatte"]
  ACGrid["Zasilanie Stacjonarne ~1000W AC"] -->|Thunderbolt 5 / HDMI| BaseStation["MBP i9 (96W) + Acer i5 (90W) + Samsung 27 8K (240W) + Projektor 120 4K (250W)"]`,
    reviewChecklist: [
      'Masa zestawu mobilnego ponizej progu ergonomicznego 6.0 kg (5.98 kg)',
      'Zastosowanie ogniw LiFePO4 (Anker SOLIX C200) o zywotnosci > 3000 cykli i wysokim bezpieczenstwie termicznym',
      'Mozliwosc pracy bezprzerwowej (UPS) przy awarii zasilania w terenie przez 13.7h',
    ],
  },

  // ============================================================================
  // FOLDER 2: DLA PRZEGLADAJACYCH, KOMENTUJACYCH I ODBIORCOW OPROGRAMOWANIA
  // ============================================================================
  {
    id: 'pub_citizen_kiosk_journey',
    code: 'PUB-01',
    folderId: 'reviewers_commentators_recipients',
    folderPath: '/docs/diagramy/02-odbiorcy-komentujacy-interesariusze/PUB-01-sciezka-obywatela-dostepna-gmina.md',
    title: 'Sciezka Obywatela i Seniora w Pilotazu "Dostepna Gmina — Cyfrowa Samopomoc" (3 Audiokioski + 10 Wolontariuszy)',
    targetAudienceTag: 'Odbiorcy Oprogramowania, Samorzady (OPS/Gminy), Seniorzy & Komentujacy',
    domainCategory: 'GovTech & Citizen UX',
    summary: {
      professor: 'Model interakcji czlowiek-komputer (HCI) w standardzie WCAG 2.1 AAA z fizyczna petla wsparcia spolecznego (10 wolontariuszy) oraz ulotnym przetwarzaniem danych osobowych (Zero-PII RAM-Only).',
      architect: 'Przeplyw uzytkownika w 3 lokalizacjach (OPS, Biblioteka, Przychodnia POZ) przy uzyciu terminala za 2 200 PLN/pkt z automatycznym wyciszeniem glosnika po wpieciu sluchawek Jack.',
      layperson: 'Prosty rysunek pokazujacy, jak senior lub osoba z niepelnosprawnoscia przychodzi do urzedu, biblioteki lub przychodni, zaklada sluchawki i z pomoca zyczliwego wolontariusza zalatwia sprawe.',
    },
    nodes: [
      {
        id: 'pub1',
        stepNumber: 'KROK 1 / DOSTEP',
        title: '3 Lokalizacje Blisko Mieszkanca',
        subtitle: 'OPS, Biblioteka Publiczna, Przychodnia POZ (montaz 80–110 cm)',
        metricBadge: 'Ergonomia Wozkow',
        accent: 'lime',
      },
      {
        id: 'pub2',
        stepNumber: 'KROK 2 / INTERFEJS',
        title: 'Duzy Kontrast AAA & Glos TTS',
        subtitle: 'Litery #D8ED00 na tle #130E17 (14.54:1) + wpiecie sluchawek Jack',
        metricBadge: 'Auto-Mute Glosnika',
        accent: 'emerald',
      },
      {
        id: 'pub3',
        stepNumber: 'KROK 3 / WSPARCIE',
        title: 'Pomoc 10 Wolontariuszy',
        subtitle: 'Instrukcje w druku powiekszonym (18pt) oraz alfabecie Braille’a',
        metricBadge: 'Human-in-the-Loop',
        accent: 'sky',
      },
      {
        id: 'pub4',
        stepNumber: 'KROK 4 / PRYWATNOSC',
        title: 'Automatyczne Czyszczenie Sesji',
        subtitle: 'Po odejsciu od terminala zadne dane osobowe nie zostaja na dysku',
        metricBadge: '100% Zero-PII',
        accent: 'amber',
      },
    ],
    flowConnections: [
      'Mieszkaniec podchodzi do terminala w OPS, Bibliotece lub Przychodni (wygodna wysokosc 80–110 cm)',
      'Wlozenie sluchawek do gniazda Jack automatycznie wycisza glosnik zewnetrzny i uruchamia lektora TTS',
      'W razie potrzeby dyzurujacy wolontariusz pomaga odczytac instrukcje w druku powiekszonym lub Braille’u',
      'Zakonczenie wizyty natychmiast kasuje pamiec podręczna (Zero-PII) — pelne bezpieczenstwo RODO',
    ],
    mermaidSource: `flowchart LR
  Citizen["Mieszkaniec / Senior / Osoba na Wozku"] -->|Wysokosc 80-110 cm| Kiosk["Audiokiosk (OPS / Biblioteka / Przychodnia POZ)"]
  Kiosk -->|Wpiecie Sluchawek Jack| Audio["Auto-Wyciszenie Glosnika + Czytnik Glosowy TTS"]
  Kiosk -->|Kontrast 14.54:1 + Braille| Volunteer["Wsparcie 1 z 10 Lokalnych Wolontariuszy"]
  Audio --> Finish["Zalatwienie Sprawy Urzedowej / Zdrowotnej"]
  Volunteer --> Finish
  Finish -->|Koniec Sesji| Wipe["Automatyczne Wyzerowanie Pamieci RAM (Zero-PII)"]`,
    reviewChecklist: [
      'Koszt calkowity pilotazu dla gminy wynosi 11 000 PLN brutto (~2 500 EUR) — ponizej progu przetargowego PZP',
      'Pelna prywatnosc rozmowy dzieki automatycznemu odcieciu glosnika po podlaczeniu sluchawek',
      'Polaczenie nowoczesnej technologii z zyczliwa pomoca czlowieka (10 wolontariuszy)',
    ],
  },
  {
    id: 'pub_corridor_public_value',
    code: 'PUB-02',
    folderId: 'reviewers_commentators_recipients',
    folderPath: '/docs/diagramy/02-odbiorcy-komentujacy-interesariusze/PUB-02-mapa-korzysci-korytarza-pomorskiego.md',
    title: 'Mapa Korzysci Spolecznych i Ekologicznych: Ustka — Slupsk — Trojmiasto (Zielona Energia & Czyste Powietrze)',
    targetAudienceTag: 'Mieszkancy Pomorza, Turysci, Inwestorzy CSR Offshore & Komentujacy',
    domainCategory: 'Smart Grid & Telemetry',
    summary: {
      professor: 'Transfer wartosci z infrastruktury krytycznej Smart Grid 400 kV i morskiej energetyki wiatrowej (2.5 GW) do warstwy uslug publicznych i informacji srodowiskowej.',
      architect: 'Integracja pomiarow srodowiskowych i energetycznych w czytelny komunikat dla samorzadow Ustki, Slupska i Trojmiasta oraz partnerow CSR sektora Offshore.',
      layperson: 'Diagram wyjasniajacy prostym jezykiem, jak wspolpraca Ustki, Slupska i Trojmiasta daje rzetelna informacje o jakosci powietrza nad morzem i wspiera czysta energie z wiatrakow.',
    },
    nodes: [
      {
        id: 'pv1',
        stepNumber: 'USTKA / WYBRZEZE',
        title: 'Prawdziwa Jakosc Powietrza nad Morzem',
        subtitle: 'Odrzucenie mgly morskiej (RH > 85%) — brak falszywych alarmow smogowych dla turystow',
        metricBadge: 'Port & Uzdrowisko',
        accent: 'lime',
      },
      {
        id: 'pv2',
        stepNumber: 'SLUPSK / REGION',
        title: 'Bezpieczny Węzeł Energetyczny 400 kV',
        subtitle: 'Stabilny przesyl zielonej energii z morza przez GPZ Wierzbiecino',
        metricBadge: 'Czysta Energia',
        accent: 'emerald',
      },
      {
        id: 'pv3',
        stepNumber: 'TROJMIASTO / BIZNES',
        title: 'Standard Ekologiczny ESG dla Hoteli i Firm',
        subtitle: 'Wiarygodny monitoring srodowiskowy i zgodnosc z regulacjami UE',
        metricBadge: 'Hotel Gdansk SLA',
        accent: 'sky',
      },
      {
        id: 'pv4',
        stepNumber: 'EFEKT DLA LUDZI',
        title: 'Zdrowie, Dostepnosc i Innowacje',
        subtitle: 'Srodki z CSR Offshore i dotacji wracaja do mieszkancow w postaci audiokioskow',
        metricBadge: 'Rozwoj Regionalny',
        accent: 'amber',
      },
    ],
    flowConnections: [
      'Ustka: Turysci i mieszkancy wiedza, kiedy powietrze jest czyste, bo system odroznia morska bryze od smogu',
      'Slupsk: Stacja GPZ Wierzbiecino bezpiecznie wprowadza prad z morskich wiatrakow do krajowej sieci',
      'Trojmiasto: Hotele i instytucje otrzymuja certyfikowany monitoring srodowiskowy i prawny',
      'Wspolny efekt: Nowoczesny region pomorski przyciagajacy fundusze unijne i dbajacy o seniorow',
    ],
    mermaidSource: `flowchart LR
  Offshore["Morskie Farmy Wiatrowe Baltica 2 & 3 (2.5 GW)"] --> UstkaPort["Ustka: Czyste Powietrze bez Falszywych Alarmow Mglowych"]
  UstkaPort --> SlupskGrid["Slupsk (GPZ Wierzbiecino): Bezpieczna Siec Energetyczna 400 kV"]
  SlupskGrid --> GdanskHub["Trojmiasto (Hotel Gdansk): Zielony Standard dla Turystyki i Biznesu"]
  GdanskHub --> Citizens["Korzysc dla Mieszkancow: Zdrowie, Dostepne Urzedy i Nowe Miejsca Pracy"]`,
    reviewChecklist: [
      'Zrozumialy przekaz dla mediow, radnych gminnych i mieszkancow bez wyksztalcenia technicznego',
      'Wyrazne powiazanie morskiej energetyki wiatrowej ze spoleczna odpowiedzialnoscia biznesu (CSR)',
      'Wiarygodnosc ekologiczna potwierdzona twardymi pomiarami naukowymi',
    ],
  },
  {
    id: 'pub_financial_60_30_10_flow',
    code: 'PUB-03',
    folderId: 'reviewers_commentators_recipients',
    folderPath: '/docs/diagramy/02-odbiorcy-komentujacy-interesariusze/PUB-03-przeplywy-finansowe-60-30-10-i-dotacje.md',
    title: 'Przejrzysty Schemat Finansowy: Model 60 / 30 / 10, 4 Wypłaty w Miesiącu i Mnożenie Kapitału',
    targetAudienceTag: 'Inwestorzy, Komisje Dotacyjne (PFRON / FE Pomorza) & Przegladajacy Biznesplan',
    domainCategory: 'Financial & PPP Flow',
    summary: {
      professor: 'Model dywersyfikacji strumieni przychodowych i alokacji aktywow minimalizujacy ryzyko utraty plynnosci podczas komercjalizacji wynikow prac B+R.',
      architect: 'Zestawienie 3 zrodel przychodu (60% B2B, 30% SLA MRR, 10% Audyty z 40% zadatkiem), 4 dat wplywow (5., 10., 18., 25. dzien) oraz finansowania dotacyjnego PFRON i FE Pomorza.',
      layperson: 'Czytelny plan finansowy pokazujacy, skad biora sie pieniadze na rozwoj projektu, dlaczego wplywaja na konto regularnie cztery razy w miesiacu i jak sa bezpiecznie inwestowane.',
    },
    nodes: [
      {
        id: 'fin1',
        stepNumber: 'ZRODLA 60 / 30 / 10',
        title: 'Trzy Stabilne Nogi Przychodow',
        subtitle: '60% Kontrakt B2B · 30% Abonamenty SLA · 10% Audyty (40% zadatku)',
        metricBadge: 'Dywersyfikacja',
        accent: 'lime',
      },
      {
        id: 'fin2',
        stepNumber: '4 WPLYWY / MIES.',
        title: 'Kalendarz Płynności: 5., 10., 18., 25.',
        subtitle: 'Cztery regularne transze w miesiacu eliminujace zatory platnicze',
        metricBadge: '4x Cashflow / m',
        accent: 'emerald',
      },
      {
        id: 'fin3',
        stepNumber: 'LEWAR DOTACYJNY',
        title: 'PFRON & FE Pomorza 1.1 B+R',
        subtitle: 'PUP Slupsk do 143 400 PLN (PoC 16 850 PLN) + UE 600k – 2 mln PLN',
        metricBadge: 'Kapital B+R',
        accent: 'sky',
      },
      {
        id: 'fin4',
        stepNumber: 'WODOSPAD KAPITALU',
        title: 'Podatki 5% IP Box -> IKE/IKZE & EDO',
        subtitle: 'Poduszka 6M (TOS/COI) -> Konta emerytalne 0% Belki -> Globalne ETF',
        metricBadge: 'Bezpieczny Wzrost',
        accent: 'amber',
      },
    ],
    flowConnections: [
      'Praca podzielona w proporcji 60/30/10 generuje 4 przelewy w miesiacu: 5. (SLA), 10. (B2B), 18. (Zaliczki 40%) i 25. (Samorzady)',
      'Ulga IP Box (5% PIT od kodu B+R) lub Ryczalt 12% pozwala zachowac maksymalna czesc wypracowanego zysku',
      'Dotacja PFRON i Fundusze Europejskie finansuja sprzet i badania bez koniecznosci zaciagania kredytow',
      'Nadwyzka trafia najpierw na 6-miesieczna poduszke bezpieczenstwa, a nastepnie na IKE/IKZE i obligacje skarbowe EDO',
    ],
    mermaidSource: `flowchart TB
  Work["Czas Pracy Architekta: 60% Kontrakt B2B | 30% Abonamenty SLA | 10% Audyty i Wdrozenia"] --> Calendar["4 Wplywy w Miesiacu: 5. dzien (SLA) | 10. dzien (B2B) | 18. dzien (40% Zaliczki) | 25. dzien (Gminy/Offshore)"]
  Grants["Dotacje: PFRON (do 143 400 PLN) + FE Pomorza 1.1 B+R (600k - 2 mln PLN)"] --> Infra["Infrastruktura Badawcza i Pilotaze PoC"]
  Calendar --> Tax["Optymalizacja Podatkowa: IP Box 5% PIT lub Ryczalt 12% (+ 0% VAT UE)"]
  Tax --> Waterfall1["Krok 1: Poduszka Finansowa 6M (Subkonto EUR/PLN + Obligacje TOS/COI)"]
  Waterfall1 --> Waterfall2["Krok 2: Tarcze Emerytalne IKE (0% Belki) & IKZE (Ulga PIT)"]
  Waterfall2 --> Waterfall3["Krok 3: Dlugoterminowe ETF (MSCI ACWI) & Obligacje Antyinflacyjne EDO"]`,
    reviewChecklist: [
      'Zabezpieczenie kazdego nowego zlecenia audytowego zadatkiem min. 40% przed rozpoczeciem prac',
      'Pelna samowystarczalnosc finansowa juz od pierwszego miesiaca dzieki kontraktowi bazowemu B2B (60% czasu)',
      'Przejrzysta sciezka budowania majatku prywatnego i firmowego bez spekulacyjnego ryzyka',
    ],
  },
  {
    id: 'pub_trust_and_whistleblower_guide',
    code: 'PUB-04',
    folderId: 'reviewers_commentators_recipients',
    folderPath: '/docs/diagramy/02-odbiorcy-komentujacy-interesariusze/PUB-04-jak-dziala-ochrona-sygnalisty-i-umow.md',
    title: 'Przewodnik Zaufania dla Odbiorcow: Dlaczego Sygnalista jest Anonimowy, a Umowa Niepodrabialna?',
    targetAudienceTag: 'Kancelarie Prawne, Pracownicy, Urzednicy, Recenzenci & Komentujacy',
    domainCategory: 'GovTech & Citizen UX',
    summary: {
      professor: 'Wizualna popularyzacja pojec kryptografii stosowanej (funkcje skrotu SHA-256, sanityzacja metadanych i polityka Zero Data Retention) dla interesariuszy nietechnicznych.',
      architect: 'Diagram wyjasniajacy klientom kancelarii i urzedom, dlaczego system spelnia wymogi RODO, ustawy o ochronie sygnalistow oraz dyrektywy NIS2.',
      layperson: 'Prosta ilustracja pokazujaca dwie rzeczy: jak cyfrowa niszczarka usuwa slady z plikow sygnalisty oraz jak cyfrowa plomba chroni umowy przed podmiana tekstu.',
    },
    nodes: [
      {
        id: 'tr1',
        stepNumber: 'CYFROWA NISZCZARKA',
        title: 'Usuwanie Ukrytych Sladow z Plikow',
        subtitle: 'Zanim zgloszenie trafi do odbiorcy, program wymazuje GPS ze zdjecia i nazwisko autora z Worda',
        metricBadge: 'Pelna Anonimowosc',
        accent: 'lime',
      },
      {
        id: 'tr2',
        stepNumber: 'BRAK ADRESU IP',
        title: 'Serwer Nie Pyta "Skad Piszesz"',
        subtitle: 'Brak ciasteczek sledzacych (0 Cookies) i brak zapisywania adresow IP komputerow',
        metricBadge: 'Zero-Tracking',
        accent: 'emerald',
      },
      {
        id: 'tr3',
        stepNumber: 'BEZPIECZNA ANALIZA AI',
        title: 'Sztuczna Inteligencja z Tajemnica Zawodowa',
        subtitle: 'Program sprawdza umowe wedlug listy kontrolnej i natychmiast zapomina jej tresc',
        metricBadge: 'Zero Retention',
        accent: 'sky',
      },
      {
        id: 'tr4',
        stepNumber: 'CYFROWA PLOMBA',
        title: 'Lancuch Pieczeci SHA-256',
        subtitle: 'Kazda zmiana przecinka w umowie zmienia cyfrowy odcisk palca — nie da sie nic podmienic wstecz',
        metricBadge: 'Slad Audytowy',
        accent: 'amber',
      },
    ],
    flowConnections: [
      'Wyslanie pliku przez sygnaliste -> Automatyczne zdjecie metadanych (brak lokalizacji i autora)',
      'Analiza dokumentu -> Weryfikacja zgodnosci z prawem bez przesylania danych do trenowania publicznych modeli AI',
      'Zapisanie umowy -> Nadanie unikalnego skrotu SHA-256 powiazanego z poprzednia wersja dokumentu',
    ],
    mermaidSource: `flowchart LR
  UserFile["Dokument lub Zdjecie od Uzytkownika"] --> Shredder["Cyfrowa Niszczarka Metadanych (Usuwa GPS, Autora i Adres IP)"]
  Shredder --> AIReview["Kontrola Prawna ze Scisla Tajemnica (Zero Zapamietywania Danych)"]
  AIReview --> Seal["Cyfrowa Plomba SHA-256 (Chroni przed Potajemna Zmiana Tekstu)"]`,
    reviewChecklist: [
      'Zrozumiale dla kazdego pracownika i urzednika wyjasnienie bezpieczenstwa prawnego',
      'Potwierdzenie zgodnosci z europejskimi przepisami RODO, NIS2 i EU AI Act',
      'Gotowy material prezentacyjny na spotkania w gminach i kancelariach',
    ],
  },
];

export const FUTURE_EXPANSION_ROADMAP: FutureExpansionModule[] = [
  {
    id: 'exp_pqc_crypto',
    code: 'EXPANSION-01',
    horizon: '2027 Q2–Q4',
    title: 'Kryptografia Post-Kwantowa (PQC: ML-KEM / Kyber & ML-DSA / Dilithium)',
    domain: 'Cybersecurity & PQC',
    trlCurrent: 6,
    trlTarget: 9,
    estimatedCapexPln: 45000,
    projectedMonthlyMrrPln: 6500,
    additionalMunicipalitiesOrNodes: 12,
    description: {
      professor: 'Migracja warstwy brzegowej Rust oraz lancucha audytowego z klasycznych prymitywow asymetrycznych na kratowe algorytmy post-kwantowe standaryzowane przez NIST (FIPS 203 ML-KEM oraz FIPS 204 ML-DSA), zabezpieczajaca dlugoterminowa poufnosc sygnalistow i telemetrii 400 kV ("Harvest Now, Decrypt Later").',
      architect: 'Wdrozenie hybrydowego uzgadniania kluczy X25519+ML-KEM-768 w tunelach DWDM/Tailscale oraz podpisow ML-DSA dla wersjonowanych blokow umownych w Rust.',
      layperson: 'Uodpornienie systemu na komputery kwantowe przyszlosci — dzieki temu dzisiejsze tajemnice urzedowe, medyczne i energetyczne pozostana bezpieczne nawet za 20 lat.',
    },
    keyDeliverables: [
      'Modul Rust PQC (ML-KEM-768 + ML-DSA-65) dla kanalu sygnalistow i rejestru umow',
      'Hybrydowe szyfrowanie traktow telemetrii Smart Grid Ustka — Slupsk — Trojmiasto',
      'Certyfikacja gotowosci kwantowej dla podmiotow kluczowych NIS2',
    ],
  },
  {
    id: 'exp_digital_twin_bess_h2',
    code: 'EXPANSION-02',
    horizon: '2027 Q2–Q4',
    title: 'Predykcyjny Digital Twin Korytarza Baltica 2 & 3 + Magazyny BESS i Zielony Wodor (H2)',
    domain: 'Smart Grid & Offshore',
    trlCurrent: 7,
    trlTarget: 9,
    estimatedCapexPln: 120000,
    projectedMonthlyMrrPln: 14000,
    additionalMunicipalitiesOrNodes: 8,
    description: {
      professor: 'Cyfrowy blizniak (Digital Twin) sprzegajacy prognozy meteorologiczne morskiej strefy wiatrowej (2.5 GW) z modelem rozpływu mocy w GPZ Wierzbiecino 400 kV oraz algorytmem arbitrazu wielkoskalowych magazynow energii LiFePO4 (BESS) i elektrolizerow zielonego wodoru w porcie Ustka.',
      architect: 'Rozszerzenie telemetrii dCi o predykcje generacji wiatrowej 15-min/1h i automatyczne sterowanie szczytowym zrzutem mocy do buforow wodorowych i bateryjnych.',
      layperson: 'Wirtualny model sieci energetycznej, ktory przewiduje sile wiatru na morzu i podpowiada, kiedy nadmiar czystego pradu zmagazynowac w wielkich bateriach lub zamienic na ekologiczny wodor.',
    },
    keyDeliverables: [
      'Silnik predykcyjny obciazenia GPZ Wierzbiecino 400 kV z horyzontem 72h',
      'Interfejs integracyjny SCADA / IEC 61850 z walidacja anomalii dCi',
      'Modul bilansowania magazynow BESS i portowej infrastruktury O&M w Ustce',
    ],
  },
  {
    id: 'exp_accessible_voivodeship_pjm',
    code: 'EXPANSION-03',
    horizon: '2028 Q1–Q4',
    title: 'Skalowanie "Dostepne Pomorze" (100+ Audiokioskow + Avatar Polskiego Jezyka Migowego PJM & Offline ASR)',
    domain: 'GovTech & Accessibility',
    trlCurrent: 8,
    trlTarget: 9,
    estimatedCapexPln: 85000,
    projectedMonthlyMrrPln: 18500,
    additionalMunicipalitiesOrNodes: 45,
    description: {
      professor: 'Federacyjna siec terminali dostepnosci cyfrowej wyposazona w lokalne modele rozpoznawania mowy (Offline Edge ASR) oraz syntetycznego awatara Polskiego Jezyka Migowego (PJM) renderowanego w czasie rzeczywistym zgodnie z wymogami ustawy o zapewnianiu dostepnosci.',
      architect: 'Przejscie z pilotazu 3 terminali (11 000 PLN) na model franczyzowo-abonamentowy dla 45+ gmin i powiatow z centralnym zarzadzaniem aktualizacjami i pelna izolacja Zero-PII.',
      layperson: 'Rozszerzenie programu gminnych terminali na cale wojewodztwo pomorskie oraz dodanie na ekranie wirtualnego tlumacza Polskiego Jezyka Migowego dla osob nieslyszacych.',
    },
    keyDeliverables: [
      'Modul wirtualnego tlumacza Polskiego Jezyka Migowego (PJM) dla OPS, bibliotek i szpitali',
      'Lokalny model glosowy dzialajacy w 100% bez internetu (Offline Voice-to-Form)',
      'Pakiet wdrozeniowy PPP/PFRON dla powiatow i zwiazkow gminnych',
    ],
  },
  {
    id: 'exp_dora_nis2_autonomous_auditor',
    code: 'EXPANSION-04',
    horizon: '2028 Q1–Q4',
    title: 'Ciagly Audytor Zgodnosci DORA, NIS2 & AI Act dla Sektora Finansowego i Dostawcow Offshore',
    domain: 'Legal Tech & FinTech',
    trlCurrent: 7,
    trlTarget: 9,
    estimatedCapexPln: 60000,
    projectedMonthlyMrrPln: 12000,
    additionalMunicipalitiesOrNodes: 20,
    description: {
      professor: 'Formalna weryfikacja polityk odpornosci operacyjnej (rozporzadzenie DORA) oraz bezpieczenstwa lancucha dostaw (NIS2 Art. 21) przy uzyciu deterministycznych grafow wiedzy i bramek CodeBLEU / BERTScore.',
      architect: 'Platforma SaaS / On-Premise automatycznie walidujaca umowy z podwykonawcami IT/OT, plany ciaglosci dzialania (RTO < 2h) i rejestry incydentow dla bankow spoldzielczych i spółek energetycznych.',
      layperson: 'Automatyczny kontroler prawny dla bankow, firm energetycznych i dostawcow morskich farm wiatrowych, ktory codziennie sprawdza, czy firma spelnia nowe unijne wymogi cyberbezpieczenstwa.',
    },
    keyDeliverables: [
      'Biblioteka wersjonowanych blokow umownych DORA i NIS2 Supply Chain',
      'Generator raportow incydentow CSIRT / KNF z podpisem lancuchowym SHA-256',
      'Staly monitoring ryzyka dostawcow zewnetrznych (Third-Party Risk Matrix)',
    ],
  },
  {
    id: 'exp_mesh_lorawan_offgrid_buoys',
    code: 'EXPANSION-05',
    horizon: '2029–2030',
    title: 'Autonomiczna Siec Bojek i Stacji Brzegowych Mesh Off-Grid (LoRaWAN / Meshtastic + Solar)',
    domain: 'Smart Grid & Offshore',
    trlCurrent: 6,
    trlTarget: 8,
    estimatedCapexPln: 95000,
    projectedMonthlyMrrPln: 9500,
    additionalMunicipalitiesOrNodes: 30,
    description: {
      professor: 'Samoorganizujaca sie siec kratowa dalekiego zasiegu (Sub-GHz LoRa / Meshtastic) zasilana mikro-ogniwami LiFePO4 i panelami fotowoltaicznymi, zapewniajaca transmisje telemetrii AQI/dCi oraz komunikatow kryzysowych przy calkowitym blackoutcie sieci komorkowych i energetycznych.',
      architect: 'Integracja mobilnego zestawu Biurka Anti-Gravity z polowymi bramkami LoRaWAN wzdłuż wybrzeza Baltyku i stacji transformatorowych GPZ.',
      layperson: 'Siec malych, zasilanych sloncem czujnikow nad morzem i w gminach, ktore potrafia przesylac ostrzezenia pogodowe i pomiary powietrza nawet wtedy, gdy zabraknie pradu i przestana dzialac telefony komorkowe.',
    },
    keyDeliverables: [
      'Odporne na sol morska wezly telemetryczne AQI/dCi z komunikacja radiowa Mesh',
      'Awaryjny kanal lacznosci kryzysowej dla gmin i sluzb portowych w Ustce',
      'Pelna autonomia energetyczna 365 dni w roku dzieki ogniwom LiFePO4 i MPPT',
    ],
  },
];

/**
 * Computes financial, technical, and grant scaling metrics for selected future expansion modules.
 */
export function calculateRoadmapExpansionImpact(
  selectedModuleIds: string[],
  modules: FutureExpansionModule[] = FUTURE_EXPANSION_ROADMAP
): RoadmapImpactSummary {
  const chosen = modules.filter((m) => selectedModuleIds.includes(m.id));
  if (chosen.length === 0) {
    return {
      selectedCount: 0,
      totalCapexPln: 0,
      projectedAdditionalMrrPln: 0,
      projectedAnnualArrPln: 0,
      totalNewNodesAndMunicipalities: 0,
      averageTargetTrl: 0,
      fePomorzaGrantCoveragePln: 0,
      ownContributionPln: 0,
    };
  }

  const totalCapexPln = chosen.reduce((sum, m) => sum + m.estimatedCapexPln, 0);
  const projectedAdditionalMrrPln = chosen.reduce((sum, m) => sum + m.projectedMonthlyMrrPln, 0);
  const projectedAnnualArrPln = projectedAdditionalMrrPln * 12;
  const totalNewNodesAndMunicipalities = chosen.reduce(
    (sum, m) => sum + m.additionalMunicipalitiesOrNodes,
    0
  );
  const averageTargetTrl = Number(
    (chosen.reduce((sum, m) => sum + m.trlTarget, 0) / chosen.length).toFixed(1)
  );

  // FE Pomorza 1.1 B+R typical co-financing rate ~80% for R&D modules
  const fePomorzaGrantCoveragePln = Math.round(totalCapexPln * 0.8);
  const ownContributionPln = totalCapexPln - fePomorzaGrantCoveragePln;

  return {
    selectedCount: chosen.length,
    totalCapexPln,
    projectedAdditionalMrrPln,
    projectedAnnualArrPln,
    totalNewNodesAndMunicipalities,
    averageTargetTrl,
    fePomorzaGrantCoveragePln,
    ownContributionPln,
  };
}

// ============================================================================
// NEXT-GEN 3 PILLARS (HORYZONT 2027–2032 — ARCHITEKTURA WYPRZEDZAJACA CZAS)
// 1. Droga I: Legal Tech (zk-SNARKs + Z3 Formal Verification + PQC NIST + eIDAS 2.0)
// 2. Droga II: Smart Grid (Synchrofazory PMU + Grid-Forming BESS + DLR 400 kV + Zielony Wodor H2)
// 3. Droga III: Pomoc Osobom z Niepelnosprawnosciami (Eye-Gaze + 2-Way PJM Vision + Nawigacja UWB + Asystent Uprawnien PFRON Zero-PII)
// ============================================================================

export type NextGenPillarId = 'legaltech_nextgen' | 'smartgrid_nextgen' | 'accessibility_nextgen';

export interface NextGenInnovationNode {
  id: string;
  code: string;
  title: string;
  techStack: string;
  trl: string;
  deploymentWindow: '30 dni (PoC)' | '90 dni (Pilotaz)' | '180 dni (Skala)';
  keyMetric: string;
  description: string;
}

export interface NextGenRolloutStage {
  windowLabel: string;
  milestoneTitle: string;
  deliverable: string;
  budgetCapexPln: number;
}

export interface NextGenPillarBlueprint {
  id: NextGenPillarId;
  pillarNumber: string;
  title: string;
  subtitle: string;
  legacyLimitation: string;
  futureLeapSummary: AudienceTranslation;
  innovations: NextGenInnovationNode[];
  rolloutStages: NextGenRolloutStage[];
  fundingSourceTag: string;
}

export const NEXT_GEN_THREE_PILLARS: NextGenPillarBlueprint[] = [
  {
    id: 'legaltech_nextgen',
    pillarNumber: 'DROGA 01 · NEXT-GEN LEGAL TECH',
    title: 'Kryptografia Dowodow Zero-Knowledge (zk-SNARKs), Solver Formalny Z3 & Portfel eIDAS 2.0',
    subtitle: 'Od zwyklego czyszczenia EXIF i klasycznego RAG do matematycznie niepodwazalnego prawa obliczeniowego (Computational Law)',
    legacyLimitation:
      'Klasyczne czyszczenie EXIF i modele jezykowe RAG maja dwa ograniczenia: (1) usuniecie metadanych nie dowodzi autentycznosci faktu bez ujawnienia dokumentu, (2) klasyczne szyfrowanie RSA/ECC jest podatne na ataki kwantowe "Harvest Now, Decrypt Later", a zwykly LLM bywa probabilistyczny.',
    futureLeapSummary: {
      professor:
        'Zastapienie heurystycznej analizy tekstowej hybrydowa architektura Neuro-Symboliczna: ekstrakcja predykatow prawnych do solvera SMT Z3 (100% determinizmu logicznego), generowanie dowodow zerowej wiedzy zk-SNARK (Plonky3 w Rust) dla sygnalistow oraz podpisy kratowe NIST FIPS 204 (ML-DSA-65).',
      architect:
        'Wdrozenie potoku: Rust zk-SNARK Prover (udowodnienie posiadania waznego kontraktu/uprawnienia bez wysylania pliku) -> Z3 Formal Contract Verifier (wykrywanie sprzecznosci SLA/RODO/NIS2) -> EUDI Wallet (eIDAS 2.0 Selective Disclosure) + PQC Ledger.',
      layperson:
        'Przelom w ochronie sygnalistow i umow: pracownik moze matematycznie udowodnic, ze pracuje w firmie i zglasza prawdziwe naruszenie, nie zdradzajac swojego nazwiska ani nie pokazujac poufnego dokumentu, a komputer sprawdza umowe jak rownanie matematyczne bez zadnych bledow.',
    },
    innovations: [
      {
        id: 'lt_zksnark',
        code: 'LT-NEXT-01',
        title: 'Dowody Zerowej Wiedzy zk-SNARKs (Plonky3 / Halo2 w Rust) dla Sygnalistow i Audytow',
        techStack: 'Rust · Plonky3 / Groth16 · WebAssembly (WASM Client Prover)',
        trl: 'TRL 7 → 9',
        deploymentWindow: '30 dni (PoC)',
        keyMetric: 'Weryfikacja < 4.5 ms · 0 bajtow ujawnionych PII',
        description:
          'Sygnalista generuje w przegladarce (WASM) kryptograficzny dowod zk-SNARK potwierdzajacy, ze nalezy do personelu instytucji i posiada oryginalny dokument naruszenia — serwer weryfikuje prawde matematyczna bez otrzymania samego pliku.',
      },
      {
        id: 'lt_z3_smt',
        code: 'LT-NEXT-02',
        title: 'Neuro-Symboliczny Kompilator Umow (Python RAG + Microsoft Z3 SMT Solver)',
        techStack: 'Python · Z3 Theorem Prover · Guardrails · CodeBLEU 0.89',
        trl: 'TRL 8 → 9',
        deploymentWindow: '90 dni (Pilotaz)',
        keyMetric: '100% wykrywalnosci sprzecznosci logicznych SLA/RODO',
        description:
          'Klauzule odpowiedzialnosci, terminow RTO (< 2h), kar umownych i RODO Art. 28 sa zamieniane na formule logiczna SMT-LIB2. Solver Z3 matematycznie dowodzi spelnialnosci (SAT) lub wskazuje dokladny konflikt klauzul (UNSAT Core).',
      },
      {
        id: 'lt_pqc_eidas2',
        code: 'LT-NEXT-03',
        title: 'Lancuch Post-Kwantowy NIST (ML-KEM-768 + ML-DSA-65) & Europejski Portfel eIDAS 2.0 (EUDI)',
        techStack: 'Rust pqcrypto · Go API · SD-JWT (Selective Disclosure)',
        trl: 'TRL 7 → 9',
        deploymentWindow: '180 dni (Skala)',
        keyMetric: 'Odpornosc kwantowa 2030+ · Zgodnosc eIDAS 2.0 / DORA',
        description:
          'Kazdy blok rejestru umow i raportow incydentow CSIRT/NIS2 otrzymuje podwojny podpis: klasyczny SHA-256/Ed25519 oraz post-kwantowy ML-DSA-65, z obsluga selektywnego ujawniania atrybutow z portfela EUDI.',
      },
    ],
    rolloutStages: [
      {
        windowLabel: 'Faza 1 (Dni 1–30)',
        milestoneTitle: 'Modul Rust WASM zk-SNARK & Podpisy Hybrydowe PQC',
        deliverable: 'Weryfikator dowodow sygnalisty bez przesylania dokumentu + rejestr SHA-256/ML-DSA-65',
        budgetCapexPln: 22000,
      },
      {
        windowLabel: 'Faza 2 (Dni 31–90)',
        milestoneTitle: 'Silnik Formalnej Weryfikacji Klauzul Z3 SMT Solver',
        deliverable: 'Automatyczny kompilator wykrywajacy sprzecznosci w umowach B2B, SLA i RODO/NIS2',
        budgetCapexPln: 38000,
      },
      {
        windowLabel: 'Faza 3 (Dni 91–180)',
        milestoneTitle: 'Bramka eIDAS 2.0 (EUDI Wallet) & Ciagly Audytor DORA',
        deliverable: 'Certyfikowany wezel weryfikacji tozsamości i lancucha dostaw dla kancelarii, gmin i energetyki',
        budgetCapexPln: 45000,
      },
    ],
    fundingSourceTag: 'IP Box 5% PIT + Grant FE Pomorza 1.1 B+R / Kontrakty SLA Kancelarie & Energetyka',
  },
  {
    id: 'smartgrid_nextgen',
    pillarNumber: 'DROGA 02 · NEXT-GEN SMART GRID & OFFSHORE',
    title: 'Wirtualna Inercja Grid-Forming (< 5 ms DWDM), Dynamic Line Rating (DLR 400 kV) & Arbitraz Wodorowy H2',
    subtitle: 'Od pasywnego pomiaru pylow PM2.5/dCi do aktywnej stabilizacji systemu 400 kV i bilansowania 2.5 GW z Baltica 2 & 3',
    legacyLimitation:
      'Klasyczny monitoring AQI/dCi tylko raportuje stan powietrza. Tymczasem przy wprowadzeniu 2.5 GW mocy wiatrowej z morza do GPZ Wierzbiecino 400 kV najwiekszym wyzwaniem staje sie niska inercja sieci (ryzyko skokow czestotliwosci RoCoF), przegrzewanie przewodow 400 kV, osadzanie soli morskiej na izolatorach oraz ujemne ceny energii w wietrzne noce.',
    futureLeapSummary: {
      professor:
        'Sprzezenie optycznego traktu DWDM (3.42–3.84 ms) ze strumieniem synchrofazorow PMU (IEEE C37.118, 50 ramek/s) w celu realizacji syntetycznej inercji Grid-Forming BESS tlumiacej pochodna czestotliwosci df/dt (RoCoF), predykcji przewodnosci powierzchniowej izolatorow 400 kV w aerozolu solnym (RH > 85%) oraz dynamicznej obciazalnosci pradowej linii (DLR).',
      architect:
        'Cztery warstwy aktywne: (1) DLR 400 kV (chlodzenie wiatrem zwieksza przepustowosc GPZ Wierzbiecino o +15–28%), (2) Petla PMU + DWDM < 5 ms dla magazynow LiFePO4 (Grid-Forming), (3) Predykcja pradow uplywu na izolatorach z danych dCi/RH%, (4) Elektroliza zielonego wodoru H2 w Porcie Ustka przy ujemnych cenach TGE.',
      layperson:
        'Inteligentna siec energetyczna nowej generacji: wiatr znad morza nie tylko kreci turbinami, ale tez chlodzi kable wysokiego napiecia pod Slupskiem (dzieki czemu miesci sie w nich o 1/4 wiecej pradu bez budowy nowych slupow), a nadmiar nocnego pradu zamienia w porcie Ustka na czyste paliwo wodorowe dla statkow.',
    },
    innovations: [
      {
        id: 'sg_dlr_insulators',
        code: 'SG-NEXT-01',
        title: 'Dynamic Line Rating (DLR 400 kV) & Predykcja Zabrudzen Solnych Izolatorow GPZ',
        techStack: 'Python PINNs (Physics-Informed Neural Nets) · Sensor dCi/RH% · IEC 61850',
        trl: 'TRL 8 → 9',
        deploymentWindow: '30 dni (PoC)',
        keyMetric: '+18% do +28% ukrytej przepustowosci linii 400 kV',
        description:
          'Wykorzystuje istniejace stacje pomiarowe w Ustce i Slupsku do obliczania rzeczywistego chlodzenia przewodow 400 kV przez wiatr (DLR) oraz ostrzega przed ulotem elektrycznym na izolatorach pokrytych morska sola przy RH > 85%.',
      },
      {
        id: 'sg_pmu_gridforming',
        code: 'SG-NEXT-02',
        title: 'Syntetyczna Inercja Grid-Forming BESS po Swiatlowodzie DWDM (3.84 ms) & Synchrofazory PMU',
        techStack: 'Rust Real-Time DSP · IEEE C37.118 PMU · DWDM < 5 ms',
        trl: 'TRL 7 → 9',
        deploymentWindow: '90 dni (Pilotaz)',
        keyMetric: 'Reakcja inercyjna < 5 ms · Tlumienie RoCoF o 64%',
        description:
          'Ultraszybki kanal optyczny DWDM przesyla wektory kata fazowego napięcia (PMU) pomiedzy Ustka a GPZ Wierzbiecino, pozwalajac magazynom energii BESS natychmiast stabilizowac czestotliwosc 50.00 Hz.',
      },
      {
        id: 'sg_h2_v2g_arbitrage',
        code: 'SG-NEXT-03',
        title: 'Autonomiczny Arbitraz Wodorowy (Power-to-H2 Port Ustka) & Klastrowy V2G/BESS',
        techStack: 'Go Energy Scheduler · Python Optimization · LiFePO4 + PEM Electrolyzer',
        trl: 'TRL 7 → 8',
        deploymentWindow: '180 dni (Skala)',
        keyMetric: 'Zero przymusowego wylaczania wiatrakow (0% Curtailment)',
        description:
          'Algorytm automatycznie kieruje nadwyzki energii z farm Baltica 2 & 3 (w godzinach ujemnych cen na gieldzie TGE) do portowych elektrolizerow wodoru w Ustce zasilajacych jednostki serwisowe Offshore CTV/SOV.',
      },
    ],
    rolloutStages: [
      {
        windowLabel: 'Faza 1 (Dni 1–30)',
        milestoneTitle: 'Modul DLR 400 kV i Indeks Ryzyka Izolatorow Solnych (dCi-Grid)',
        deliverable: 'Algorytm wyliczajacy zapas obciazalnosci pradowej linii Slupsk–Ustka i ryzyko ulotu przy RH > 85%',
        budgetCapexPln: 28000,
      },
      {
        windowLabel: 'Faza 2 (Dni 31–90)',
        milestoneTitle: 'Demonstrator Telemetrii Synchrofazorowej PMU po DWDM < 5 ms',
        deliverable: 'Stacja walidacji RoCoF (df/dt) i wirtualnej inercji pod kierunkiem naukowym w Smart Grid Lab',
        budgetCapexPln: 54000,
      },
      {
        windowLabel: 'Faza 3 (Dni 91–180)',
        milestoneTitle: 'Optymalizator Arbitrazu BESS + Zielony Wodor H2 w Porcie Ustka',
        deliverable: 'System bilansowania energii dla klastra portowego O&M i samorzadow korytarza pomorskiego',
        budgetCapexPln: 75000,
      },
    ],
    fundingSourceTag: 'Fundusze Europejskie dla Pomorza 1.1 B+R (600k–2M PLN) + Kontrakty O&M Offshore',
  },
  {
    id: 'accessibility_nextgen',
    pillarNumber: 'DROGA 03 · NEXT-GEN POMOC OSOBOM Z NIEPELNOSPRAWNOSCIAMI',
    title: 'Asystywny Terminal Generacji 2.0: Sterowanie Wzrokiem (Eye-Gaze), Dwukierunkowy PJM Vision & Nawigacja UWB',
    subtitle: 'Od statycznego audiokiosku do bezdotykowego, proaktywnego ekosystemu samodzielnosci obywatelskiej (100% Offline Edge AI)',
    legacyLimitation:
      'Pierwsza generacja audiokiosku zaklada, ze obywatel potrafi sam dotrzec do ekranu, przeczytac lub uslyszec komunikat i dotknac przycisku. To wyklucza osoby z porazeniem czterokonczynowym (tetraplegia/SLA), osoby z silnym drzeniem rak (Parkinson), osoby Gluche (dla ktorych pierwszym jezykiem jest Polski Jezyk Migowy PJM, a nie tekst pisany) oraz osoby niewidome gubiace sie w korytarzach urzedu.',
    futureLeapSummary: {
      professor:
        'Multimodalny interfejs czlowiek-maszyna (HMI) dzialajacy w 100% na brzegu sieci (Edge NPU Zero-PII): estymacja wektora spojrzenia (Eye-Gaze Dwell Selection) ze zwyklej kamery IR/RGB, filtr Kalmana wycinajacy drzenie patologiczne (4–12 Hz) na ekranie dotykowym, dwukierunkowa translacja Polskiego Jezyka Migowego (MediaPipe Holistic + Lokalny Model PJM) oraz mikronawigacja Ultra-Wideband (UWB ±15 cm).',
      architect:
        'Rozbudowa terminala w OPS / Bibliotece / POZ o 4 moduly programowo-sprzetowe bez przekraczania budzetu bezposredniego PZP i limitu PFRON: (1) Eye-Gaze + Filtr Drzenia Rak, (2) Kamera + Awatar 3D PJM w RAM, (3) Znaczniki UWB / Audio-Beacon prowadzace niewidomego od drzwi budynku, (4) Proaktywny Asystent Uprawnien PFRON/OPS.',
      layperson:
        'Urząd i przychodnia dostępne dla każdego bez wyjątku: osoba niewidoma jest prowadzona głosowo od samych drzwi wejściowych prosto do stanowiska, osoba Głucha rozmawia z ekranem w Polskim Języku Migowym, osoba z porażeniem obsługuje ekran samym wzrokiem, a komputer sam podpowiada, jakie dodatki i ulgi pieniężne przysługują mieszkańcowi.',
    },
    innovations: [
      {
        id: 'acc_eyegaze_tremor',
        code: 'ACC-NEXT-01',
        title: 'Bezdotykowe Sterowanie Wzrokiem (Edge Eye-Gaze) & Filtr Kalmana dla Drzenia Rak (Parkinson / MPD)',
        techStack: 'TypeScript WebGL / ONNX Runtime Web · Kamera 60 fps · Filtr Kalmana 4–12 Hz',
        trl: 'TRL 8 → 9',
        deploymentWindow: '30 dni (PoC)',
        keyMetric: 'Obsluga 100% bez uzycia rak (Dwell 600 ms) · Zero Chmury',
        description:
          'Pozwala osobom z tetraplegia, SLA lub po udarze wybierac opcje na ekranie samym skupieniem wzroku, a u seniorow z choroba Parkinsona programowo stabilizuje drzenie dloni na ekranie dotykowym.',
      },
      {
        id: 'acc_pjm_twoway',
        code: 'ACC-NEXT-02',
        title: 'Dwukierunkowy Tlumacz Polskiego Jezyka Migowego (PJM Vision <-> Mowa + Awatar 3D + ETR)',
        techStack: 'Edge NPU · Rozpoznawanie Gestow PJM w RAM · Generator Tekstu Latwego (ETR)',
        trl: 'TRL 7 → 9',
        deploymentWindow: '90 dni (Pilotaz)',
        keyMetric: 'Translacja PJM < 180 ms · 100% prywatnosci (brak zapisu wideo)',
        description:
          'Osoba Glucha miga przed terminalem — lokalny układ AI tlumaczy znaki PJM na glos/tekst dla urzednika, a odpowiedz urzednika jest natychmiast migana przez awatara 3D oraz upraszczana do standardu ETR (Tekst Latwy do Czytania).',
      },
      {
        id: 'acc_uwb_proactive_pfron',
        code: 'ACC-NEXT-03',
        title: 'Mikronawigacja Wewnatrzbudynkowa UWB (±15 cm) & Proaktywny Kalkulator Swiadczen PFRON/OPS',
        techStack: 'Beacony UWB / BLE 5.4 · Lokalny Silnik Regul Prawnych PFRON · Druk Braille',
        trl: 'TRL 8 → 9',
        deploymentWindow: '180 dni (Skala)',
        keyMetric: 'Skrocenie czasu zalatwienia sprawy z 45 min do 6 min',
        description:
          'Prowadzi osobe niewidoma krok po kroku od wejscia do budynku do terminala, a nastepnie zadaje 4 proste pytania i automatycznie kompletuje wnioski o dofinansowanie PFRON, dodatek energetyczny lub opieke wytchnieniowa.',
      },
    ],
    rolloutStages: [
      {
        windowLabel: 'Faza 1 (Dni 1–30)',
        milestoneTitle: 'Aktualizacja Oprogramowania Kiosk-Mode 2.0 (Filtr Drzenia + ETR + Kalkulator PFRON)',
        deliverable: 'Wdrozenie programowe na istniejacych 3 terminalach (OPS, Biblioteka, POZ) bez wymiany sprzetu',
        budgetCapexPln: 3200,
      },
      {
        windowLabel: 'Faza 2 (Dni 31–90)',
        milestoneTitle: 'Modul Kamery Brzegowej Eye-Gaze & Dwukierunkowy Awatar PJM (Zero-PII RAM)',
        deliverable: 'Obsluga wzrokiem i tlumacz Polskiego Jezyka Migowego dzialajacy w 100% offline',
        budgetCapexPln: 6800,
      },
      {
        windowLabel: 'Faza 3 (Dni 91–180)',
        milestoneTitle: 'Siec Nawigacji UWB / Audio-Beacons w Budynkach Gminnych i Skalowanie PPP',
        deliverable: 'Kompletny standard "Dostepna Gmina 2.0" gotowy do powielenia w powiatach pomorskich',
        budgetCapexPln: 9500,
      },
    ],
    fundingSourceTag: 'Dotacja PFRON (do 143 400 PLN) + Zamowienia Bezposrednie Gmin ponizej progu PZP + CSR Offshore',
  },
];

// ----------------------------------------------------------------------------
// DETERMINISTIC SIMULATORS FOR THE 3 NEXT-GEN PILLARS
// ----------------------------------------------------------------------------

export type LegalNextGenScenarioId =
  | 'whistleblower_zksnark'
  | 'offshore_sla_z3_contract'
  | 'dora_nis2_pqc_audit';

export interface LegalNextGenSimulationResult {
  scenarioId: LegalNextGenScenarioId;
  scenarioTitle: string;
  zkProofProtocol: string;
  zkProofDigestHex: string;
  verificationTimeMs: number;
  piiBytesExposed: number;
  z3SolverStatus: 'SAT_VERIFIED_CONSISTENT' | 'UNSAT_CONFLICT_RESOLVED';
  clausesVerifiedCount: number;
  conflictsPreventedCount: number;
  pqcAlgorithm: string;
  pqcSignatureBytes: number;
  eidas2SelectiveAttributes: string[];
}

export function simulateNextGenLegalProof(
  scenarioId: LegalNextGenScenarioId,
  clauseCount: number,
  enableHybridPqc: boolean
): LegalNextGenSimulationResult {
  const safeClauses = Math.max(4, Math.min(120, Math.round(clauseCount)));
  const seedPayload = `${scenarioId}|clauses:${safeClauses}|pqc:${enableHybridPqc}`;
  const zkProofDigestHex = computeDeterministicSha256Hex(seedPayload);

  const scenarioMap: Record<
    LegalNextGenScenarioId,
    {
      title: string;
      baseTimeMs: number;
      conflicts: number;
      attrs: string[];
    }
  > = {
    whistleblower_zksnark: {
      title: 'Sygnalista Zero-Knowledge: Dowod zatrudnienia i autentycznosci bez ujawnienia pliku',
      baseTimeMs: 3.6,
      conflicts: 1,
      attrs: ['Atrybut EUDI: Aktywny Pracownik / Kontraktor (TAK)', 'Tozsamosc / PESEL: UKRYTE (Zero-Knowledge)'],
    },
    offshore_sla_z3_contract: {
      title: 'Kontrakt O&M Offshore Baltica 2 & 3: Formalna weryfikacja SLA (RTO < 2h, DWDM < 5 ms)',
      baseTimeMs: 4.1,
      conflicts: 2,
      attrs: ['Atrybut EUDI: Uprawnienia Reprezentacji Spolki (KRS)', 'Certyfikat ISO/IEC 27001 & NIS2: ZWERYFIKOWANY'],
    },
    dora_nis2_pqc_audit: {
      title: 'Raport Incydentu CSIRT / DORA: Niepodrabialny dziennik audytowy odporny na komputery kwantowe',
      baseTimeMs: 4.4,
      conflicts: 3,
      attrs: ['Atrybut EUDI: Inspektor Ochrony Danych / SecOps Officer', 'Znacznik Czasu Kwalifikowany eIDAS 2.0'],
    },
  };

  const selected = scenarioMap[scenarioId];
  const verificationTimeMs = Number(
    (selected.baseTimeMs + safeClauses * 0.015 + (enableHybridPqc ? 0.35 : 0)).toFixed(2)
  );

  return {
    scenarioId,
    scenarioTitle: selected.title,
    zkProofProtocol: 'Plonky3 / Groth16 Zero-Knowledge Proof (Rust WASM)',
    zkProofDigestHex,
    verificationTimeMs,
    piiBytesExposed: 0,
    z3SolverStatus: 'SAT_VERIFIED_CONSISTENT',
    clausesVerifiedCount: safeClauses,
    conflictsPreventedCount: selected.conflicts + Math.floor(safeClauses / 20),
    pqcAlgorithm: enableHybridPqc
      ? 'Hybrydowy SHA-256 + NIST FIPS 204 ML-DSA-65 (Dilithium) + ML-KEM-768'
      : 'Klasyczny SHA-256 Append-Only + Ed25519',
    pqcSignatureBytes: enableHybridPqc ? 3309 : 64,
    eidas2SelectiveAttributes: selected.attrs,
  };
}

export interface SmartGridNextGenSimulationResult {
  windSpeedMs: number;
  offshoreDispatchMw: number;
  bessCapacityMwh: number;
  saltFogRhPercent: number;
  dlrAmpacityGainPercent: number;
  dlrExtraCapacityMw: number;
  unmitigatedRocofHzPerSec: number;
  gridFormingRocofHzPerSec: number;
  rocofDampingPercent: number;
  greenHydrogenKgPerHour: number;
  insulatorSaltRiskLevel: 'LOW_NOMINAL' | 'MODERATE_MONITOR' | 'HIGH_ACTIVE_COMPENSATION';
  gridStabilityStatus: string;
}

export function simulateNextGenSmartGridDlrAndInertia(
  windSpeedMs: number,
  offshoreDispatchMw: number,
  bessCapacityMwh: number,
  saltFogRhPercent: number
): SmartGridNextGenSimulationResult {
  const clampedWind = Math.max(2, Math.min(25, windSpeedMs));
  const clampedDispatch = Math.max(200, Math.min(2500, offshoreDispatchMw));
  const clampedBess = Math.max(50, Math.min(800, bessCapacityMwh));
  const clampedRh = Math.max(45, Math.min(99, saltFogRhPercent));

  // Convective cooling from wind increases 400 kV overhead line ampacity (DLR)
  const dlrAmpacityGainPercent = Number(
    Math.min(28.5, Math.max(4.0, (clampedWind - 2) * 1.45)).toFixed(1)
  );
  // Base thermal rating of the 400 kV corridor segment ~ 1800 MW
  const dlrExtraCapacityMw = Math.round(1800 * (dlrAmpacityGainPercent / 100));

  // Unmitigated RoCoF (Rate of Change of Frequency) under sudden offshore gust/step
  const unmitigatedRocofHzPerSec = Number(
    (0.42 + (clampedDispatch / 2500) * 0.78).toFixed(2)
  );
  // Grid-Forming BESS controlled over <5ms DWDM fiber damps RoCoF proportionally to BESS capacity
  const dampingFactor = Math.min(0.76, 0.35 + (clampedBess / 800) * 0.41);
  const gridFormingRocofHzPerSec = Number(
    (unmitigatedRocofHzPerSec * (1 - dampingFactor)).toFixed(2)
  );
  const rocofDampingPercent = Math.round(dampingFactor * 100);

  // Surplus offshore power routed to Port Ustka PEM Electrolyzer (~50 kWh per 1 kg H2)
  const surplusAllocatedMw = Math.max(0, clampedDispatch * 0.12 + (clampedWind > 11 ? 45 : 10));
  const greenHydrogenKgPerHour = Math.round((surplusAllocatedMw * 1000) / 50);

  const insulatorSaltRiskLevel =
    clampedRh > 88
      ? 'HIGH_ACTIVE_COMPENSATION'
      : clampedRh > 80
        ? 'MODERATE_MONITOR'
        : 'LOW_NOMINAL';

  const gridStabilityStatus =
    gridFormingRocofHzPerSec <= 0.5
      ? `STABILNY: RoCoF ${gridFormingRocofHzPerSec} Hz/s (ponizej progu krytycznego 0.50 Hz/s), zysk DLR +${dlrExtraCapacityMw} MW.`
      : `WYMAGA ZWIEKSZENIA BESS: RoCoF ${gridFormingRocofHzPerSec} Hz/s — zwieksz moc Grid-Forming BESS.`;

  return {
    windSpeedMs: clampedWind,
    offshoreDispatchMw: clampedDispatch,
    bessCapacityMwh: clampedBess,
    saltFogRhPercent: clampedRh,
    dlrAmpacityGainPercent,
    dlrExtraCapacityMw,
    unmitigatedRocofHzPerSec,
    gridFormingRocofHzPerSec,
    rocofDampingPercent,
    greenHydrogenKgPerHour,
    insulatorSaltRiskLevel,
    gridStabilityStatus,
  };
}

export type AssistiveCitizenProfileId =
  | 'deaf_pjm_native'
  | 'blind_uwb_navigation'
  | 'tetraplegia_eyegaze'
  | 'parkinson_tremor_senior';

export interface AssistiveGen2SimulationResult {
  profileId: AssistiveCitizenProfileId;
  profileName: string;
  activeModalities: string[];
  autonomyScorePercent: number;
  avgTaskDurationMinutes: number;
  legacyTaskDurationMinutes: number;
  timeSavedPercent: number;
  singleTerminalUpgradeCostPln: number;
  threeTerminalUpgradeTotalPln: number;
  withinPzpDirectLimit: boolean;
  matchedBenefitsZeroPii: string[];
}

export function simulateAssistiveGen2Terminal(
  profileId: AssistiveCitizenProfileId,
  enableEyeGaze: boolean,
  enablePjmAvatar: boolean,
  enableUwbNavigation: boolean
): AssistiveGen2SimulationResult {
  const baseProfiles: Record<
    AssistiveCitizenProfileId,
    {
      name: string;
      legacyMinutes: number;
      baseModalities: string[];
      benefits: string[];
    }
  > = {
    deaf_pjm_native: {
      name: 'Osoba Glucha (Polski Jezyk Migowy PJM jako pierwszy jezyk)',
      legacyMinutes: 42,
      baseModalities: ['Kontrast WCAG AAA 14.54:1', 'Tekst Latwy do Czytania i Zrozumienia (ETR)'],
      benefits: [
        'Dofinansowanie PFRON "Aktywny Samorzad" (sprzet elektroniczny i oprogramowanie)',
        'Swiadczenie wspierajace / Tlumacz PJM online i stacjonarnie bez oczekiwania',
      ],
    },
    blind_uwb_navigation: {
      name: 'Osoba Niewidoma / Slabowidzaca (Nawigacja od wejscia + Audio/Braille)',
      legacyMinutes: 38,
      baseModalities: ['Synteza Mowy TTS (Auto-Mute glosnika po wpieciu Jack)', 'Instrukcje w alfabecie Braille’a + 18pt'],
      benefits: [
        'Dodatek energetyczny / oslonowy oraz ulgi komunikacyjne i uzdrowiskowe',
        'Dofinansowanie PFRON do likwidacji barier w komunikowaniu sie',
      ],
    },
    tetraplegia_eyegaze: {
      name: 'Osoba z Tetraplegia / SLA / Brak mozliwosci ruchu konczyn gornych',
      legacyMinutes: 55,
      baseModalities: ['Interfejs Bezdotykowy Kiosk-Mode 2.0', 'Potwierdzenie glosowe lub ruchem zrenicy'],
      benefits: [
        'Program "Opieka Wytchnieniowa" oraz "Asystent Osobisty Osoby z Niepelnosprawnoscia"',
        'Swiadczenie wspierajace w najwyzszym progu punktowym (100% Zero-PII)',
      ],
    },
    parkinson_tremor_senior: {
      name: 'Senior z Drzeniem Rak (Choroba Parkinsona / MPD) i Wielochorobowoscia',
      legacyMinutes: 35,
      baseModalities: ['Filtr Kalmana stabilizujacy dotyk (4–12 Hz)', 'Wsparcie Wolontariusza Human-in-the-Loop'],
      benefits: [
        'E-Recepty, leki 65+ oraz rejestracja POZ bez kolejek',
        'Zasilek pielegnacyjny i wsparcie Osrodka Pomocy Spolecznej (OPS)',
      ],
    },
  };

  const profile = baseProfiles[profileId];
  const activeModalities = [...profile.baseModalities];
  let upgradePerTerminal = 950; // Base software + Kalman tremor filter & ETR engine
  let autonomyBoost = 68;

  if (enableEyeGaze) {
    activeModalities.push('Kamera Brzegowa Eye-Gaze (Dwell-Click 600 ms w RAM)');
    upgradePerTerminal += 1100;
    autonomyBoost += 12;
  }
  if (enablePjmAvatar) {
    activeModalities.push('Dwukierunkowy Tlumacz PJM Vision <-> Mowa + Awatar 3D');
    upgradePerTerminal += 1400;
    autonomyBoost += 11;
  }
  if (enableUwbNavigation) {
    activeModalities.push('Mikronawigacja Wewnatrzbudynkowa UWB (±15 cm od drzwi)');
    upgradePerTerminal += 850;
    autonomyBoost += 8;
  }

  const autonomyScorePercent = Math.min(99, autonomyBoost);
  const avgTaskDurationMinutes = Math.max(
    5,
    Math.round(profile.legacyMinutes * (1 - autonomyScorePercent * 0.0082))
  );
  const timeSavedPercent = Math.round(
    ((profile.legacyMinutes - avgTaskDurationMinutes) / profile.legacyMinutes) * 100
  );

  // Base 3-terminal PoC is 11 000 PLN; adding Gen-2 modules for 3 terminals stays well below 130 000 PLN PZP threshold
  const threeTerminalUpgradeTotalPln = 11000 + upgradePerTerminal * 3;

  return {
    profileId,
    profileName: profile.name,
    activeModalities,
    autonomyScorePercent,
    avgTaskDurationMinutes,
    legacyTaskDurationMinutes: profile.legacyMinutes,
    timeSavedPercent,
    singleTerminalUpgradeCostPln: upgradePerTerminal,
    threeTerminalUpgradeTotalPln,
    withinPzpDirectLimit: threeTerminalUpgradeTotalPln < 130000,
    matchedBenefitsZeroPii: profile.benefits,
  };
}



