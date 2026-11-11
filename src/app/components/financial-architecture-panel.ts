import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  AudienceLevel,
  FinancialSimulationInput,
  simulateFinancialArchitecture,
} from '../domain/architecture-logic';

@Component({
  selector: 'app-financial-architecture-panel',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10">
      <!-- Model 60 / 30 / 10 & Interactive Simulator -->
      <section
        aria-labelledby="financial-model-heading"
        class="rounded-xl border p-6 sm:p-8 transition-colors"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
        [class.bg-slate-900]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p class="text-xs font-mono text-slate-400">
              Sekcja 2 · Architektura Finansowa · Model 60/30/10 · 4 Wplywy w Miesiacu · Ryczalt 12% / IP Box 5%
            </p>
            <h2
              id="financial-model-heading"
              class="mt-1 text-xl sm:text-2xl font-bold tracking-tight balance-text"
              [class.text-[#D8ED00]]="highContrast()"
              [class.text-white]="!highContrast()"
            >
              05. Model Przeplywow 60 / 30 / 10, Frekwencja Wplat i Wodospad Kapitalu
            </h2>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="setMarket('PL')"
              class="px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="simInput().b2bMarket === 'PL'"
              [class.text-[#130E17]]="simInput().b2bMarket === 'PL'"
              [class.border-[#D8ED00]]="simInput().b2bMarket === 'PL'"
              [class.bg-slate-800]="simInput().b2bMarket !== 'PL'"
              [class.text-slate-200]="simInput().b2bMarket !== 'PL'"
              [class.border-slate-700]="simInput().b2bMarket !== 'PL'"
            >
              Rynek Polska (140–210 PLN/h)
            </button>
            <button
              type="button"
              (click)="setMarket('EU')"
              class="px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="simInput().b2bMarket === 'EU'"
              [class.text-[#130E17]]="simInput().b2bMarket === 'EU'"
              [class.border-[#D8ED00]]="simInput().b2bMarket === 'EU'"
              [class.bg-slate-800]="simInput().b2bMarket !== 'EU'"
              [class.text-slate-200]="simInput().b2bMarket !== 'EU'"
              [class.border-slate-700]="simInput().b2bMarket !== 'EU'"
            >
              Rynek UE / DACH (55–90 EUR/h · 0% VAT RC)
            </button>
            <button
              type="button"
              (click)="speakFinancialSummary()"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <mat-icon class="text-base leading-none">volume_up</mat-icon>
              <span>Odsluchaj (TTS)</span>
            </button>
          </div>
        </div>

        <p class="mt-4 text-sm leading-relaxed text-slate-300">
          @switch (audience()) {
            @case ('professor') {
              Stochastyczna stabilizacja przeplywow pienieznych (Cashflow Smoothing) poprzez dywersyfikacje portfela czasu pracy w proporcji 60/30/10 oraz rozproszenie zapadalnosci wierzytelnosci na 4 deterministyczne wezly czasowe w miesiacu (5., 10., 18., 25. dzien), przy minimalizacji klina podatkowego poprzez rezym IP Box (5% PIT dla kwalifikowanego IP z B+R).
            }
            @case ('architect') {
              60% czasu stanowi stabilny kontrakt B2B (PL: 140–210 PLN/h lub UE/DACH: 55–90 EUR/h z Reverse Charge), 30% to powtarzalny przychod MRR z umow SLA (600–1500 PLN/mies. od gmin, hoteli i kancelarii), a 10% to wysokomarzowe audyty RODO/NIS2/WCAG i wdrozenia Smart Grid zabezpieczone bezwzglednym 40% zadatkiem.
            }
            @case ('layperson') {
              Zamiast czekac na jedna wyplate w miesiacu, przychod wplywa na konto cztery razy w miesiacu (5., 10., 18. i 25. dnia). Glowna praca zdalna daje pewna podstawe, stale abonamenty od gmin i firm pokrywaja koszty stale, a nadwyzki sa bezpiecznie odkladane na emeryture bez podatku Belki (IKE/IKZE) i obligacje skarbowe.
            }
          }
        </p>

        <!-- Top Financial KPI Row -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Przychod Miesieczny Netto (Suma)</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-[#D8ED00]">
              {{ simResult().totalMonthlyGrossNetPln | number:'1.0-0' }} PLN
            </p>
            <p class="mt-1 text-xs font-mono text-slate-400">
              60% B2B · 30% SLA MRR · 10% Audyty
            </p>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Podatek Doch. ({{ simResult().effectiveTaxRatePercent }}%)</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-white">
              {{ simResult().estimatedIncomeTaxPln | number:'1.0-0' }} PLN
            </p>
            <p class="mt-1 text-xs font-mono text-emerald-400">
              Na reke: {{ simResult().netDisposablePln | number:'1.0-0' }} PLN
            </p>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Nadwyzka do Lokowania / Mies.</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-[#D8ED00]">
              {{ simResult().monthlySurplusPln | number:'1.0-0' }} PLN
            </p>
            <p class="mt-1 text-xs font-mono text-slate-400">
              Po kosztach operacyjnych ({{ simInput().monthlyLivingAndOpsCostPln | number:'1.0-0' }} PLN)
            </p>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Cel Poduszki Finansowej (6M)</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-white">
              {{ simResult().sixMonthCushionTargetPln | number:'1.0-0' }} PLN
            </p>
            <p class="mt-1 text-xs font-mono text-slate-400">
              Subkonto EUR/PLN + Obligacje TOS/COI
            </p>
          </div>
        </div>

        <!-- Interactive Sliders for 60 / 30 / 10 Parameters -->
        <div class="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @if (simInput().b2bMarket === 'PL') {
            <div>
              <label for="rate-pln" class="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Stawka B2B Polska (PLN/h)</span>
                <span class="font-mono tabular-nums text-[#D8ED00]">{{ simInput().b2bHourlyRatePln }} PLN/h</span>
              </label>
              <input
                id="rate-pln"
                type="range"
                min="140"
                max="210"
                step="5"
                [value]="simInput().b2bHourlyRatePln"
                (input)="updateNumberField('b2bHourlyRatePln', $event)"
                class="mt-2 w-full accent-[#D8ED00] cursor-pointer"
              />
              <p class="mt-1 text-xs font-mono text-slate-400">Zakres udokumentowany: 140–210 PLN/h</p>
            </div>
          } @else {
            <div>
              <label for="rate-eur" class="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Stawka B2B UE/DACH (EUR/h)</span>
                <span class="font-mono tabular-nums text-[#D8ED00]">{{ simInput().b2bHourlyRateEur }} EUR/h</span>
              </label>
              <input
                id="rate-eur"
                type="range"
                min="55"
                max="90"
                step="5"
                [value]="simInput().b2bHourlyRateEur"
                (input)="updateNumberField('b2bHourlyRateEur', $event)"
                class="mt-2 w-full accent-[#D8ED00] cursor-pointer"
              />
              <p class="mt-1 text-xs font-mono text-slate-400">Zakres udokumentowany: 55–90 EUR/h</p>
            </div>
          }

          <div>
            <label for="sla-count" class="flex items-center justify-between text-xs font-medium text-slate-300">
              <span>Liczba Podmiotow SLA (MRR)</span>
              <span class="font-mono tabular-nums text-[#D8ED00]">{{ simInput().slaClientsCount }} podm.</span>
            </label>
            <input
              id="sla-count"
              type="range"
              min="1"
              max="15"
              step="1"
              [value]="simInput().slaClientsCount"
              (input)="updateNumberField('slaClientsCount', $event)"
              class="mt-2 w-full accent-[#D8ED00] cursor-pointer"
            />
            <p class="mt-1 text-xs font-mono text-slate-400">Gminy, hotele, kancelarie prawne</p>
          </div>

          <div>
            <label for="sla-rate" class="flex items-center justify-between text-xs font-medium text-slate-300">
              <span>Abonament SLA / podmiot</span>
              <span class="font-mono tabular-nums text-[#D8ED00]">{{ simInput().slaRatePerClientPln }} PLN</span>
            </label>
            <input
              id="sla-rate"
              type="range"
              min="600"
              max="1500"
              step="50"
              [value]="simInput().slaRatePerClientPln"
              (input)="updateNumberField('slaRatePerClientPln', $event)"
              class="mt-2 w-full accent-[#D8ED00] cursor-pointer"
            />
            <p class="mt-1 text-xs font-mono text-slate-400">Zakres: 600–1 500 PLN netto/mies.</p>
          </div>

          <div>
            <label for="tax-select" class="block text-xs font-medium text-slate-300">
              Optymalizacja Podatkowa B2B
            </label>
            <select
              id="tax-select"
              [value]="simInput().taxRegime"
              (change)="updateTaxRegime($event)"
              class="mt-2 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#D8ED00]"
            >
              <option value="ip_box_5">Ulga IP Box (5% PIT od kodu B+R)</option>
              <option value="ryczalt_12">Ryczalt IT (12% przychod)</option>
              <option value="hybrid">Model Hybrydowy (80% IP Box / 20% Ryczalt)</option>
            </select>
            <p class="mt-1 text-xs font-mono text-slate-400">+ 0% VAT Reverse Charge w UE</p>
          </div>
        </div>

        <!-- 4 Monthly Payout Schedule (Harmonogram Frekwencji Wplat) -->
        <div class="mt-8">
          <h3 class="text-base font-bold text-white">
            Harmonogram Frekwencji Wplat (4 Wplywy w Miesiacu)
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Rownomierne rozlozenie plynnosci finansowej na 4 daty rozliczeniowe z obowiazkowym 40% zadatkiem na prace audytowe i wdrozeniowe.
          </p>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (payout of simResult().payoutSchedule; track payout.dayOfMonth) {
              <div class="rounded-lg border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="text-[#D8ED00] font-bold">{{ payout.dayOfMonth }}. DZIEN MIESIACA</span>
                    <span class="text-slate-400">{{ payout.sharePercent }}% puli</span>
                  </div>
                  <h4 class="mt-2 text-sm font-bold text-white">{{ payout.title }}</h4>
                  <p class="mt-1 text-xs text-slate-400">{{ payout.sourceCategory }}</p>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800">
                  <p class="text-lg font-bold font-mono tabular-nums text-emerald-400">
                    +{{ payout.amountNetPln | number:'1.0-0' }} PLN
                  </p>
                  <p class="mt-1 text-xs font-mono text-slate-400">{{ payout.verificationNote }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Grants (PFRON & FE Pomorza) + Capital Waterfall -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <!-- Grants Section -->
        <section
          aria-labelledby="grants-heading"
          class="lg:col-span-6 rounded-xl border p-6 transition-colors flex flex-col justify-between"
          [class.bg-[#130E17]]="highContrast()"
          [class.border-[#D8ED00]]="highContrast()"
          [class.bg-slate-900]="!highContrast()"
          [class.border-slate-800]="!highContrast()"
        >
          <div>
            <p class="text-xs font-mono text-slate-400">Finansowanie Dotacyjne i Badawczo-Rozwojowe (B+R)</p>
            <h3 id="grants-heading" class="mt-1 text-lg font-bold text-white">
              Dotacja PFRON (PUP Slupsk) &amp; Fundusze Europejskie dla Pomorza
            </h3>

            <div class="mt-5 space-y-4">
              <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>PUP Slupsk · Zarzadzenie Nr 9/2025</span>
                  <span class="text-[#D8ED00]">Do 143 400 PLN</span>
                </div>
                <p class="mt-1 text-sm font-bold text-white">Dotacja PFRON na podjecie dzialalnosci B+R / IT</p>
                <p class="mt-1 text-xs text-slate-300 leading-relaxed">
                  Kosztorys bazowy PoC: <strong class="font-mono text-white">16 850 PLN</strong> (pokrywa zestaw startowy i infrastrukture wdrozeniowa), przy maksymalnym limicie ustawowym do <strong class="font-mono text-white">143 400 PLN</strong>.
                </p>
              </div>

              <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>FEP 2021–2027 · Dzialanie 1.1 B+R</span>
                  <span class="text-emerald-400">600 000 – 2 000 000 PLN</span>
                </div>
                <p class="mt-1 text-sm font-bold text-white">Fundusze Europejskie dla Pomorza (FE Pomorza 1.1 B+R)</p>
                <p class="mt-1 text-xs text-slate-300 leading-relaxed">
                  Skalowanie badan przemyslowych i prac rozwojowych w korytarzu Ustka — Slupsk — Trojmiasto: autonomiczna walidacja telemetrii Smart Grid (dCi/AQI) dla sektora Offshore oraz kryptografia Zero-Knowledge.
                </p>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Laczny potencjal lewara B+R:</span>
            <span class="text-white font-semibold">do 2 143 400 PLN bezzwrotnego kapitalu</span>
          </div>
        </section>

        <!-- Capital Multiplication Waterfall Section -->
        <section
          aria-labelledby="waterfall-heading"
          class="lg:col-span-6 rounded-xl border p-6 transition-colors flex flex-col justify-between"
          [class.bg-[#130E17]]="highContrast()"
          [class.border-[#D8ED00]]="highContrast()"
          [class.bg-slate-900]="!highContrast()"
          [class.border-slate-800]="!highContrast()"
        >
          <div>
            <p class="text-xs font-mono text-slate-400">Alokacja Nadwyzki Finansowej ({{ simResult().monthlySurplusPln | number:'1.0-0' }} PLN / mies.)</p>
            <h3 id="waterfall-heading" class="mt-1 text-lg font-bold text-white">
              Wodospad Lokowania Kapitalu (Poduszka 6M -&gt; IKZE/IKE -&gt; ETF &amp; EDO)
            </h3>

            <div class="mt-5 space-y-3">
              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-mono text-slate-400">Poziom 1 · Krotkoterminowo (Poduszka 6M · 35%)</p>
                  <p class="text-sm font-semibold text-white">Subkonto Walutowe EUR/PLN + Obligacje TOS / COI</p>
                </div>
                <span class="font-mono tabular-nums text-sm font-bold text-[#D8ED00] shrink-0">
                  {{ simResult().waterfallAllocation.cushionTosCoiPln | number:'1.0-0' }} PLN/m
                </span>
              </div>

              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-mono text-slate-400">Poziom 2 · Optymalizacja PIT (IKZE · 20%)</p>
                  <p class="text-sm font-semibold text-white">Maksymalizacja limitu IKZE (odliczenie od podstawy PIT)</p>
                </div>
                <span class="font-mono tabular-nums text-sm font-bold text-white shrink-0">
                  {{ simResult().waterfallAllocation.ikzeAllocationPln | number:'1.0-0' }} PLN/m
                </span>
              </div>

              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-mono text-slate-400">Poziom 3 · Tarcza Anty-Belka (IKE 0% · 25%)</p>
                  <p class="text-sm font-semibold text-white">Rachunek IKE (0% podatku od zyskow kapitalowych 19%)</p>
                </div>
                <span class="font-mono tabular-nums text-sm font-bold text-white shrink-0">
                  {{ simResult().waterfallAllocation.ikeAllocationPln | number:'1.0-0' }} PLN/m
                </span>
              </div>

              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-mono text-slate-400">Poziom 4 · Akumulacja Globalna (MSCI ACWI &amp; EDO · 20%)</p>
                  <p class="text-sm font-semibold text-white">Globalne ETF (MSCI ACWI) + 10-letnie Obligacje Antyinflacyjne EDO</p>
                </div>
                <span class="font-mono tabular-nums text-sm font-bold text-emerald-400 shrink-0">
                  {{ simResult().waterfallAllocation.edoAndGlobalEtfPln | number:'1.0-0' }} PLN/m
                </span>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Skumulowana nadwyzka roczna (12M):</span>
            <span class="text-[#D8ED00] font-bold tabular-nums">
              {{ (simResult().monthlySurplusPln * 12) | number:'1.0-0' }} PLN netto / rok
            </span>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class FinancialArchitecturePanel {
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();
  readonly speakText = output<string>();

  readonly simInput = signal<FinancialSimulationInput>({
    totalMonthlyHours: 160,
    b2bMarket: 'PL',
    b2bHourlyRatePln: 185,
    b2bHourlyRateEur: 75,
    eurExchangeRate: 4.32,
    slaClientsCount: 8,
    slaRatePerClientPln: 1100,
    monthlyAuditsTotalValuePln: 9500,
    taxRegime: 'ip_box_5',
    ipBoxSharePercent: 80,
    monthlyLivingAndOpsCostPln: 8500,
  });

  readonly simResult = computed(() => simulateFinancialArchitecture(this.simInput()));

  setMarket(market: 'PL' | 'EU'): void {
    this.simInput.update((curr) => ({ ...curr, b2bMarket: market }));
  }

  updateNumberField(
    field: 'b2bHourlyRatePln' | 'b2bHourlyRateEur' | 'slaClientsCount' | 'slaRatePerClientPln',
    event: Event
  ): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.simInput.update((curr) => ({ ...curr, [field]: val }));
  }

  updateTaxRegime(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as FinancialSimulationInput['taxRegime'];
    this.simInput.update((curr) => ({ ...curr, taxRegime: val }));
  }

  speakFinancialSummary(): void {
    const res = this.simResult();
    this.speakText.emit(
      `Model finansowy 60 na 30 na 10 generuje lacznie ${res.totalMonthlyGrossNetPln} zlotych netto miesiecznie w czterech transzach: piatego, dziesiatego, osiemnastego i dwudziestego piatego dnia miesiaca. Po opodatkowaniu stawa ${res.effectiveTaxRatePercent} procent pozostaje ${res.netDisposablePln} zlotych.`
    );
  }
}
