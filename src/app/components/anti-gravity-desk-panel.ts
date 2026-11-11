import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  ANTI_GRAVITY_HARDWARE_UNITS,
  AudienceLevel,
  calculateAntiGravityPowerBudget,
} from '../domain/architecture-logic';

@Component({
  selector: 'app-anti-gravity-desk-panel',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <section
        aria-labelledby="anti-gravity-heading"
        class="rounded-xl border p-6 sm:p-8 transition-colors"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
        [class.bg-slate-900]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p class="text-xs font-mono text-slate-400">
              Sekcja 1.D · Architektura Sprzetowa Biurka Anti-Gravity · Stacjonarna ~1000W &amp; Mobilna ~6 kg (13.7h Off-Grid)
            </p>
            <h2
              id="anti-gravity-heading"
              class="mt-1 text-xl sm:text-2xl font-bold tracking-tight balance-text"
              [class.text-[#D8ED00]]="highContrast()"
              [class.text-white]="!highContrast()"
            >
              04. Konfigurator Energetyczny i Wagowy Biurka Anti-Gravity (Mission Control &amp; Field Kit)
            </h2>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="applyPreset('stationary')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="operatingMode() === 'stationary'"
              [class.text-[#130E17]]="operatingMode() === 'stationary'"
              [class.border-[#D8ED00]]="operatingMode() === 'stationary'"
              [class.bg-slate-800]="operatingMode() !== 'stationary'"
              [class.text-slate-200]="operatingMode() !== 'stationary'"
              [class.border-slate-700]="operatingMode() !== 'stationary'"
            >
              <mat-icon class="text-base leading-none">desktop_windows</mat-icon>
              <span>Tryb Stacjonarny (~1000W)</span>
            </button>
            <button
              type="button"
              (click)="applyPreset('mobile')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="operatingMode() === 'mobile'"
              [class.text-[#130E17]]="operatingMode() === 'mobile'"
              [class.border-[#D8ED00]]="operatingMode() === 'mobile'"
              [class.bg-slate-800]="operatingMode() !== 'mobile'"
              [class.text-slate-200]="operatingMode() !== 'mobile'"
              [class.border-slate-700]="operatingMode() !== 'mobile'"
            >
              <mat-icon class="text-base leading-none">solar_power</mat-icon>
              <span>Tryb Mobilny Off-Grid (~6 kg)</span>
            </button>
          </div>
        </div>

        <!-- Audience explanation -->
        <p class="mt-4 text-sm leading-relaxed text-slate-300">
          @switch (audience()) {
            @case ('professor') {
              Heterogeniczny klaster obliczeniowy i wizualizacyjny o szczytowym bilansie mocy ~1000W w trybie stacjonarnym (Mission Control) oraz wydzielonym podzbiorze mobilnym (~5.98 kg) zasilanym hybrydowym magazynem LiFePO4/Li-Ion (192Wh + 148Wh = 340Wh) ze wspomaganiem fotowoltaicznym MPPT (60W/100W) gwarantujacym 13.7h autonomii pomiarowej w terenie.
            }
            @case ('architect') {
              Separacja obciazen: MacBook Pro i9 (96W) + Acer i5 12-core (90W, dotyk PD193QT) + Samsung 27" TB5 (240W) + Projektor 120" 4K (250W) w bazie; w terenie lekki zestaw MacBook Pro M1 (wezel Tailscale/Jump Desktop) + iPad Pro M5 + MatePad PaperMatte + Acer Dual 2x18.5" zasilany z Anker SOLIX C200.
            }
            @case ('layperson') {
              Stanowisko pracy dziala na dwa sposoby: w biurze jako pelne centrum dowodzenia z duzymi ekranami i projektorem (ok. 1000W), a w podrozy jako lekki zestaw (ok. 6 kg w plecaku) ze stacja bateryjna i skladanym panelem slonecznym, ktory pozwala pracowac przez 13,7 godziny bez gniazdka elektrycznego.
            }
          }
        </p>

        <!-- Summary KPI Strip (4 columns) -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Moc Aktywnych Jednostek</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-[#D8ED00]">
              {{ powerSummary().activeWatts }} W
            </p>
            <p class="mt-1 text-xs font-mono text-slate-400">
              Pelny profil stacjonarny: {{ powerSummary().stationaryTotalWatts }} W
            </p>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Masa Zestawu Wybranych Urzadzen</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-white">
              {{ powerSummary().mobileWeightKg | number:'1.2-2' }} kg
            </p>
            <p class="mt-1 text-xs font-mono" [class.text-emerald-400]="powerSummary().withinMobileWeightTarget" [class.text-amber-400]="!powerSummary().withinMobileWeightTarget">
              {{ powerSummary().withinMobileWeightTarget ? 'W limicie mobilnym (~6 kg)' : 'Profil stacjonarny (>6.5 kg)' }}
            </p>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Magazyn Energii Off-Grid</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-white">
              {{ powerSummary().batteryCapacityWh }} Wh
            </p>
            <p class="mt-1 text-xs font-mono text-slate-400">
              Anker SOLIX C200 (192Wh) + 2x Solar (148Wh)
            </p>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <span class="text-xs font-mono text-slate-400">Autonomia Pracy w Terenie</span>
            <p class="mt-1 text-2xl font-bold font-mono tabular-nums text-[#D8ED00]">
              {{ powerSummary().estimatedOffGridHours }} h
            </p>
            <p class="mt-1 text-xs font-mono text-emerald-400">
              Panel PV: {{ solarWatts() }}W (uzysk ~{{ powerSummary().effectiveSolarYieldWatts }}W)
            </p>
          </div>
        </div>

        <!-- Solar Panel Optimization Selector -->
        <div class="mt-6 rounded-lg border border-slate-800 bg-slate-950/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-semibold text-white">
              Optymalizacja Zasilania Solarnego Off-Grid (22.5W -&gt; 60W / 100W)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Wybierz moc panelu fotowoltaicznego wspolpracujacego ze stacja Anker SOLIX C200 LiFePO4 podczas inspekcji w Ustce / GPZ Wierzbiecino.
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            @for (panel of solarOptions; track panel.watts) {
              <button
                type="button"
                (click)="setSolarWatts(panel.watts)"
                class="px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#D8ED00]]="solarWatts() === panel.watts"
                [class.text-[#130E17]]="solarWatts() === panel.watts"
                [class.border-[#D8ED00]]="solarWatts() === panel.watts"
                [class.bg-slate-900]="solarWatts() !== panel.watts"
                [class.text-slate-300]="solarWatts() !== panel.watts"
                [class.border-slate-700]="solarWatts() !== panel.watts"
              >
                {{ panel.label }}
              </button>
            }
          </div>
        </div>

        <!-- Hardware Units Interactive Matrix -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (unit of hardwareUnits; track unit.id) {
            @let isSelected = selectedUnitIds().includes(unit.id);
            <div
              class="rounded-lg border p-4 flex flex-col justify-between transition-colors"
              [class.border-[#D8ED00]]="isSelected"
              [class.bg-slate-950]="isSelected"
              [class.border-slate-800]="!isSelected"
              [class.bg-slate-950/40]="!isSelected"
            >
              <div>
                <div class="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <span>{{ getCategoryLabel(unit.category) }}</span>
                  <span class="tabular-nums font-semibold text-slate-200">{{ unit.watts }}W · {{ unit.weightKg }} kg</span>
                </div>
                <h3 class="mt-1.5 text-sm font-bold text-white">{{ unit.name }}</h3>
                <p class="mt-0.5 text-xs font-mono text-slate-400">{{ unit.spec }}</p>
                <p class="mt-2 text-xs text-slate-300 leading-relaxed">{{ unit.roleDescription }}</p>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span class="text-xs font-mono" [class.text-[#D8ED00]]="isSelected" [class.text-slate-500]="!isSelected">
                  {{ isSelected ? 'AKTYWNY W BILANSIE' : 'WYLACZONY' }}
                </span>
                <button
                  type="button"
                  (click)="toggleUnit(unit.id)"
                  class="px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-slate-800]="isSelected"
                  [class.border-slate-600]="isSelected"
                  [class.text-white]="isSelected"
                  [class.bg-slate-900]="!isSelected"
                  [class.border-slate-800]="!isSelected"
                  [class.text-slate-400]="!isSelected"
                >
                  {{ isSelected ? 'Odlacz z bilansu' : 'Dolacz do bilansu' }}
                </button>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class AntiGravityDeskPanel {
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();
  readonly speakText = output<string>();

  readonly hardwareUnits = ANTI_GRAVITY_HARDWARE_UNITS;
  readonly operatingMode = signal<'stationary' | 'mobile'>('mobile');
  readonly solarWatts = signal<22.5 | 60 | 100>(60);

  readonly solarOptions: { watts: 22.5 | 60 | 100; label: string }[] = [
    { watts: 22.5, label: '22.5W (Bazowy)' },
    { watts: 60, label: '60W (Optymalny 13.7h)' },
    { watts: 100, label: '100W (Ekspedycyjny)' },
  ];

  readonly selectedUnitIds = signal<string[]>(
    ANTI_GRAVITY_HARDWARE_UNITS.filter((u) => u.defaultMobile).map((u) => u.id)
  );

  readonly powerSummary = computed(() =>
    calculateAntiGravityPowerBudget(
      this.hardwareUnits,
      this.selectedUnitIds(),
      this.operatingMode(),
      this.solarWatts()
    )
  );

  applyPreset(mode: 'stationary' | 'mobile'): void {
    this.operatingMode.set(mode);
    if (mode === 'stationary') {
      this.selectedUnitIds.set(
        this.hardwareUnits.filter((u) => u.defaultStationary).map((u) => u.id)
      );
    } else {
      this.selectedUnitIds.set(
        this.hardwareUnits.filter((u) => u.defaultMobile).map((u) => u.id)
      );
    }
  }

  setSolarWatts(watts: 22.5 | 60 | 100): void {
    this.solarWatts.set(watts);
  }

  toggleUnit(id: string): void {
    this.selectedUnitIds.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  getCategoryLabel(cat: 'compute' | 'display' | 'power' | 'infrastructure'): string {
    switch (cat) {
      case 'compute':
        return 'JEDNOSTKA OBLICZENIOWA';
      case 'display':
        return 'WYSWIETLACZ / PROJEKCJA';
      case 'power':
        return 'ZASILANIE OFF-GRID';
      default:
        return 'INFRASTRUKTURA';
    }
  }
}
