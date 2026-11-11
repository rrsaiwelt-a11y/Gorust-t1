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
  ArchitectureDiagramSpec,
  AudienceLevel,
  calculateRoadmapExpansionImpact,
  DiagramFolderId,
  FUTURE_EXPANSION_ROADMAP,
  FutureExpansionModule,
  PROJECT_DIAGRAMS_CATALOG,
} from '../domain/architecture-logic';

@Component({
  selector: 'app-diagrams-roadmap-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DecimalPipe],
  template: `
    <section
      id="sekcja-diagramy-roadmapa"
      class="space-y-8"
      aria-labelledby="heading-diagrams-roadmap"
    >
      <!-- Section Header -->
      <div
        class="p-6 rounded-2xl border transition-colors"
        [class.bg-[#111927]]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-2 max-w-3xl">
            <p
              class="text-xs font-mono uppercase tracking-wider"
              [class.text-sky-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              Sekcja 5 · Repozytorium Diagramow (2 Foldery) &amp; Przyszle Zastosowania (2027–2030)
            </p>
            <h2
              id="heading-diagrams-roadmap"
              class="text-2xl sm:text-3xl font-bold tracking-tight"
              [class.text-slate-50]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              Architektura Wizualna: Folder Ekspertow vs Folder Odbiorcow + Roadmapa Rozbudowy
            </h2>
            <p
              class="text-sm leading-relaxed"
              [class.text-slate-300]="!highContrast()"
              [class.text-white]="highContrast()"
            >
              Wszystkie diagramy projektowe zostaly fizycznie i funkcjonalnie podzielone na dwa dedykowane foldery
              repozytorium: <strong>Folder 01 dla Ekspertow (Architekci, SecOps/NIS2, Smart Grid)</strong> oraz
              <strong>Folder 02 dla Przegladajacych, Komentujacych i Odbiorcow Oprogramowania</strong>, wraz z
              interaktywnym symulatorem przyszlych zastosowan i rozbudowy (Horyzont 2027–2030).
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              (click)="narrateCurrentDiagram()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
              [class.bg-slate-800]="!highContrast()"
              [class.text-slate-100]="!highContrast()"
              [class.border-slate-700]="!highContrast()"
              [class.hover:bg-slate-700]="!highContrast()"
              [class.bg-[#D8ED00]]="highContrast()"
              [class.text-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <mat-icon class="!w-4 !h-4 !text-[16px]">record_voice_over</mat-icon>
              <span>Odsłuchaj opis diagramu (TTS)</span>
            </button>

            <button
              type="button"
              (click)="toggleMermaidCode()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
              [class.bg-slate-900]="!highContrast()"
              [class.text-sky-300]="!highContrast()"
              [class.border-sky-500/40]="!highContrast()"
              [class.hover:bg-slate-800]="!highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <mat-icon class="!w-4 !h-4 !text-[16px]">code</mat-icon>
              <span>{{ showMermaidSource() ? 'Ukryj kod Mermaid.js' : 'Pokaz kod Mermaid.js' }}</span>
            </button>
          </div>
        </div>

        <!-- Two-Folder Switcher -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <!-- Folder 1: Experts -->
          <button
            type="button"
            (click)="selectFolder('experts_architects_secops_smartgrid')"
            class="text-left p-5 rounded-xl border transition-all cursor-pointer flex items-start gap-4"
            [class.bg-sky-950/40]="!highContrast() && activeFolder() === 'experts_architects_secops_smartgrid'"
            [class.border-sky-400]="!highContrast() && activeFolder() === 'experts_architects_secops_smartgrid'"
            [class.bg-slate-900/70]="!highContrast() && activeFolder() !== 'experts_architects_secops_smartgrid'"
            [class.border-slate-800]="!highContrast() && activeFolder() !== 'experts_architects_secops_smartgrid'"
            [class.bg-[#D8ED00]]="highContrast() && activeFolder() === 'experts_architects_secops_smartgrid'"
            [class.text-[#130E17]]="highContrast() && activeFolder() === 'experts_architects_secops_smartgrid'"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <div
              class="p-3 rounded-xl shrink-0"
              [class.bg-sky-500/20]="!highContrast()"
              [class.text-sky-300]="!highContrast()"
              [class.bg-[#130E17]]="highContrast() && activeFolder() === 'experts_architects_secops_smartgrid'"
              [class.text-[#D8ED00]]="highContrast() && activeFolder() === 'experts_architects_secops_smartgrid'"
            >
              <mat-icon>folder_special</mat-icon>
            </div>
            <div class="space-y-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs uppercase tracking-wider opacity-85">
                  FOLDER 01 · docs/diagramy/01-eksperci-architekci-secops-smartgrid/
                </span>
                <span class="font-mono text-xs font-bold tabular-nums">4 Diagramy</span>
              </div>
              <h3 class="text-base font-bold">
                Dla Ekspertow: Architekci Oprogramowania, SecOps / NIS2 &amp; Smart Grid
              </h3>
              <p class="text-xs leading-relaxed opacity-85">
                Architektura C4 Zero-Trust (Rust/Go/Python), Topologia Optyczna DWDM &lt; 5 ms (3.84 ms) dla GPZ 400 kV i
                Baltica 2 &amp; 3, Algorytm Walidacji Sygnalu AQI/dCi (Flatline &amp; RH &gt; 85%) oraz Szyna Zasilania Biurka Anti-Gravity.
              </p>
            </div>
          </button>

          <!-- Folder 2: Reviewers, Commentators & Recipients -->
          <button
            type="button"
            (click)="selectFolder('reviewers_commentators_recipients')"
            class="text-left p-5 rounded-xl border transition-all cursor-pointer flex items-start gap-4"
            [class.bg-emerald-950/40]="!highContrast() && activeFolder() === 'reviewers_commentators_recipients'"
            [class.border-emerald-400]="!highContrast() && activeFolder() === 'reviewers_commentators_recipients'"
            [class.bg-slate-900/70]="!highContrast() && activeFolder() !== 'reviewers_commentators_recipients'"
            [class.border-slate-800]="!highContrast() && activeFolder() !== 'reviewers_commentators_recipients'"
            [class.bg-[#D8ED00]]="highContrast() && activeFolder() === 'reviewers_commentators_recipients'"
            [class.text-[#130E17]]="highContrast() && activeFolder() === 'reviewers_commentators_recipients'"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <div
              class="p-3 rounded-xl shrink-0"
              [class.bg-emerald-500/20]="!highContrast()"
              [class.text-emerald-300]="!highContrast()"
              [class.bg-[#130E17]]="highContrast() && activeFolder() === 'reviewers_commentators_recipients'"
              [class.text-[#D8ED00]]="highContrast() && activeFolder() === 'reviewers_commentators_recipients'"
            >
              <mat-icon>folder_shared</mat-icon>
            </div>
            <div class="space-y-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-xs uppercase tracking-wider opacity-85">
                  FOLDER 02 · docs/diagramy/02-odbiorcy-komentujacy-interesariusze/
                </span>
                <span class="font-mono text-xs font-bold tabular-nums">4 Diagramy</span>
              </div>
              <h3 class="text-base font-bold">
                Dla Przegladajacych, Komentujacych i Odbiorcow Oprogramowania
              </h3>
              <p class="text-xs leading-relaxed opacity-85">
                Sciezka Obywatela przy Audiokiosku "Dostepna Gmina" (11 000 PLN), Mapa Korzysci Ustka–Slupsk–Trojmiasto,
                Przejrzysty Schemat Finansowy 60/30/10 (4 wyplaty) oraz Przewodnik Zaufania dla Sygnalistow i Prawnikow.
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Diagram Selector Tabs within Active Folder -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Column: Diagram List in Active Folder (4 cols) -->
        <div class="lg:col-span-4 space-y-3">
          <div class="px-1 flex items-center justify-between">
            <h3
              class="text-xs font-mono uppercase tracking-wider font-semibold"
              [class.text-slate-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              Zawartosc Folderu ({{ filteredDiagrams().length }} pliki diagramow)
            </h3>
            <span
              class="text-xs font-mono"
              [class.text-slate-400]="!highContrast()"
              [class.text-white]="highContrast()"
            >
              Wybierz diagram do inspekcji
            </span>
          </div>

          @for (diag of filteredDiagrams(); track diag.id) {
            <button
              type="button"
              (click)="selectDiagram(diag.id)"
              class="w-full text-left p-4 rounded-xl border transition-all cursor-pointer space-y-1.5"
              [class.bg-slate-900]="!highContrast() && selectedDiagram().id !== diag.id"
              [class.border-slate-800]="!highContrast() && selectedDiagram().id !== diag.id"
              [class.bg-slate-800/90]="!highContrast() && selectedDiagram().id === diag.id"
              [class.border-sky-400]="!highContrast() && selectedDiagram().id === diag.id"
              [class.bg-[#130E17]]="highContrast() && selectedDiagram().id !== diag.id"
              [class.bg-[#D8ED00]]="highContrast() && selectedDiagram().id === diag.id"
              [class.text-[#130E17]]="highContrast() && selectedDiagram().id === diag.id"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <div class="flex items-center justify-between gap-2 text-xs font-mono">
                <span class="font-bold">{{ diag.code }} · {{ diag.domainCategory }}</span>
              </div>
              <p class="text-sm font-bold leading-snug">
                {{ diag.title }}
              </p>
              <p class="text-xs opacity-80 line-clamp-2">
                {{ diag.targetAudienceTag }}
              </p>
            </button>
          }
        </div>

        <!-- Right Column: Visual Interactive Diagram Canvas + Connections + Review Checklist (8 cols) -->
        <div
          class="lg:col-span-8 p-6 rounded-2xl border space-y-6"
          [class.bg-[#111927]]="!highContrast()"
          [class.border-slate-800]="!highContrast()"
          [class.bg-[#130E17]]="highContrast()"
          [class.border-[#D8ED00]]="highContrast()"
        >
          @let current = selectedDiagram();

          <!-- Selected Diagram Metadata Header -->
          <div class="border-b pb-4 space-y-2" [class.border-slate-800]="!highContrast()" [class.border-[#D8ED00]]="highContrast()">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span
                [class.text-sky-400]="!highContrast()"
                [class.text-[#D8ED00]]="highContrast()"
              >
                {{ current.code }} · {{ current.folderPath }}
              </span>
              <span
                [class.text-emerald-400]="!highContrast()"
                [class.text-white]="highContrast()"
              >
                Domena: {{ current.domainCategory }}
              </span>
            </div>
            <h3 class="text-xl font-bold">{{ current.title }}</h3>
            <p
              class="text-xs font-mono"
              [class.text-slate-400]="!highContrast()"
              [class.text-white]="highContrast()"
            >
              Adresaci: {{ current.targetAudienceTag }}
            </p>
            <p
              class="text-sm leading-relaxed pt-1"
              [class.text-slate-300]="!highContrast()"
              [class.text-white]="highContrast()"
            >
              {{ getDiagramSummary(current) }}
            </p>
          </div>

          <!-- Visual 4-Node Architecture Pipeline Canvas -->
          <div class="space-y-3">
            <h4
              class="text-xs font-mono uppercase tracking-wider"
              [class.text-slate-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              Interaktywny Schemat Wezlow i Przeplywow (4 warstwy architektoniczne)
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              @for (node of current.nodes; track node.id) {
                <div
                  class="p-4 rounded-xl border flex flex-col justify-between gap-3 relative"
                  [class.bg-slate-900/90]="!highContrast()"
                  [class.border-slate-700]="!highContrast()"
                  [class.bg-[#130E17]]="highContrast()"
                  [class.border-[#D8ED00]]="highContrast()"
                >
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs font-mono">
                      <span
                        class="font-bold"
                        [class.text-sky-400]="!highContrast()"
                        [class.text-[#D8ED00]]="highContrast()"
                      >
                        {{ node.stepNumber }}
                      </span>
                    </div>
                    <h5 class="text-sm font-bold leading-snug">
                      {{ node.title }}
                    </h5>
                    <p
                      class="text-xs leading-relaxed"
                      [class.text-slate-300]="!highContrast()"
                      [class.text-white]="highContrast()"
                    >
                      {{ node.subtitle }}
                    </p>
                  </div>

                  <div
                    class="pt-2 border-t text-xs font-mono font-semibold tabular-nums flex items-center gap-1.5"
                    [class.border-slate-800]="!highContrast()"
                    [class.text-emerald-400]="!highContrast()"
                    [class.border-[#D8ED00]]="highContrast()"
                    [class.text-[#D8ED00]]="highContrast()"
                  >
                    <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">verified</mat-icon>
                    <span>{{ node.metricBadge }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Step-by-Step Signal / Process Flow & Review Checklist -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <!-- Connections / Data & Decision Flow -->
            <div
              class="p-4 rounded-xl border space-y-3"
              [class.bg-slate-900/60]="!highContrast()"
              [class.border-slate-800]="!highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <h4
                class="text-xs font-mono uppercase tracking-wider flex items-center gap-2"
                [class.text-sky-400]="!highContrast()"
                [class.text-[#D8ED00]]="highContrast()"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">account_tree</mat-icon>
                <span>Sciezka Przeplywu Danych i Weryfikacji</span>
              </h4>
              <ol class="space-y-2 text-xs leading-relaxed">
                @for (conn of current.flowConnections; track conn; let stepIdx = $index) {
                  <li class="flex items-start gap-2.5">
                    <span
                      class="font-mono font-bold tabular-nums shrink-0"
                      [class.text-sky-400]="!highContrast()"
                      [class.text-[#D8ED00]]="highContrast()"
                    >
                      0{{ stepIdx + 1 }}.
                    </span>
                    <span
                      [class.text-slate-200]="!highContrast()"
                      [class.text-white]="highContrast()"
                    >
                      {{ conn }}
                    </span>
                  </li>
                }
              </ol>
            </div>

            <!-- Review / Audit / Commentator Points -->
            <div
              class="p-4 rounded-xl border space-y-3"
              [class.bg-slate-900/60]="!highContrast()"
              [class.border-slate-800]="!highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <h4
                class="text-xs font-mono uppercase tracking-wider flex items-center gap-2"
                [class.text-emerald-400]="!highContrast()"
                [class.text-[#D8ED00]]="highContrast()"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">fact_check</mat-icon>
                <span>Lista Kontrolna (Audyt / Komentarze / Odbior)</span>
              </h4>
              <ul class="space-y-2 text-xs leading-relaxed">
                @for (point of current.reviewChecklist; track point) {
                  <li class="flex items-start gap-2.5">
                    <mat-icon
                      class="!w-4 !h-4 !text-[15px] shrink-0 mt-0.5"
                      [class.text-emerald-400]="!highContrast()"
                      [class.text-[#D8ED00]]="highContrast()"
                    >
                      check_circle
                    </mat-icon>
                    <span
                      [class.text-slate-200]="!highContrast()"
                      [class.text-white]="highContrast()"
                    >
                      {{ point }}
                    </span>
                  </li>
                }
              </ul>
            </div>
          </div>

          <!-- Optional Mermaid Source Code Block -->
          @if (showMermaidSource()) {
            <div
              class="p-4 rounded-xl border space-y-2 font-mono text-xs"
              [class.bg-slate-950]="!highContrast()"
              [class.border-slate-800]="!highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <div class="flex items-center justify-between">
                <span
                  [class.text-sky-400]="!highContrast()"
                  [class.text-[#D8ED00]]="highContrast()"
                >
                  Zrodlo diagramu Mermaid.js ({{ current.folderPath }})
                </span>
                <span class="opacity-75">Gotowe do wklejenia w GitLab / GitHub / Notion</span>
              </div>
              <pre
                class="overflow-x-auto p-3 rounded-lg leading-relaxed"
                [class.bg-slate-900]="!highContrast()"
                [class.text-slate-200]="!highContrast()"
                [class.bg-black]="highContrast()"
                [class.text-[#D8ED00]]="highContrast()"
              ><code>{{ current.mermaidSource }}</code></pre>
            </div>
          }
        </div>
      </div>

      <!-- PART B: FUTURE APPLICATIONS & EXPANSION POSSIBILITIES (ROADMAP 2027-2030) -->
      <div
        class="p-6 rounded-2xl border space-y-6"
        [class.bg-[#111927]]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
      >
        <div
          class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5"
          [class.border-slate-800]="!highContrast()"
          [class.border-[#D8ED00]]="highContrast()"
        >
          <div class="space-y-1.5 max-w-3xl">
            <p
              class="text-xs font-mono uppercase tracking-wider"
              [class.text-emerald-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              Folder 03 · docs/diagramy/03-przyszle-zastosowania-i-rozbudowa/roadmapa-2027-2030.md
            </p>
            <h3 class="text-xl sm:text-2xl font-bold">
              Przyszle Zastosowania i Przyszle Mozliwosci Rozbudowy (Roadmapa 2027–2030)
            </h3>
            <p
              class="text-sm leading-relaxed"
              [class.text-slate-300]="!highContrast()"
              [class.text-white]="highContrast()"
            >
              Wybierz moduly rozwojowe ponizej, aby przeliczyc skumulowany budzet inwestycyjny B+R (CAPEX),
              dofinansowanie z programu <strong>Fundusze Europejskie dla Pomorza 1.1 B+R (80% pokrycia)</strong>
              oraz nowy powtarzalny przychod abonamentowy SLA (MRR / ARR) i liczbe objetych gmin/wezlow.
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <button
              type="button"
              (click)="selectAllRoadmapModules()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
              [class.bg-slate-800]="!highContrast()"
              [class.text-slate-100]="!highContrast()"
              [class.border-slate-700]="!highContrast()"
              [class.bg-[#D8ED00]]="highContrast()"
              [class.text-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <mat-icon class="!w-4 !h-4 !text-[16px]">done_all</mat-icon>
              <span>Aktywuj pełną roadmapę (5 modułów)</span>
            </button>
          </div>
        </div>

        <!-- Impact Simulator KPI Strip -->
        @let impact = roadmapImpact();
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            class="p-4 rounded-xl border space-y-1"
            [class.bg-slate-900/80]="!highContrast()"
            [class.border-slate-800]="!highContrast()"
            [class.bg-[#130E17]]="highContrast()"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <p class="text-xs font-mono opacity-80">Skumulowany CAPEX B+R ({{ impact.selectedCount }} z 5 modulow)</p>
            <p class="text-2xl font-bold font-mono tabular-nums">
              {{ impact.totalCapexPln | number:'1.0-0' }} PLN
            </p>
            <p class="text-xs opacity-75">
              Wklad wlasny 20%: <span class="font-mono tabular-nums">{{ impact.ownContributionPln | number:'1.0-0' }} PLN</span>
            </p>
          </div>

          <div
            class="p-4 rounded-xl border space-y-1"
            [class.bg-slate-900/80]="!highContrast()"
            [class.border-slate-800]="!highContrast()"
            [class.bg-[#130E17]]="highContrast()"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <p class="text-xs font-mono opacity-80">Grant FE Pomorza 1.1 B+R (80%)</p>
            <p
              class="text-2xl font-bold font-mono tabular-nums"
              [class.text-sky-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              {{ impact.fePomorzaGrantCoveragePln | number:'1.0-0' }} PLN
            </p>
            <p class="text-xs opacity-75">Bezzwrotne finansowanie badawczo-rozwojowe</p>
          </div>

          <div
            class="p-4 rounded-xl border space-y-1"
            [class.bg-slate-900/80]="!highContrast()"
            [class.border-slate-800]="!highContrast()"
            [class.bg-[#130E17]]="highContrast()"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <p class="text-xs font-mono opacity-80">Dodatkowy Przychod Abonamentowy SLA</p>
            <p
              class="text-2xl font-bold font-mono tabular-nums"
              [class.text-emerald-400]="!highContrast()"
              [class.text-[#D8ED00]]="highContrast()"
            >
              +{{ impact.projectedAdditionalMrrPln | number:'1.0-0' }} PLN/m-c
            </p>
            <p class="text-xs opacity-75">
              Rocznie (ARR): <span class="font-mono tabular-nums">+{{ impact.projectedAnnualArrPln | number:'1.0-0' }} PLN/rok</span>
            </p>
          </div>

          <div
            class="p-4 rounded-xl border space-y-1"
            [class.bg-slate-900/80]="!highContrast()"
            [class.border-slate-800]="!highContrast()"
            [class.bg-[#130E17]]="highContrast()"
            [class.border-[#D8ED00]]="highContrast()"
          >
            <p class="text-xs font-mono opacity-80">Nowe Gminy, Porty i Wezly Sieciowe</p>
            <p class="text-2xl font-bold font-mono tabular-nums">
              {{ impact.totalNewNodesAndMunicipalities }} wdrozen
            </p>
            <p class="text-xs opacity-75">Srednia gotowosc docelowa: TRL {{ impact.averageTargetTrl }}</p>
          </div>
        </div>

        <!-- 5 Future Expansion Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (mod of roadmapModules; track mod.id) {
            @let isSelected = isModuleSelected(mod.id);
            <article
              class="p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all"
              [class.bg-slate-900/90]="!highContrast() && isSelected"
              [class.border-emerald-500/60]="!highContrast() && isSelected"
              [class.bg-slate-950/60]="!highContrast() && !isSelected"
              [class.border-slate-800]="!highContrast() && !isSelected"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
            >
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2 text-xs font-mono">
                  <span
                    class="font-bold"
                    [class.text-emerald-400]="!highContrast()"
                    [class.text-[#D8ED00]]="highContrast()"
                  >
                    {{ mod.horizon }} · TRL {{ mod.trlCurrent }} → TRL {{ mod.trlTarget }}
                  </span>
                  <button
                    type="button"
                    (click)="toggleRoadmapModule(mod.id)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer"
                    [class.bg-emerald-500/20]="!highContrast() && isSelected"
                    [class.text-emerald-300]="!highContrast() && isSelected"
                    [class.border-emerald-500/40]="!highContrast() && isSelected"
                    [class.bg-slate-800]="!highContrast() && !isSelected"
                    [class.text-slate-300]="!highContrast() && !isSelected"
                    [class.border-slate-700]="!highContrast() && !isSelected"
                    [class.bg-[#D8ED00]]="highContrast() && isSelected"
                    [class.text-[#130E17]]="highContrast() && isSelected"
                    [class.border-[#D8ED00]]="highContrast()"
                  >
                    <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">
                      {{ isSelected ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                    <span>{{ isSelected ? 'W symulacji' : 'Dodaj do planu' }}</span>
                  </button>
                </div>

                <h4 class="text-base font-bold leading-snug">
                  {{ mod.title }}
                </h4>

                <!-- Perspective-Specific Description -->
                <p
                  class="text-xs leading-relaxed"
                  [class.text-slate-300]="!highContrast()"
                  [class.text-white]="highContrast()"
                >
                  {{ getPerspectiveDescription(mod) }}
                </p>

                <!-- Key Deliverables -->
                <ul
                  class="space-y-1.5 pt-2 border-t text-xs"
                  [class.border-slate-800]="!highContrast()"
                  [class.border-[#D8ED00]]="highContrast()"
                >
                  @for (item of mod.keyDeliverables; track item) {
                    <li class="flex items-start gap-2">
                      <mat-icon
                        class="!w-3.5 !h-3.5 !text-[14px] shrink-0 mt-0.5"
                        [class.text-sky-400]="!highContrast()"
                        [class.text-[#D8ED00]]="highContrast()"
                      >
                        arrow_right
                      </mat-icon>
                      <span
                        [class.text-slate-300]="!highContrast()"
                        [class.text-white]="highContrast()"
                      >
                        {{ item }}
                      </span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Financial & Scale Footer -->
              <div
                class="pt-3 border-t flex items-center justify-between text-xs font-mono tabular-nums"
                [class.border-slate-800]="!highContrast()"
                [class.border-[#D8ED00]]="highContrast()"
              >
                <span>CAPEX: {{ mod.estimatedCapexPln | number:'1.0-0' }} PLN</span>
                <span
                  class="font-bold"
                  [class.text-emerald-400]="!highContrast()"
                  [class.text-[#D8ED00]]="highContrast()"
                >
                  SLA: +{{ mod.projectedMonthlyMrrPln | number:'1.0-0' }} PLN/m-c
                </span>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class DiagramsRoadmapPanel {
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();
  readonly speakText = output<string>();

  readonly allDiagrams: ArchitectureDiagramSpec[] = PROJECT_DIAGRAMS_CATALOG;
  readonly roadmapModules: FutureExpansionModule[] = FUTURE_EXPANSION_ROADMAP;

  readonly activeFolder = signal<DiagramFolderId>('experts_architects_secops_smartgrid');
  readonly selectedDiagramId = signal<string>('exp_c4_zero_trust');
  readonly showMermaidSource = signal<boolean>(false);

  readonly selectedRoadmapIds = signal<string[]>(
    FUTURE_EXPANSION_ROADMAP.map((m) => m.id)
  );

  readonly filteredDiagrams = computed(() =>
    this.allDiagrams.filter((d) => d.folderId === this.activeFolder())
  );

  readonly selectedDiagram = computed<ArchitectureDiagramSpec>(() => {
    const inFolder = this.filteredDiagrams();
    const found = inFolder.find((d) => d.id === this.selectedDiagramId());
    return found ?? inFolder[0] ?? this.allDiagrams[0];
  });

  readonly roadmapImpact = computed(() =>
    calculateRoadmapExpansionImpact(this.selectedRoadmapIds())
  );

  selectFolder(folderId: DiagramFolderId): void {
    this.activeFolder.set(folderId);
    const firstInFolder = this.allDiagrams.find((d) => d.folderId === folderId);
    if (firstInFolder) {
      this.selectedDiagramId.set(firstInFolder.id);
    }
  }

  selectDiagram(diagramId: string): void {
    this.selectedDiagramId.set(diagramId);
  }

  toggleMermaidCode(): void {
    this.showMermaidSource.update((v) => !v);
  }

  isModuleSelected(moduleId: string): boolean {
    return this.selectedRoadmapIds().includes(moduleId);
  }

  toggleRoadmapModule(moduleId: string): void {
    this.selectedRoadmapIds.update((current) => {
      if (current.includes(moduleId)) {
        return current.length > 1 ? current.filter((id) => id !== moduleId) : current;
      }
      return [...current, moduleId];
    });
  }

  selectAllRoadmapModules(): void {
    this.selectedRoadmapIds.set(this.roadmapModules.map((m) => m.id));
  }

  getDiagramSummary(diag: ArchitectureDiagramSpec): string {
    const level = this.audience();
    if (level === 'professor') {
      return diag.summary.professor;
    }
    if (level === 'architect') {
      return diag.summary.architect;
    }
    return diag.summary.layperson;
  }

  getPerspectiveDescription(mod: FutureExpansionModule): string {
    const level = this.audience();
    if (level === 'professor') {
      return mod.description.professor;
    }
    if (level === 'architect') {
      return mod.description.architect;
    }
    return mod.description.layperson;
  }

  narrateCurrentDiagram(): void {
    const diag = this.selectedDiagram();
    const folderLabel =
      diag.folderId === 'experts_architects_secops_smartgrid'
        ? 'Folder pierwszy dla ekspertów: architektów oprogramowania, specjalistów bezpieczeństwa sieci oraz Smart Grid.'
        : 'Folder drugi dla przeglądających, komentujących i odbiorców oprogramowania.';
    const text = `${folderLabel} Diagram ${diag.code}: ${diag.title}. ${this.getDiagramSummary(diag)}`;
    this.speakText.emit(text);
  }
}
