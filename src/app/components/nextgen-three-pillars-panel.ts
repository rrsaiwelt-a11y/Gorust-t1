import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  AssistiveCitizenProfileId,
  AudienceLevel,
  LegalNextGenScenarioId,
  NEXT_GEN_THREE_PILLARS,
  NextGenPillarBlueprint,
  NextGenPillarId,
  simulateAssistiveGen2Terminal,
  simulateNextGenLegalProof,
  simulateNextGenSmartGridDlrAndInertia,
} from '../domain/architecture-logic';

@Component({
  selector: 'app-nextgen-three-pillars-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DecimalPipe],
  template: `
    <section
      id="sekcja-nextgen-trzy-drogi"
      class="space-y-8"
      aria-labelledby="heading-nextgen-pillars"
    >
      <!-- Section Header -->
      <div
        class="p-6 sm:p-8 rounded-2xl border transition-colors"
        [class.bg-[#111927]]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-2 max-w-4xl">
            <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono uppercase tracking-wider"
              [class.text-emerald-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              <span>Architektura Wyprzedzajaca Czas (Horyzont 2027–2032)</span>
              <span aria-hidden="true">·</span>
              <span>3 Glowne Drogi Rozwoju gotowe do wdrozenia fazowego (30 / 90 / 180 dni)</span>
            </div>
            <h2
              id="heading-nextgen-pillars"
              class="text-2xl sm:text-3xl font-bold tracking-tight"
              [class.text-slate-50]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              Rozbudowa 3 Glownych Drog Projektu: Legal Tech 2.0, Smart Grid 2.0 &amp; Asystywna Dostepnosc 2.0
            </h2>
            <p
              class="text-sm leading-relaxed"
              [class.text-slate-300]="!highContrast()"
              [class.text-white]="highContrast()"
            >
              Ponizsza architektura eliminuje ograniczenia klasycznych rozwiazan z lat 2024–2026 i wprowadza
              <strong>technologie wyprzedzajace czas</strong>, ktore mozna wdrazac natychmiast na obecnej infrastrukturze:
              <strong>(1) Legal Tech</strong> z dowodami zerowej wiedzy <code>zk-SNARKs</code>, formalnym solverem matematycznym
              <code>Z3 SMT</code> i kryptografia post-kwantowa <code>ML-DSA-65</code>,
              <strong>(2) Smart Grid</strong> z wirtualna inercja <code>Grid-Forming BESS</code> po swiatlowodzie DWDM
              (<code>3.84 ms</code>), dynamiczna obciazalnoscia linii <code>DLR 400 kV</code> i elektroliza zielonego wodoru
              <code>H2</code> w Ustce, oraz
              <strong>(3) Pomoc Osobom z Niepelnosprawnosciami</strong> ze sterowaniem wzrokiem <code>Eye-Gaze</code>,
              dwukierunkowym tlumaczem Polskiego Jezyka Migowego <code>PJM Vision</code> i mikronawigacja <code>UWB ±15 cm</code>.
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <button
              type="button"
              (click)="narrateActivePillar()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap"
              [class.bg-slate-800]="!highContrast()"
              [class.text-slate-100]="!highContrast()"
              [class.border-slate-700]="!highContrast()"
              [class.hover:bg-slate-700]="!highContrast()"
              [class.bg-[#D8ED00]]="highContrast()"
              [class.text-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <mat-icon class="!w-4 !h-4 !text-[16px]">record_voice_over</mat-icon>
              <span>Odsłuchaj opis wybranej drogi (TTS)</span>
            </button>
          </div>
        </div>

        <!-- 3 Pillar Selector Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          @for (pillar of pillars; track pillar.id) {
            @let isActive = activePillarId() === pillar.id;
            <button
              type="button"
              (click)="selectPillar(pillar.id)"
              class="text-left p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3"
              [class.bg-slate-800/90]="!highContrast() && isActive"
              [class.border-[#D8ED00]]="isActive"
              [class.bg-slate-900/60]="!highContrast() && !isActive"
              [class.border-slate-800]="!highContrast() && !isActive"
              [class.bg-[#D8ED00]]="highContrast() && isActive"
              [class.text-[#130E17]]="highContrast() && isActive"
              [class.bg-[#130E17]]="highContrast() && !isActive"
            >
              <div class="space-y-1.5">
                <div class="flex items-center justify-between gap-2 text-xs font-mono">
                  <span
                    class="font-bold"
                    [class.text-[#D8ED00]]="!highContrast() && isActive"
                    [class.text-sky-400]="!highContrast() && !isActive"
                  >
                    {{ pillar.pillarNumber }}
                  </span>
                  <span class="font-mono text-xs opacity-80">3 Moduly + Symulator</span>
                </div>
                <h3 class="text-base font-bold leading-snug">
                  {{ pillar.title }}
                </h3>
                <p class="text-xs leading-relaxed opacity-85">
                  {{ pillar.subtitle }}
                </p>
              </div>
              <div class="pt-2 border-t border-white/10 text-xs font-mono flex items-center justify-between">
                <span>Wdrozenie: 30 / 90 / 180 dni</span>
                <span class="font-bold">Aktywuj laboratorum →</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Active Pillar Deep-Dive Architecture + Rollout Plan -->
      @let current = activePillar();
      <div
        class="p-6 sm:p-8 rounded-2xl border space-y-6"
        [class.bg-[#111927]]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
      >
        <!-- Contrast: Legacy Limitation vs Next-Gen Leap -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            class="p-4 rounded-xl border space-y-1.5"
            [class.bg-slate-950/70]="!highContrast()"
            [class.border-slate-800]="!highContrast()"
            [class.bg-[#130E17]]="highContrast()"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <p class="text-xs font-mono uppercase tracking-wider text-amber-400">
              Dlaczego dotychczasowe podejscie (Generacja 1.0) przestaje wystarczac?
            </p>
            <p class="text-xs sm:text-sm leading-relaxed" [class.text-slate-300]="!highContrast()">
              {{ current.legacyLimitation }}
            </p>
          </div>

          <div
            class="p-4 rounded-xl border space-y-1.5"
            [class.bg-slate-950/70]="!highContrast()"
            [class.border-emerald-500/40]="!highContrast()"
            [class.bg-[#130E17]]="highContrast()"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <p
              class="text-xs font-mono uppercase tracking-wider"
              [class.text-emerald-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              Skok Architektoniczny Generacji 2.0 (Perspektywa: {{ audience() }})
            </p>
            <p class="text-xs sm:text-sm leading-relaxed" [class.text-slate-100]="!highContrast()">
              {{ getPillarSummary(current) }}
            </p>
          </div>
        </div>

        <!-- 3 Core Next-Gen Innovations in Active Pillar -->
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-lg font-bold">
              3 Innowacje Wyprzedzajace Czas w ramach {{ current.pillarNumber }}
            </h3>
            <span class="text-xs font-mono opacity-80">Finansowanie: {{ current.fundingSourceTag }}</span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            @for (node of current.innovations; track node.id) {
              <article
                class="p-5 rounded-xl border flex flex-col justify-between gap-4"
                [class.bg-slate-900/90]="!highContrast()"
                [class.border-slate-800]="!highContrast()"
                [class.bg-[#130E17]]="highContrast()"
                [class.border-[#D8ED00]]="highContrast()"
              >
                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-2 text-xs font-mono">
                    <span
                      class="font-bold"
                      [class.text-sky-400]="!highContrast()"
                      [class.text-[#D8ED00]]="highContrast()"
                    >
                      {{ node.code }} · {{ node.trl }}
                    </span>
                    <span
                      class="font-semibold"
                      [class.text-emerald-400]="!highContrast()"
                      [class.text-white]="highContrast()"
                    >
                      {{ node.deploymentWindow }}
                    </span>
                  </div>

                  <h4 class="text-base font-bold leading-snug">
                    {{ node.title }}
                  </h4>

                  <p class="text-xs font-mono opacity-80">
                    Stos: {{ node.techStack }}
                  </p>

                  <p
                    class="text-xs leading-relaxed pt-1"
                    [class.text-slate-300]="!highContrast()"
                    [class.text-white]="highContrast()"
                  >
                    {{ node.description }}
                  </p>
                </div>

                <div
                  class="pt-3 border-t text-xs font-mono font-semibold tabular-nums flex items-center gap-2"
                  [class.border-slate-800]="!highContrast()"
                  [class.text-[#D8ED00]]="true"
                >
                  <mat-icon class="!w-4 !h-4 !text-[16px]">bolt</mat-icon>
                  <span>{{ node.keyMetric }}</span>
                </div>
              </article>
            }
          </div>
        </div>

        <!-- 30 / 90 / 180 Day Actionable Implementation Plan -->
        <div class="space-y-3 pt-2">
          <h4 class="text-xs font-mono uppercase tracking-wider opacity-80">
            Harmonogram Realnego Wprowadzenia na Rynek (Plan 30 / 90 / 180 Dni)
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (stage of current.rolloutStages; track stage.windowLabel) {
              <div
                class="p-4 rounded-xl border space-y-1.5"
                [class.bg-slate-950/60]="!highContrast()"
                [class.border-slate-800]="!highContrast()"
                [class.bg-[#130E17]]="highContrast()"
                [class.border-[#D8ED00]]="highContrast()"
              >
                <div class="flex items-center justify-between text-xs font-mono">
                  <span
                    class="font-bold"
                    [class.text-emerald-400]="!highContrast()"
                    [class.text-[#D8ED00]]="highContrast()"
                  >
                    {{ stage.windowLabel }}
                  </span>
                  <span class="tabular-nums font-semibold">
                    CAPEX: {{ stage.budgetCapexPln | number:'1.0-0' }} PLN
                  </span>
                </div>
                <p class="text-sm font-bold">{{ stage.milestoneTitle }}</p>
                <p class="text-xs opacity-85 leading-relaxed">{{ stage.deliverable }}</p>
              </div>
            }
          </div>
        </div>

        <!-- INTERACTIVE SIMULATOR FOR THE ACTIVE PILLAR -->
        @switch (activePillarId()) {
          @case ('legaltech_nextgen') {
            @let sim = legalSimResult();
            <div
              class="p-5 sm:p-6 rounded-xl border space-y-5"
              [class.bg-slate-950/90]="!highContrast()"
              [class.border-sky-500/40]="!highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span class="text-xs font-mono uppercase text-sky-400">
                    Interaktywny Symulator Drogi 01 · Computational Law &amp; Zero-Knowledge
                  </span>
                  <h4 class="text-lg font-bold">
                    Generator Dowodu zk-SNARKs (Plonky3), Weryfikator Klauzul Z3 SMT &amp; Podpis Post-Kwantowy NIST
                  </h4>
                </div>
                <span class="text-xs font-mono tabular-nums text-emerald-400">
                  Czas weryfikacji: {{ sim.verificationTimeMs }} ms · Ujawnione PII: {{ sim.piiBytesExposed }} B
                </span>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                  <label for="legal-nextgen-scenario" class="block text-xs font-mono opacity-85">
                    Scenariusz prawny / audytowy
                  </label>
                  <select
                    id="legal-nextgen-scenario"
                    [value]="legalScenario()"
                    (change)="setLegalScenario($any($event.target).value)"
                    class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="whistleblower_zksnark">
                      Sygnalista zk-SNARK (Dowod zatrudnienia bez ujawnienia pliku)
                    </option>
                    <option value="offshore_sla_z3_contract">
                      Kontrakt O&amp;M Offshore Baltica 2 &amp; 3 (Weryfikacja Z3 SLA RTO &lt; 2h)
                    </option>
                    <option value="dora_nis2_pqc_audit">
                      Raport CSIRT / DORA / NIS2 z podpisem post-kwantowym ML-DSA-65
                    </option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label for="legal-clauses-range" class="block text-xs font-mono opacity-85">
                    Liczba klauzul weryfikowanych przez Z3 SMT Solver: <strong class="tabular-nums">{{ legalClauseCount() }}</strong>
                  </label>
                  <input
                    id="legal-clauses-range"
                    type="range"
                    min="8"
                    max="96"
                    step="4"
                    [value]="legalClauseCount()"
                    (input)="setLegalClauseCount(+$any($event.target).value)"
                    class="w-full accent-[#D8ED00] cursor-pointer"
                  />
                </div>

                <div class="flex items-end">
                  <button
                    type="button"
                    (click)="toggleHybridPqc()"
                    class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border cursor-pointer"
                    [class.bg-emerald-500/20]="legalHybridPqc()"
                    [class.border-emerald-400]="legalHybridPqc()"
                    [class.text-emerald-300]="legalHybridPqc()"
                    [class.bg-slate-900]="!legalHybridPqc()"
                    [class.border-slate-700]="!legalHybridPqc()"
                  >
                    <mat-icon class="!w-4 !h-4 !text-[16px]">security</mat-icon>
                    <span>
                      {{ legalHybridPqc() ? 'Kryptografia Post-Kwantowa ML-DSA-65: AKTYWNA' : 'Wlacz Podpis Post-Kwantowy ML-DSA-65' }}
                    </span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Status Solvera Z3 SMT</span>
                  <p class="text-sm font-bold font-mono text-emerald-400">{{ sim.z3SolverStatus }}</p>
                  <p class="text-xs text-slate-300">
                    Zweryfikowano {{ sim.clausesVerifiedCount }} klauzul · Wyeliminowano {{ sim.conflictsPreventedCount }} kolizje logiczne
                  </p>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Dowod Zerowej Wiedzy (zk-SNARK)</span>
                  <p class="text-xs font-mono text-[#D8ED00] truncate" [title]="sim.zkProofDigestHex">
                    zkProof: {{ sim.zkProofDigestHex.slice(0, 24) }}...
                  </p>
                  <p class="text-xs text-slate-300">{{ sim.zkProofProtocol }}</p>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Algorytm Podpisu Audytowego</span>
                  <p class="text-xs font-bold text-slate-100">{{ sim.pqcAlgorithm }}</p>
                  <p class="text-xs font-mono tabular-nums text-sky-400">Rozmiar podpisu: {{ sim.pqcSignatureBytes }} B</p>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Atrybuty eIDAS 2.0 (EUDI Wallet)</span>
                  @for (attr of sim.eidas2SelectiveAttributes; track attr) {
                    <p class="text-xs text-slate-200">· {{ attr }}</p>
                  }
                </div>
              </div>
            </div>
          }

          @case ('smartgrid_nextgen') {
            @let gridSim = smartGridSimResult();
            <div
              class="p-5 sm:p-6 rounded-xl border space-y-5"
              [class.bg-slate-950/90]="!highContrast()"
              [class.border-emerald-500/40]="!highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span class="text-xs font-mono uppercase text-emerald-400">
                    Interaktywny Symulator Drogi 02 · DLR 400 kV, Wirtualna Inercja PMU &amp; Zielony Wodor H2
                  </span>
                  <h4 class="text-lg font-bold">
                    Aktywne Sterowanie GPZ Wierzbiecino 400 kV i Morskiej Farmy Baltica 2 &amp; 3 (2.5 GW)
                  </h4>
                </div>
                <span class="text-xs font-mono text-[#D8ED00]">
                  {{ gridSim.gridStabilityStatus }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                  <label for="sg-wind-range" class="block text-xs font-mono opacity-85">
                    Predkosc wiatru w korytarzu Ustka–Slupsk: <strong class="tabular-nums">{{ sgWindSpeedMs() }} m/s</strong>
                  </label>
                  <input
                    id="sg-wind-range"
                    type="range"
                    min="4"
                    max="22"
                    step="1"
                    [value]="sgWindSpeedMs()"
                    (input)="setSgWindSpeed(+$any($event.target).value)"
                    class="w-full accent-[#D8ED00] cursor-pointer"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="sg-dispatch-range" class="block text-xs font-mono opacity-85">
                    Generacja Offshore Baltica 2 &amp; 3: <strong class="tabular-nums">{{ sgOffshoreMw() }} MW</strong>
                  </label>
                  <input
                    id="sg-dispatch-range"
                    type="range"
                    min="400"
                    max="2500"
                    step="100"
                    [value]="sgOffshoreMw()"
                    (input)="setSgOffshoreMw(+$any($event.target).value)"
                    class="w-full accent-[#D8ED00] cursor-pointer"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="sg-bess-range" class="block text-xs font-mono opacity-85">
                    Pojemnosc Grid-Forming BESS (LiFePO4): <strong class="tabular-nums">{{ sgBessMwh() }} MWh</strong>
                  </label>
                  <input
                    id="sg-bess-range"
                    type="range"
                    min="100"
                    max="800"
                    step="50"
                    [value]="sgBessMwh()"
                    (input)="setSgBessMwh(+$any($event.target).value)"
                    class="w-full accent-[#D8ED00] cursor-pointer"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Zysk Przepustowosci DLR 400 kV</span>
                  <p class="text-xl font-bold font-mono tabular-nums text-emerald-400">
                    +{{ gridSim.dlrExtraCapacityMw }} MW (+{{ gridSim.dlrAmpacityGainPercent }}%)
                  </p>
                  <p class="text-xs text-slate-300">Chlodzenie konwekcyjne przewodow NN wiatrem {{ gridSim.windSpeedMs }} m/s</p>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Tlumienie RoCoF (PMU + DWDM 3.84 ms)</span>
                  <p class="text-xl font-bold font-mono tabular-nums text-sky-400">
                    {{ gridSim.gridFormingRocofHzPerSec }} Hz/s (-{{ gridSim.rocofDampingPercent }}%)
                  </p>
                  <p class="text-xs text-slate-300">Bez Grid-Forming: {{ gridSim.unmitigatedRocofHzPerSec }} Hz/s</p>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Zielony Wodor H2 (Port Ustka O&amp;M)</span>
                  <p class="text-xl font-bold font-mono tabular-nums text-[#D8ED00]">
                    {{ gridSim.greenHydrogenKgPerHour | number:'1.0-0' }} kg H2/h
                  </p>
                  <p class="text-xs text-slate-300">Paliwo wodorowe dla statkow serwisowych CTV/SOV z nadwyzek wiatru</p>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Ochrona Izolatorow GPZ (Mgla Solna)</span>
                  <p class="text-sm font-bold font-mono text-amber-400">{{ gridSim.insulatorSaltRiskLevel }}</p>
                  <p class="text-xs text-slate-300">Fuzja danych dCi i wilgotnosci RH {{ gridSim.saltFogRhPercent }}%</p>
                </div>
              </div>
            </div>
          }

          @case ('accessibility_nextgen') {
            @let accSim = assistiveSimResult();
            <div
              class="p-5 sm:p-6 rounded-xl border space-y-5"
              [class.bg-slate-950/90]="!highContrast()"
              [class.border-[#D8ED00]/50]="!highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span class="text-xs font-mono uppercase text-[#D8ED00]">
                    Interaktywny Symulator Drogi 03 · Asystywny Terminal Generacji 2.0 (100% Zero-PII Edge AI)
                  </span>
                  <h4 class="text-lg font-bold">
                    Konfigurator Bezdotykowego Terminala (Eye-Gaze, PJM Vision, Filtr Drzenia Kalmana &amp; Nawigacja UWB)
                  </h4>
                </div>
                <span class="text-xs font-mono tabular-nums text-emerald-400">
                  Indeks Samodzielnosci: {{ accSim.autonomyScorePercent }}% · Czas wizyty: {{ accSim.avgTaskDurationMinutes }} min (zamiast {{ accSim.legacyTaskDurationMinutes }} min)
                </span>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div class="lg:col-span-2 space-y-1.5">
                  <label for="acc-profile-select" class="block text-xs font-mono opacity-85">
                    Wybierz profil potrzeb obywatela przy terminalu (OPS / Biblioteka / Przychodnia POZ)
                  </label>
                  <select
                    id="acc-profile-select"
                    [value]="assistiveProfile()"
                    (change)="setAssistiveProfile($any($event.target).value)"
                    class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="deaf_pjm_native">
                      Osoba Glucha (Polski Jezyk Migowy PJM jako pierwszy jezyk)
                    </option>
                    <option value="blind_uwb_navigation">
                      Osoba Niewidoma / Slabowidzaca (Nawigacja UWB od drzwi + Audio/Braille)
                    </option>
                    <option value="tetraplegia_eyegaze">
                      Osoba z Tetraplegia / SLA (Sterowanie samym wzrokiem Eye-Gaze)
                    </option>
                    <option value="parkinson_tremor_senior">
                      Senior z Drzeniem Rak (Choroba Parkinsona / Filtr Kalmana + ETR)
                    </option>
                  </select>
                </div>

                <div class="lg:col-span-2 flex flex-wrap items-end gap-2">
                  <button
                    type="button"
                    (click)="toggleEyeGaze()"
                    class="px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer"
                    [class.bg-emerald-500/20]="enableEyeGaze()"
                    [class.border-emerald-400]="enableEyeGaze()"
                    [class.bg-slate-900]="!enableEyeGaze()"
                    [class.border-slate-700]="!enableEyeGaze()"
                  >
                    {{ enableEyeGaze() ? '✓ Eye-Gaze (Wzrok)' : '+ Eye-Gaze (Wzrok)' }}
                  </button>
                  <button
                    type="button"
                    (click)="togglePjmAvatar()"
                    class="px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer"
                    [class.bg-emerald-500/20]="enablePjmAvatar()"
                    [class.border-emerald-400]="enablePjmAvatar()"
                    [class.bg-slate-900]="!enablePjmAvatar()"
                    [class.border-slate-700]="!enablePjmAvatar()"
                  >
                    {{ enablePjmAvatar() ? '✓ Tlumacz PJM 3D' : '+ Tlumacz PJM 3D' }}
                  </button>
                  <button
                    type="button"
                    (click)="toggleUwbNav()"
                    class="px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer"
                    [class.bg-emerald-500/20]="enableUwbNav()"
                    [class.border-emerald-400]="enableUwbNav()"
                    [class.bg-slate-900]="!enableUwbNav()"
                    [class.border-slate-700]="!enableUwbNav()"
                  >
                    {{ enableUwbNav() ? '✓ Nawigacja UWB ±15cm' : '+ Nawigacja UWB ±15cm' }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <span class="text-xs font-mono text-slate-400">Aktywne Warstwy Asystywne (Edge RAM-Only)</span>
                  <ul class="space-y-1 text-xs text-slate-200">
                    @for (mod of accSim.activeModalities; track mod) {
                      <li>· {{ mod }}</li>
                    }
                  </ul>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <span class="text-xs font-mono text-slate-400">Automatycznie Dobierane Swiadczenia (Zero-PII)</span>
                  <ul class="space-y-1 text-xs text-emerald-300">
                    @for (benefit of accSim.matchedBenefitsZeroPii; track benefit) {
                      <li>✓ {{ benefit }}</li>
                    }
                  </ul>
                </div>

                <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-xs font-mono text-slate-400">Kosztorys Rozbudowy 3 Terminali Gminnych</span>
                  <p class="text-lg font-bold font-mono tabular-nums text-[#D8ED00]">
                    {{ accSim.threeTerminalUpgradeTotalPln | number:'1.0-0' }} PLN brutto (3 pkt)
                  </p>
                  <p class="text-xs text-slate-300">
                    Upgrade 1 pkt: +{{ accSim.singleTerminalUpgradeCostPln | number:'1.0-0' }} PLN · Nadal ponizej progu PZP (130 000 PLN) i w limicie PFRON (143 400 PLN)
                  </p>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class NextGenThreePillarsPanel {
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();
  readonly speakText = output<string>();

  readonly pillars: NextGenPillarBlueprint[] = NEXT_GEN_THREE_PILLARS;
  readonly activePillarId = signal<NextGenPillarId>('legaltech_nextgen');

  // Pillar 1 simulator state
  readonly legalScenario = signal<LegalNextGenScenarioId>('whistleblower_zksnark');
  readonly legalClauseCount = signal<number>(36);
  readonly legalHybridPqc = signal<boolean>(true);

  // Pillar 2 simulator state
  readonly sgWindSpeedMs = signal<number>(14);
  readonly sgOffshoreMw = signal<number>(1800);
  readonly sgBessMwh = signal<number>(450);

  // Pillar 3 simulator state
  readonly assistiveProfile = signal<AssistiveCitizenProfileId>('deaf_pjm_native');
  readonly enableEyeGaze = signal<boolean>(true);
  readonly enablePjmAvatar = signal<boolean>(true);
  readonly enableUwbNav = signal<boolean>(true);

  readonly activePillar = computed<NextGenPillarBlueprint>(() => {
    const found = this.pillars.find((p) => p.id === this.activePillarId());
    return found ?? this.pillars[0];
  });

  readonly legalSimResult = computed(() =>
    simulateNextGenLegalProof(
      this.legalScenario(),
      this.legalClauseCount(),
      this.legalHybridPqc()
    )
  );

  readonly smartGridSimResult = computed(() =>
    simulateNextGenSmartGridDlrAndInertia(
      this.sgWindSpeedMs(),
      this.sgOffshoreMw(),
      this.sgBessMwh(),
      89
    )
  );

  readonly assistiveSimResult = computed(() =>
    simulateAssistiveGen2Terminal(
      this.assistiveProfile(),
      this.enableEyeGaze(),
      this.enablePjmAvatar(),
      this.enableUwbNav()
    )
  );

  selectPillar(id: NextGenPillarId): void {
    this.activePillarId.set(id);
  }

  getPillarSummary(pillar: NextGenPillarBlueprint): string {
    const level = this.audience();
    if (level === 'professor') {
      return pillar.futureLeapSummary.professor;
    }
    if (level === 'architect') {
      return pillar.futureLeapSummary.architect;
    }
    return pillar.futureLeapSummary.layperson;
  }

  setLegalScenario(scenario: LegalNextGenScenarioId): void {
    this.legalScenario.set(scenario);
  }

  setLegalClauseCount(count: number): void {
    this.legalClauseCount.set(count);
  }

  toggleHybridPqc(): void {
    this.legalHybridPqc.update((v) => !v);
  }

  setSgWindSpeed(wind: number): void {
    this.sgWindSpeedMs.set(wind);
  }

  setSgOffshoreMw(mw: number): void {
    this.sgOffshoreMw.set(mw);
  }

  setSgBessMwh(mwh: number): void {
    this.sgBessMwh.set(mwh);
  }

  setAssistiveProfile(profile: AssistiveCitizenProfileId): void {
    this.assistiveProfile.set(profile);
  }

  toggleEyeGaze(): void {
    this.enableEyeGaze.update((v) => !v);
  }

  togglePjmAvatar(): void {
    this.enablePjmAvatar.update((v) => !v);
  }

  toggleUwbNav(): void {
    this.enableUwbNav.update((v) => !v);
  }

  narrateActivePillar(): void {
    const p = this.activePillar();
    this.speakText.emit(
      `${p.pillarNumber}. ${p.title}. ${this.getPillarSummary(p)}`
    );
  }
}
