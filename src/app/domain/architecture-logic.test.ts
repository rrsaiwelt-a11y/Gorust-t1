import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANTI_GRAVITY_HARDWARE_UNITS,
  INITIAL_CORRIDOR_NODES,
  calculateAntiGravityPowerBudget,
  calculateGovTechPoCBudget,
  calculateWcagContrastRatio,
  computeDeterministicSha256Hex,
  sanitizeAndCreateAuditBlock,
  simulateFinancialArchitecture,
  validateTelemetryReading,
} from './architecture-logic';

test('WCAG 2.1 AAA contrast ratio for #130E17 and #D8ED00 exceeds 7:1 threshold', () => {
  const ratio = calculateWcagContrastRatio('#130E17', '#D8ED00');
  assert.equal(ratio >= 7.0, true, `Expected contrast >= 7.0, got ${ratio}`);
  assert.equal(ratio > 14.0, true);
});

test('GovTech PoC budget matches exact documented 11 000 PLN breakdown below PZP limit', () => {
  const budget = calculateGovTechPoCBudget(3, 10);
  assert.equal(budget.hardwareTotalPln, 6600);
  assert.equal(budget.softwareSecurityPln, 1900);
  assert.equal(budget.deploymentBrailleVolunteersPln, 2500);
  assert.equal(budget.totalGrossPln, 11000);
  assert.equal(budget.belowPzpThreshold, true);
});

test('Smart Grid AQI/dCi validation compensates RH > 85% and detects Flatline Faults', () => {
  const ustkaNode = INITIAL_CORRIDOR_NODES[0]; // RH = 89% (> 85%), DWDM = 3.84 ms
  const ustkaResult = validateTelemetryReading(ustkaNode);
  assert.equal(ustkaResult.humidityCorrectionApplied, true);
  assert.equal(ustkaResult.correctedPm25 < ustkaNode.rawPm25, true);
  assert.equal(ustkaResult.latencyCompliant, true);
  assert.equal(ustkaResult.status, 'CORRECTED_HUMIDITY');

  // Inject Flatline Fault (identical readings)
  const flatlineResult = validateTelemetryReading({
    ...ustkaNode,
    recentSamples: [25.0, 25.0, 25.0, 25.0],
  });
  assert.equal(flatlineResult.flatlineFaultDetected, true);
  assert.equal(flatlineResult.status, 'REJECTED_FLATLINE');
  assert.equal(flatlineResult.dCiScore < 0.3, true);
});

test('Anti-Gravity Desk stationary power equals 1000W and mobile off-grid kit achieves ~6kg & 13.7h', () => {
  const stationaryIds = ANTI_GRAVITY_HARDWARE_UNITS.filter((u) => u.defaultStationary).map((u) => u.id);
  const stationarySummary = calculateAntiGravityPowerBudget(
    ANTI_GRAVITY_HARDWARE_UNITS,
    stationaryIds,
    'stationary',
    60
  );
  assert.equal(stationarySummary.stationaryTotalWatts, 1000);

  const mobileIds = ANTI_GRAVITY_HARDWARE_UNITS.filter((u) => u.defaultMobile).map((u) => u.id);
  const mobileSummary = calculateAntiGravityPowerBudget(
    ANTI_GRAVITY_HARDWARE_UNITS,
    mobileIds,
    'mobile',
    60
  );
  assert.equal(mobileSummary.batteryCapacityWh, 340);
  assert.equal(mobileSummary.withinMobileWeightTarget, true);
  assert.equal(mobileSummary.estimatedOffGridHours, 13.7);
});

test('Financial 60/30/10 model computes 4 monthly payouts and 40% audit advance', () => {
  const result = simulateFinancialArchitecture({
    totalMonthlyHours: 160,
    b2bMarket: 'PL',
    b2bHourlyRatePln: 180,
    b2bHourlyRateEur: 75,
    eurExchangeRate: 4.3,
    slaClientsCount: 6,
    slaRatePerClientPln: 1000,
    monthlyAuditsTotalValuePln: 10000,
    taxRegime: 'ip_box_5',
    ipBoxSharePercent: 80,
    monthlyLivingAndOpsCostPln: 9000,
  });

  assert.equal(result.hoursB2B, 96);
  assert.equal(result.hoursSLA, 48);
  assert.equal(result.hoursAudits, 16);
  assert.equal(result.revenueAuditsAdvance40Pln, 4000);
  assert.equal(result.revenueAuditsSettlement60Pln, 6000);
  assert.equal(result.payoutSchedule.length, 4);
  assert.deepEqual(
    result.payoutSchedule.map((p) => p.dayOfMonth),
    [5, 10, 18, 25]
  );
});

test('Zero-Knowledge EXIF scrubber strips PII/IP and produces deterministic 64-char SHA-256 chain', () => {
  const genesisHash = computeDeterministicSha256Hex('GENESIS_POMORZE_2026');
  assert.equal(genesisHash.length, 64);

  const block = sanitizeAndCreateAuditBlock(
    1,
    'SYGNALISTA_RUST_EDGE',
    'v2.4-RODO-ART25',
    'Zgloszenie nieprawidlowosci z IP 192.168.1.105 dla PESEL 89010212345.',
    ['EXIF:GPSLatitude', 'XMP:Author', 'OLE:LastSavedBy', 'Document:Title'],
    genesisHash
  );

  assert.equal(block.payloadSummary.includes('192.168.1.105'), false);
  assert.equal(block.payloadSummary.includes('89010212345'), false);
  assert.equal(block.strippedMetadataFields.length, 3);
  assert.equal(block.sha256Hash.length, 64);
});

test('Historical corridor telemetry generator produces synchronized AQI and dCi series for all 3 nodes', async () => {
  const { generateCorridorHistoricalTelemetry } = await import('./architecture-logic');
  const series24h = generateCorridorHistoricalTelemetry(INITIAL_CORRIDOR_NODES, '24h');
  // 3 nodes * 24 hours = 72 points
  assert.equal(series24h.length, 72);

  const ustkaPoints = series24h.filter((p) => p.nodeId === 'ustka');
  const slupskPoints = series24h.filter((p) => p.nodeId === 'slupsk');
  const trojmiastoPoints = series24h.filter((p) => p.nodeId === 'trojmiasto');
  assert.equal(ustkaPoints.length, 24);
  assert.equal(slupskPoints.length, 24);
  assert.equal(trojmiastoPoints.length, 24);

  // Verify historical flatline drill at step 10 on Ustka and live synchronization on last point
  const flatlinePoint = ustkaPoints.find((p) => p.stepIndex === 10);
  assert.equal(flatlinePoint?.anomalyEvent, 'FLATLINE_DETECTED');
  assert.equal(flatlinePoint?.dCiScore, 0.18);

  const lastUstka = ustkaPoints[ustkaPoints.length - 1];
  assert.equal(lastUstka.rawPm25, INITIAL_CORRIDOR_NODES[0].rawPm25);
  assert.equal(lastUstka.anomalyEvent, 'HUMIDITY_CORRECTION');
});

test('Project diagrams are partitioned into two folders (Experts vs Reviewers/Recipients) and roadmap impact calculates accurately', async () => {
  const {
    PROJECT_DIAGRAMS_CATALOG,
    FUTURE_EXPANSION_ROADMAP,
    calculateRoadmapExpansionImpact,
  } = await import('./architecture-logic');

  const expertDiagrams = PROJECT_DIAGRAMS_CATALOG.filter(
    (d) => d.folderId === 'experts_architects_secops_smartgrid'
  );
  const publicDiagrams = PROJECT_DIAGRAMS_CATALOG.filter(
    (d) => d.folderId === 'reviewers_commentators_recipients'
  );

  assert.equal(expertDiagrams.length, 4);
  assert.equal(publicDiagrams.length, 4);
  assert.equal(
    expertDiagrams.every((d) =>
      d.folderPath.startsWith('/docs/diagramy/01-eksperci-architekci-secops-smartgrid/')
    ),
    true
  );
  assert.equal(
    publicDiagrams.every((d) =>
      d.folderPath.startsWith('/docs/diagramy/02-odbiorcy-komentujacy-interesariusze/')
    ),
    true
  );

  const allExpansionIds = FUTURE_EXPANSION_ROADMAP.map((m) => m.id);
  const impact = calculateRoadmapExpansionImpact(allExpansionIds);
  assert.equal(impact.selectedCount, 5);
  assert.equal(impact.totalCapexPln, 405000);
  assert.equal(impact.projectedAdditionalMrrPln, 60500);
  assert.equal(impact.totalNewNodesAndMunicipalities, 115);
  assert.equal(impact.fePomorzaGrantCoveragePln, 324000);
});

test('Next-Gen 3 Pillars (Legal Tech 2.0, Smart Grid 2.0, Accessibility 2.0) simulators compute deterministic metrics', async () => {
  const {
    NEXT_GEN_THREE_PILLARS,
    simulateNextGenLegalProof,
    simulateNextGenSmartGridDlrAndInertia,
    simulateAssistiveGen2Terminal,
  } = await import('./architecture-logic');

  assert.equal(NEXT_GEN_THREE_PILLARS.length, 3);

  const legalSim = simulateNextGenLegalProof('whistleblower_zksnark', 40, true);
  assert.equal(legalSim.piiBytesExposed, 0);
  assert.equal(legalSim.z3SolverStatus, 'SAT_VERIFIED_CONSISTENT');
  assert.equal(legalSim.zkProofDigestHex.length, 64);
  assert.equal(legalSim.pqcSignatureBytes, 3309);

  const gridSim = simulateNextGenSmartGridDlrAndInertia(15, 2000, 500, 90);
  assert.equal(gridSim.dlrExtraCapacityMw > 250, true);
  assert.equal(gridSim.gridFormingRocofHzPerSec < gridSim.unmitigatedRocofHzPerSec, true);
  assert.equal(gridSim.greenHydrogenKgPerHour > 1000, true);
  assert.equal(gridSim.insulatorSaltRiskLevel, 'HIGH_ACTIVE_COMPENSATION');

  const accSim = simulateAssistiveGen2Terminal('tetraplegia_eyegaze', true, true, true);
  assert.equal(accSim.autonomyScorePercent >= 95, true);
  assert.equal(accSim.avgTaskDurationMinutes < accSim.legacyTaskDurationMinutes, true);
  assert.equal(accSim.withinPzpDirectLimit, true);
});



