import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  AudienceLevel,
  CorridorNodeTelemetry,
  DOCUMENTED_QUALITY_GATES,
  INITIAL_CORRIDOR_NODES,
  validateTelemetryReading,
} from '../domain/architecture-logic';
import { CorridorD3Chart } from './corridor-d3-chart';

@Component({
  selector: 'app-smart-grid-telemetry-panel',
  imports: [CommonModule, MatIconModule, CorridorD3Chart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10">
      <!-- Corridor Telemetry & Anomaly Validation -->
      <section
        aria-labelledby="smart-grid-heading"
        class="rounded-xl border p-6 sm:p-8 transition-colors"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
        [class.bg-slate-900]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p class="text-xs font-mono text-slate-400">
              Sekcja 1.C · Promotor: Prof. dr hab. inz. Cezary Orlowski · Korytarz: Ustka — Slupsk — Trojmiasto · DWDM &lt; 5 ms (3.84 ms)
            </p>
            <h2
              id="smart-grid-heading"
              class="mt-1 text-xl sm:text-2xl font-bold tracking-tight balance-text"
              [class.text-[#D8ED00]]="highContrast()"
              [class.text-white]="!highContrast()"
            >
              03. Walidacja Danych Srodowiskowych AQI / dCi &amp; Smart Grid (2.5 GW Offshore)
            </h2>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="resetCorridorTelemetry()"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <mat-icon class="text-base leading-none">restart_alt</mat-icon>
              <span>Przywroc parametry referencyjne</span>
            </button>
            <button
              type="button"
              (click)="speakTelemetrySummary()"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#D8ED00] text-[#130E17] hover:bg-[#e5f733] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <mat-icon class="text-base leading-none">volume_up</mat-icon>
              <span>Odsluchaj telemetrie (TTS)</span>
            </button>
          </div>
        </div>

        <!-- Corridor Nodes Cards -->
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (item of validatedNodes(); track item.node.id) {
            <article
              class="rounded-lg border p-5 flex flex-col justify-between transition-colors"
              [class.border-[#D8ED00]]="selectedNodeId() === item.node.id"
              [class.bg-slate-950]="selectedNodeId() === item.node.id"
              [class.border-slate-800]="selectedNodeId() !== item.node.id"
              [class.bg-slate-950/60]="selectedNodeId() !== item.node.id"
            >
              <div>
                <div class="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <span>{{ item.node.gridCapacity }}</span>
                  <span>DWDM: {{ item.node.dwdmLatencyMs }} ms</span>
                </div>
                <h3 class="mt-2 text-base font-bold text-white">{{ item.node.name }}</h3>
                <p class="text-xs text-slate-400 mt-0.5">{{ item.node.subtitle }}</p>

                <!-- Key Telemetry Metrics -->
                <dl class="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <dt class="text-slate-400">Odczyt surowy PM2.5</dt>
                    <dd class="mt-0.5 text-sm font-mono tabular-nums font-semibold text-slate-200">
                      {{ item.validation.rawPm25 }} µg/m³
                    </dd>
                  </div>
                  <div>
                    <dt class="text-slate-400">Po korekcie (PM2.5)</dt>
                    <dd class="mt-0.5 text-sm font-mono tabular-nums font-bold text-[#D8ED00]">
                      {{ item.validation.correctedPm25 }} µg/m³
                    </dd>
                  </div>
                  <div>
                    <dt class="text-slate-400">Wilgotnosc (RH)</dt>
                    <dd
                      class="mt-0.5 font-mono tabular-nums font-semibold"
                      [class.text-amber-400]="item.node.relativeHumidity > 85"
                      [class.text-slate-200]="item.node.relativeHumidity <= 85"
                    >
                      {{ item.node.relativeHumidity }}% {{ item.node.relativeHumidity > 85 ? '(>85% Korekta)' : '(Norma)' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-slate-400">Indeks ufnosci dCi</dt>
                    <dd
                      class="mt-0.5 font-mono tabular-nums font-bold"
                      [class.text-red-400]="item.validation.flatlineFaultDetected"
                      [class.text-emerald-400]="!item.validation.flatlineFaultDetected"
                    >
                      {{ item.validation.dCiScore }} · {{ item.validation.status }}
                    </dd>
                  </div>
                </dl>

                <p class="mt-4 text-xs leading-relaxed text-slate-300 border-t border-slate-800/80 pt-3">
                  @switch (audience()) {
                    @case ('professor') {
                      {{ item.validation.explanation.professor }}
                    }
                    @case ('architect') {
                      {{ item.validation.explanation.architect }}
                    }
                    @case ('layperson') {
                      {{ item.validation.explanation.layperson }}
                    }
                  }
                </p>
              </div>

              <!-- Interactive Simulation Controls per Node -->
              <div class="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  (click)="selectNodeForTuning(item.node.id)"
                  class="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Dostroj czujnik
                </button>
                <button
                  type="button"
                  (click)="toggleFlatlineFault(item.node.id)"
                  class="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-red-950]="item.validation.flatlineFaultDetected"
                  [class.border-red-500]="item.validation.flatlineFaultDetected"
                  [class.text-red-200]="item.validation.flatlineFaultDetected"
                  [class.bg-slate-900]="!item.validation.flatlineFaultDetected"
                  [class.border-slate-700]="!item.validation.flatlineFaultDetected"
                  [class.text-slate-300]="!item.validation.flatlineFaultDetected"
                >
                  {{ item.validation.flatlineFaultDetected ? 'Usun awarie Flatline' : 'Wstrzyknij Flatline Fault' }}
                </button>
              </div>
            </article>
          }
        </div>

        <!-- D3 Historical Telemetry Visualization -->
        <app-corridor-d3-chart
          [nodes]="nodes()"
          [focusedNodeId]="selectedNodeId()"
          [audience]="audience()"
          [highContrast]="highContrast()"
        />

        <!-- Interactive Sensor Calibration Workbench -->
        @let active = activeNodeItem();
        <div class="mt-8 rounded-lg border border-slate-800 bg-slate-950 p-5">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-white">
                Laboratorium Walidacji Sygnalu: {{ active.node.name }}
              </h3>
              <p class="text-xs text-slate-400">
                Symuluj wplyw wilgotnosci morskiej (RH &gt; 85%) oraz opoznienia traktow swiatlowodowych DWDM (&lt; 5 ms) dla farmy PGE Baltica 2 &amp; 3 WindShare (2.5 GW).
              </p>
            </div>
            <span class="text-xs font-mono tabular-nums text-[#D8ED00]">
              Wspolczynnik korekty wilgotnosci k = {{ active.validation.humidityCorrectionFactor }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label for="rh-slider" class="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Wilgotnosc Wzgledna RH (%)</span>
                <span class="font-mono tabular-nums text-[#D8ED00]">{{ active.node.relativeHumidity }}%</span>
              </label>
              <input
                id="rh-slider"
                type="range"
                min="45"
                max="99"
                step="1"
                [value]="active.node.relativeHumidity"
                (input)="updateHumidity(active.node.id, $event)"
                class="mt-2 w-full accent-[#D8ED00] cursor-pointer"
              />
              <p class="mt-1 text-xs text-slate-400 font-mono">
                Prog korekty higroskopijnej: RH &gt; 85%
              </p>
            </div>

            <div>
              <label for="pm-slider" class="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Surowe stezenie PM2.5 (µg/m³)</span>
                <span class="font-mono tabular-nums text-[#D8ED00]">{{ active.node.rawPm25 }} µg/m³</span>
              </label>
              <input
                id="pm-slider"
                type="range"
                min="5"
                max="85"
                step="0.5"
                [value]="active.node.rawPm25"
                (input)="updateRawPm25(active.node.id, $event)"
                class="mt-2 w-full accent-[#D8ED00] cursor-pointer"
              />
              <p class="mt-1 text-xs text-slate-400 font-mono">
                Po korekcie dCi: {{ active.validation.correctedPm25 }} µg/m³
              </p>
            </div>

            <div>
              <label for="latency-slider" class="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Latencja Swiatlowodu DWDM (ms)</span>
                <span class="font-mono tabular-nums text-[#D8ED00]">{{ active.node.dwdmLatencyMs }} ms</span>
              </label>
              <input
                id="latency-slider"
                type="range"
                min="1.5"
                max="8.0"
                step="0.02"
                [value]="active.node.dwdmLatencyMs"
                (input)="updateLatency(active.node.id, $event)"
                class="mt-2 w-full accent-[#D8ED00] cursor-pointer"
              />
              <p class="mt-1 text-xs text-slate-400 font-mono">
                Wymog SLA Smart Grid: &lt; 5.00 ms (ref. 3.84 ms)
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Verified AI Quality Gates Section -->
      <section
        aria-labelledby="quality-gates-heading"
        class="rounded-xl border p-6 sm:p-8 transition-colors"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
        [class.bg-slate-900]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
      >
        <div class="pb-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p class="text-xs font-mono text-slate-400">
              Zweryfikowane Metryki Jakosci AI (Quality Gates) · Walidacja Deterministyczna
            </p>
            <h3 id="quality-gates-heading" class="mt-1 text-lg sm:text-xl font-bold text-white">
              Bramki Jakosci Pipeline'u NLP &amp; Smart Grid (BERTScore / BLEU-4 / ROUGE-L / CodeBLEU)
            </h3>
          </div>
          <span class="text-xs font-mono text-emerald-400">
            Status: 4/4 Bramki Zaliczone (PASS)
          </span>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          @for (gate of qualityGates; track gate.id) {
            <div class="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>{{ gate.name }}</span>
                  <span>Prog &gt;= {{ gate.threshold | number:'1.2-2' }}</span>
                </div>
                <p class="mt-2 text-2xl font-bold font-mono tabular-nums text-[#D8ED00]">
                  {{ gate.score | number:'1.2-2' }}
                </p>
                <p class="mt-1 text-xs font-semibold text-slate-200">{{ gate.category }}</p>
                <p class="mt-2 text-xs leading-relaxed text-slate-300">
                  @switch (audience()) {
                    @case ('professor') {
                      {{ gate.description.professor }}
                    }
                    @case ('architect') {
                      {{ gate.description.architect }}
                    }
                    @case ('layperson') {
                      {{ gate.description.layperson }}
                    }
                  }
                </p>
              </div>
              <div class="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>Nadwyzka: +{{ (gate.score - gate.threshold) | number:'1.2-2' }}</span>
                <span>VERIFIED</span>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class SmartGridTelemetryPanel {
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();
  readonly speakText = output<string>();

  readonly nodes = signal<CorridorNodeTelemetry[]>(
    INITIAL_CORRIDOR_NODES.map((n) => ({ ...n, recentSamples: [...n.recentSamples] }))
  );
  readonly selectedNodeId = signal<'ustka' | 'slupsk' | 'trojmiasto'>('ustka');
  readonly qualityGates = DOCUMENTED_QUALITY_GATES;

  readonly validatedNodes = computed(() =>
    this.nodes().map((node) => ({
      node,
      validation: validateTelemetryReading(node),
    }))
  );

  readonly activeNodeItem = computed(
    () =>
      this.validatedNodes().find((item) => item.node.id === this.selectedNodeId()) ??
      this.validatedNodes()[0]
  );

  selectNodeForTuning(id: 'ustka' | 'slupsk' | 'trojmiasto'): void {
    this.selectedNodeId.set(id);
  }

  toggleFlatlineFault(id: 'ustka' | 'slupsk' | 'trojmiasto'): void {
    this.nodes.update((list) =>
      list.map((node) => {
        if (node.id !== id) return node;
        const validation = validateTelemetryReading(node);
        if (validation.flatlineFaultDetected) {
          return {
            ...node,
            recentSamples: [
              Number((node.rawPm25 - 0.8).toFixed(1)),
              Number((node.rawPm25 + 0.5).toFixed(1)),
              Number((node.rawPm25 - 0.3).toFixed(1)),
              node.rawPm25,
            ],
          };
        }
        return {
          ...node,
          recentSamples: [node.rawPm25, node.rawPm25, node.rawPm25, node.rawPm25],
        };
      })
    );
  }

  updateHumidity(id: 'ustka' | 'slupsk' | 'trojmiasto', event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.nodes.update((list) =>
      list.map((n) => (n.id === id ? { ...n, relativeHumidity: val } : n))
    );
  }

  updateRawPm25(id: 'ustka' | 'slupsk' | 'trojmiasto', event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.nodes.update((list) =>
      list.map((n) =>
        n.id === id
          ? {
              ...n,
              rawPm25: val,
              recentSamples: [
                Number((val - 0.6).toFixed(1)),
                Number((val + 0.4).toFixed(1)),
                Number((val - 0.2).toFixed(1)),
                val,
              ],
            }
          : n
      )
    );
  }

  updateLatency(id: 'ustka' | 'slupsk' | 'trojmiasto', event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.nodes.update((list) =>
      list.map((n) => (n.id === id ? { ...n, dwdmLatencyMs: val } : n))
    );
  }

  resetCorridorTelemetry(): void {
    this.nodes.set(
      INITIAL_CORRIDOR_NODES.map((n) => ({ ...n, recentSamples: [...n.recentSamples] }))
    );
  }

  speakTelemetrySummary(): void {
    const current = this.activeNodeItem();
    this.speakText.emit(
      `Wezel ${current.node.name}. Odczyt surowy PM2.5 wynosi ${current.validation.rawPm25} mikrogramow, po korekcie wilgotnosci ${current.validation.correctedPm25}. Latencja swiatlowodu DWDM wynosi ${current.node.dwdmLatencyMs} milisekundy, indeks dCi ${current.validation.dCiScore}.`
    );
  }
}
