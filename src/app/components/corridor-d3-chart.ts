import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';
import {
  AudienceLevel,
  CorridorNodeTelemetry,
  HistoricalTelemetryPoint,
  TelemetryTimeframe,
  generateCorridorHistoricalTelemetry,
} from '../domain/architecture-logic';

export type D3ChartMode = 'dual' | 'compare_aqi' | 'compare_dci';

@Component({
  selector: 'app-corridor-d3-chart',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-8 rounded-lg border border-slate-800 bg-slate-950 p-5 space-y-5">
      <!-- Header & Controls -->
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <p class="text-xs font-mono text-slate-400">
            Wizualizacja D3.js · Telemetria Historyczna AQI / PM2.5 oraz Indeks Ufnosci dCi · Ustka — Slupsk — Trojmiasto
          </p>
          <h3
            class="mt-1 text-base sm:text-lg font-bold"
            [class.text-[#D8ED00]]="highContrast()"
            [class.text-white]="!highContrast()"
          >
            Szeregi Czasowe AQI i dCi (Korekta Higroskopijna RH &gt; 85% oraz Detekcja Flatline Faults)
          </h3>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Timeframe Selector -->
          <div
            role="group"
            aria-label="Wybierz zakres czasu telemetrii historycznej"
            class="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800"
          >
            @for (tf of timeframes; track tf.id) {
              <button
                type="button"
                (click)="setTimeframe(tf.id)"
                class="px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#D8ED00]]="timeframe() === tf.id"
                [class.text-[#130E17]]="timeframe() === tf.id"
                [class.text-slate-300]="timeframe() !== tf.id"
                [class.hover:text-white]="timeframe() !== tf.id"
              >
                {{ tf.label }}
              </button>
            }
          </div>

          <!-- Chart Mode Selector -->
          <div
            role="group"
            aria-label="Wybierz tryb wykresu D3"
            class="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800"
          >
            <button
              type="button"
              (click)="setChartMode('dual')"
              class="px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="chartMode() === 'dual'"
              [class.text-[#130E17]]="chartMode() === 'dual'"
              [class.text-slate-300]="chartMode() !== 'dual'"
              [class.hover:text-white]="chartMode() !== 'dual'"
            >
              Dual-Axis: AQI + dCi ({{ focusedNodeLabel() }})
            </button>
            <button
              type="button"
              (click)="setChartMode('compare_aqi')"
              class="px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="chartMode() === 'compare_aqi'"
              [class.text-[#130E17]]="chartMode() === 'compare_aqi'"
              [class.text-slate-300]="chartMode() !== 'compare_aqi'"
              [class.hover:text-white]="chartMode() !== 'compare_aqi'"
            >
              Korytarz: Porownanie AQI
            </button>
            <button
              type="button"
              (click)="setChartMode('compare_dci')"
              class="px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="chartMode() === 'compare_dci'"
              [class.text-[#130E17]]="chartMode() === 'compare_dci'"
              [class.text-slate-300]="chartMode() !== 'compare_dci'"
              [class.hover:text-white]="chartMode() !== 'compare_dci'"
            >
              Korytarz: Porownanie dCi
            </button>
          </div>
        </div>
      </div>

      <!-- Audience Contextual Description -->
      <p class="text-xs leading-relaxed text-slate-300">
        @switch (audience()) {
          @case ('professor') {
            Wykres D3.js prezentuje dwuwymiarowa trajektorie czasowa: lewa os rzednych odwzorowuje indeks AQI oraz stezenie PM2.5 przed i po nieliniowej korekcie higroskopijnej (RH &gt; 85%), natomiast prawa os rzednych prezentuje deterministyczny indeks ufnosci dCi w przedziale [0.00, 1.00] z automatycznym oznaczeniem anomalii zerowej wariancji (Flatline Fault, dCi = 0.18).
          }
          @case ('architect') {
            Interaktywna wizualizacja D3.js pozwala porownac serie czasowe z Ustki (Port Offshore 2.5 GW), Slupska (GPZ Wierzbiecino 400 kV) i Trojmiasta (Hotel Gdansk). Ostatni punkt na osi czasu jest zsynchronizowany na zywo z suwakami symulatora czujnika ponizej.
          }
          @case ('layperson') {
            Na wykresie widac, jak w ostatnich godzinach i dniach zmieniala sie jakosc powietrza (AQI) oraz wiarygodnosc pomiarow (dCi) w Ustce, Slupsku i Trojmiescie. Czerwone punkty oznaczaja momenty, w ktorych system wykryl zawieszenie czujnika, a zolte — automatyczne odfiltrowanie morskiej wilgoci.
          }
        }
      </p>

      <!-- Legend & Statistical Summary Strip -->
      <div class="flex flex-wrap items-center justify-between gap-4 text-xs font-mono bg-slate-900/80 border border-slate-800/90 rounded-lg px-4 py-2.5">
        @if (chartMode() === 'dual') {
          <div class="flex flex-wrap items-center gap-4">
            <span class="text-[#D8ED00] font-semibold">— Skorygowany AQI (po korekcie RH)</span>
            <span class="text-slate-400">-- Surowy PM2.5 (µg/m³)</span>
            <span class="text-emerald-400 font-semibold">— Indeks ufnosci dCi (prawa os 0–1.0)</span>
            <span class="text-red-400">● Anomalia Flatline (dCi = 0.18)</span>
          </div>
        } @else {
          <div class="flex flex-wrap items-center gap-4">
            <span class="text-[#D8ED00] font-semibold">— Ustka (Port / Offshore 2.5 GW)</span>
            <span class="text-emerald-400 font-semibold">— Slupsk (GPZ Wierzbiecino 400 kV)</span>
            <span class="text-sky-400 font-semibold">— Trojmiasto (Hotel Gdansk)</span>
          </div>
        }

        <div class="text-slate-300 tabular-nums">
          Sredni AQI ({{ focusedNodeLabel() }}): <strong class="text-[#D8ED00]">{{ focusedStats().avgAqi }}</strong>
          <span aria-hidden="true"> · </span>
          Sredni dCi: <strong class="text-emerald-400">{{ focusedStats().avgDci }}</strong>
          <span aria-hidden="true"> · </span>
          Korekty RH: <strong class="text-white">{{ focusedStats().humidityCorrections }}</strong>
        </div>
      </div>

      <!-- D3 SVG Container -->
      <div class="relative w-full overflow-x-auto rounded-lg border border-slate-800 bg-[#0B0F17] p-3">
        <svg
          #svgContainer
          data-testid="corridor-d3-svg"
          viewBox="0 0 960 320"
          preserveAspectRatio="xMidYMid meet"
          class="w-full h-72 sm:h-80 block select-none"
          role="img"
          [attr.aria-label]="'Wykres D3 telemetrii historycznej AQI oraz dCi dla korytarza Ustka Slupsk Trojmiasto, zakres ' + timeframe()"
        ></svg>
      </div>

      <!-- Interactive Point Scrubber & Multi-Node Snapshot Inspector -->
      @let snap = inspectedSnapshot();
      <div class="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-2 text-xs font-mono">
            <span class="text-slate-400">Inspektor probki czasowej (krok {{ snap.stepIndex + 1 }}/{{ maxStepIndex() + 1 }}):</span>
            <strong class="text-[#D8ED00]">{{ snap.label }} {{ snap.isLatest ? '(Stan Biezacy Live)' : '(Archiwum)' }}</strong>
          </div>

          <div class="flex items-center gap-3">
            <label for="d3-step-scrubber" class="text-xs font-mono text-slate-400 shrink-0">
              Przewin os czasu:
            </label>
            <input
              id="d3-step-scrubber"
              type="range"
              min="0"
              [max]="maxStepIndex()"
              step="1"
              [value]="snap.stepIndex"
              (input)="onStepScrub($event)"
              class="w-36 sm:w-48 accent-[#D8ED00] cursor-pointer"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono tabular-nums">
          @for (pt of snap.points; track pt.nodeId) {
            <div
              class="rounded border p-3 transition-colors"
              [class.border-[#D8ED00]]="pt.nodeId === focusedNodeId()"
              [class.bg-slate-950]="pt.nodeId === focusedNodeId()"
              [class.border-slate-800]="pt.nodeId !== focusedNodeId()"
              [class.bg-slate-950/50]="pt.nodeId !== focusedNodeId()"
            >
              <div class="flex items-center justify-between text-slate-400">
                <span class="font-bold text-white">{{ getNodeShortName(pt.nodeId) }}</span>
                <span>DWDM: {{ pt.dwdmLatencyMs }} ms</span>
              </div>
              <div class="mt-1.5 flex items-center justify-between">
                <span>AQI: <strong class="text-[#D8ED00]">{{ pt.aqiScore }}</strong> (PM2.5: {{ pt.correctedPm25 }} / {{ pt.rawPm25 }} µg/m³)</span>
                <span>RH: {{ pt.relativeHumidity }}%</span>
              </div>
              <div class="mt-1 flex items-center justify-between">
                <span>
                  dCi:
                  <strong
                    [class.text-red-400]="pt.anomalyEvent === 'FLATLINE_DETECTED'"
                    [class.text-emerald-400]="pt.anomalyEvent !== 'FLATLINE_DETECTED'"
                  >
                    {{ pt.dCiScore | number:'1.2-2' }}
                  </strong>
                </span>
                <span
                  [class.text-red-400]="pt.anomalyEvent === 'FLATLINE_DETECTED'"
                  [class.text-amber-300]="pt.anomalyEvent === 'HUMIDITY_CORRECTION'"
                  [class.text-slate-400]="pt.anomalyEvent === 'NONE'"
                >
                  {{ pt.anomalyEvent }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CorridorD3Chart {
  private readonly platformId = inject(PLATFORM_ID);

  readonly nodes = input.required<CorridorNodeTelemetry[]>();
  readonly focusedNodeId = input.required<'ustka' | 'slupsk' | 'trojmiasto'>();
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();

  readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svgContainer');

  readonly timeframe = signal<TelemetryTimeframe>('24h');
  readonly chartMode = signal<D3ChartMode>('dual');
  readonly selectedStep = signal<number>(23);

  readonly timeframes: { id: TelemetryTimeframe; label: string }[] = [
    { id: '24h', label: '24h (1h)' },
    { id: '7d', label: '7 dni (6h)' },
    { id: '30d', label: '30 dni (1d)' },
  ];

  readonly allSeries = computed(() =>
    generateCorridorHistoricalTelemetry(this.nodes(), this.timeframe())
  );

  readonly maxStepIndex = computed(() => {
    const tf = this.timeframe();
    return tf === '24h' ? 23 : tf === '7d' ? 27 : 29;
  });

  readonly focusedNodeLabel = computed(() => this.getNodeShortName(this.focusedNodeId()));

  readonly focusedSeries = computed(() =>
    this.allSeries().filter((p) => p.nodeId === this.focusedNodeId())
  );

  readonly focusedStats = computed(() => {
    const series = this.focusedSeries();
    if (series.length === 0) {
      return { avgAqi: 0, avgDci: '0.00', humidityCorrections: 0 };
    }
    const avgAqi = Math.round(series.reduce((s, p) => s + p.aqiScore, 0) / series.length);
    const avgDci = (series.reduce((s, p) => s + p.dCiScore, 0) / series.length).toFixed(2);
    const humidityCorrections = series.filter(
      (p) => p.anomalyEvent === 'HUMIDITY_CORRECTION'
    ).length;
    return { avgAqi, avgDci, humidityCorrections };
  });

  readonly inspectedSnapshot = computed(() => {
    const clampedStep = Math.min(this.maxStepIndex(), Math.max(0, this.selectedStep()));
    const points = this.allSeries().filter((p) => p.stepIndex === clampedStep);
    const label = points[0]?.label ?? '12:00';
    return {
      stepIndex: clampedStep,
      label,
      isLatest: clampedStep === this.maxStepIndex(),
      points,
    };
  });

  constructor() {
    effect(() => {
      const series = this.allSeries();
      const mode = this.chartMode();
      const focusId = this.focusedNodeId();
      const activeStep = Math.min(this.maxStepIndex(), Math.max(0, this.selectedStep()));
      const svgEl = this.svgRef()?.nativeElement;

      if (isPlatformBrowser(this.platformId) && svgEl && series.length > 0) {
        this.renderD3Chart(svgEl, series, mode, focusId, activeStep);
      }
    });
  }

  setTimeframe(tf: TelemetryTimeframe): void {
    this.timeframe.set(tf);
    const maxIdx = tf === '24h' ? 23 : tf === '7d' ? 27 : 29;
    this.selectedStep.set(maxIdx);
  }

  setChartMode(mode: D3ChartMode): void {
    this.chartMode.set(mode);
  }

  onStepScrub(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.selectedStep.set(val);
  }

  getNodeShortName(id: 'ustka' | 'slupsk' | 'trojmiasto'): string {
    switch (id) {
      case 'ustka':
        return 'Ustka (Offshore)';
      case 'slupsk':
        return 'Slupsk (GPZ 400kV)';
      case 'trojmiasto':
        return 'Trojmiasto (Gdansk)';
    }
  }

  private renderD3Chart(
    svgElement: SVGSVGElement,
    allPoints: HistoricalTelemetryPoint[],
    mode: D3ChartMode,
    focusedId: 'ustka' | 'slupsk' | 'trojmiasto',
    inspectedStep: number
  ): void {
    const width = 960;
    const height = 320;
    const margin = { top: 24, right: 56, bottom: 38, left: 52 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const focusPoints = allPoints.filter((p) => p.nodeId === focusedId);
    const maxStep = d3.max(focusPoints, (d) => d.stepIndex) ?? 23;

    const xScale = d3
      .scaleLinear()
      .domain([0, maxStep])
      .range([0, innerWidth]);

    const yAqiMax = Math.max(90, (d3.max(allPoints, (d) => Math.max(d.aqiScore, d.rawPm25)) ?? 80) + 12);
    const yScaleAqi = d3
      .scaleLinear()
      .domain([0, yAqiMax])
      .nice()
      .range([innerHeight, 0]);

    const yScaleDci = d3
      .scaleLinear()
      .domain([0, 1.05])
      .range([innerHeight, 0]);

    // Horizontal grid lines
    const yTicks = mode === 'compare_dci' ? yScaleDci.ticks(5) : yScaleAqi.ticks(5);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => (mode === 'compare_dci' ? yScaleDci(d) : yScaleAqi(d)))
      .attr('y2', (d) => (mode === 'compare_dci' ? yScaleDci(d) : yScaleAqi(d)))
      .attr('stroke', '#1E293B')
      .attr('stroke-dasharray', '3,3');

    // Inspected step vertical guide line
    const inspectedX = xScale(inspectedStep);
    g.append('line')
      .attr('x1', inspectedX)
      .attr('x2', inspectedX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#D8ED00')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.75);

    if (mode === 'dual') {
      // Shaded area under Corrected AQI
      const areaAqi = d3
        .area<HistoricalTelemetryPoint>()
        .x((d) => xScale(d.stepIndex))
        .y0(innerHeight)
        .y1((d) => yScaleAqi(d.aqiScore))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(focusPoints)
        .attr('fill', 'rgba(216, 237, 0, 0.10)')
        .attr('d', areaAqi);

      // Raw PM2.5 dashed line
      const lineRawPm = d3
        .line<HistoricalTelemetryPoint>()
        .x((d) => xScale(d.stepIndex))
        .y((d) => yScaleAqi(d.rawPm25))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(focusPoints)
        .attr('fill', 'none')
        .attr('stroke', '#94A3B8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('d', lineRawPm);

      // Corrected AQI primary line
      const lineAqi = d3
        .line<HistoricalTelemetryPoint>()
        .x((d) => xScale(d.stepIndex))
        .y((d) => yScaleAqi(d.aqiScore))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(focusPoints)
        .attr('fill', 'none')
        .attr('stroke', '#D8ED00')
        .attr('stroke-width', 2.5)
        .attr('d', lineAqi);

      // dCi secondary axis line
      const lineDci = d3
        .line<HistoricalTelemetryPoint>()
        .x((d) => xScale(d.stepIndex))
        .y((d) => yScaleDci(d.dCiScore))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(focusPoints)
        .attr('fill', 'none')
        .attr('stroke', '#34D399')
        .attr('stroke-width', 2.2)
        .attr('d', lineDci);

      // Interactive data points for AQI
      g.selectAll('.dot-aqi')
        .data(focusPoints)
        .join('circle')
        .attr('class', 'dot-aqi')
        .attr('cx', (d) => xScale(d.stepIndex))
        .attr('cy', (d) => yScaleAqi(d.aqiScore))
        .attr('r', (d) => (d.stepIndex === inspectedStep ? 5.5 : 3.2))
        .attr('fill', (d) =>
          d.anomalyEvent === 'FLATLINE_DETECTED'
            ? '#EF4444'
            : d.anomalyEvent === 'HUMIDITY_CORRECTION'
              ? '#D8ED00'
              : '#F8FAFC'
        )
        .attr('stroke', '#0F172A')
        .attr('stroke-width', 1.2)
        .style('cursor', 'pointer')
        .on('click', (_event, d) => {
          this.selectedStep.set(d.stepIndex);
        });

      // Interactive data points for dCi
      g.selectAll('.dot-dci')
        .data(focusPoints)
        .join('circle')
        .attr('class', 'dot-dci')
        .attr('cx', (d) => xScale(d.stepIndex))
        .attr('cy', (d) => yScaleDci(d.dCiScore))
        .attr('r', (d) => (d.anomalyEvent === 'FLATLINE_DETECTED' ? 6 : d.stepIndex === inspectedStep ? 5 : 3))
        .attr('fill', (d) => (d.anomalyEvent === 'FLATLINE_DETECTED' ? '#EF4444' : '#34D399'))
        .attr('stroke', '#0F172A')
        .attr('stroke-width', 1.2)
        .style('cursor', 'pointer')
        .on('click', (_event, d) => {
          this.selectedStep.set(d.stepIndex);
        });
    } else {
      // Multi-node Corridor Comparison (Ustka, Slupsk, Trojmiasto)
      const nodeColors: Record<'ustka' | 'slupsk' | 'trojmiasto', string> = {
        ustka: '#D8ED00',
        slupsk: '#34D399',
        trojmiasto: '#38BDF8',
      };

      const nodeIds: ('ustka' | 'slupsk' | 'trojmiasto')[] = ['ustka', 'slupsk', 'trojmiasto'];
      for (const nId of nodeIds) {
        const nodeSeries = allPoints.filter((p) => p.nodeId === nId);
        const lineGen = d3
          .line<HistoricalTelemetryPoint>()
          .x((d) => xScale(d.stepIndex))
          .y((d) => (mode === 'compare_dci' ? yScaleDci(d.dCiScore) : yScaleAqi(d.aqiScore)))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(nodeSeries)
          .attr('fill', 'none')
          .attr('stroke', nodeColors[nId])
          .attr('stroke-width', nId === focusedId ? 2.8 : 1.8)
          .attr('opacity', nId === focusedId ? 1.0 : 0.75)
          .attr('d', lineGen);

        g.selectAll(`.dot-${nId}`)
          .data(nodeSeries)
          .join('circle')
          .attr('cx', (d) => xScale(d.stepIndex))
          .attr('cy', (d) => (mode === 'compare_dci' ? yScaleDci(d.dCiScore) : yScaleAqi(d.aqiScore)))
          .attr('r', (d) => (d.stepIndex === inspectedStep ? 5 : 2.8))
          .attr('fill', (d) => (d.anomalyEvent === 'FLATLINE_DETECTED' ? '#EF4444' : nodeColors[nId]))
          .attr('stroke', '#0F172A')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('click', (_event, d) => {
            this.selectedStep.set(d.stepIndex);
          });
      }
    }

    // Bottom X Axis with formatted timestamp labels
    const tickIndices = d3.range(0, maxStep + 1, Math.max(1, Math.floor(maxStep / 6)));
    if (!tickIndices.includes(maxStep)) {
      tickIndices.push(maxStep);
    }

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(tickIndices)
      .tickFormat((d) => {
        const idx = Number(d);
        const found = focusPoints.find((p) => p.stepIndex === idx);
        return found ? found.label : String(idx);
      });

    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.selectAll('text').attr('fill', '#94A3B8').attr('font-family', 'JetBrains Mono, monospace').attr('font-size', '10px');
    xAxisG.selectAll('line, path').attr('stroke', '#334155');

    // Left Y Axis
    const leftAxis =
      mode === 'compare_dci'
        ? d3.axisLeft(yScaleDci).ticks(5).tickFormat((d) => Number(d).toFixed(2))
        : d3.axisLeft(yScaleAqi).ticks(5);

    const leftAxisG = g.append('g').call(leftAxis);
    leftAxisG.selectAll('text').attr('fill', '#D8ED00').attr('font-family', 'JetBrains Mono, monospace').attr('font-size', '10px');
    leftAxisG.selectAll('line, path').attr('stroke', '#334155');

    // Right Y Axis (for Dual-Axis dCi mode)
    if (mode === 'dual') {
      const rightAxis = d3
        .axisRight(yScaleDci)
        .ticks(5)
        .tickFormat((d) => Number(d).toFixed(2));

      const rightAxisG = g
        .append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(rightAxis);

      rightAxisG.selectAll('text').attr('fill', '#34D399').attr('font-family', 'JetBrains Mono, monospace').attr('font-size', '10px');
      rightAxisG.selectAll('line, path').attr('stroke', '#334155');
    }
  }
}
