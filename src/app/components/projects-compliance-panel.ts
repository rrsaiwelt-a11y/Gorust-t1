import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  AudienceLevel,
  AuditBlock,
  calculateGovTechPoCBudget,
  computeDeterministicSha256Hex,
  sanitizeAndCreateAuditBlock,
} from '../domain/architecture-logic';

@Component({
  selector: 'app-projects-compliance-panel',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10">
      <!-- Section A: Platforma Legal Tech & Corporate Compliance (4 Moduly) -->
      <section
        aria-labelledby="legal-tech-heading"
        class="rounded-xl border p-6 sm:p-8 transition-colors"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
        [class.bg-slate-900]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p class="text-xs font-mono text-slate-400">
              Sekcja 1.A · Stos: Rust (Anonimizacja/Crypto) · Python (RAG Guardrails) · Go (API) · TypeScript
            </p>
            <h2
              id="legal-tech-heading"
              class="mt-1 text-xl sm:text-2xl font-bold tracking-tight balance-text"
              [class.text-[#D8ED00]]="highContrast()"
              [class.text-white]="!highContrast()"
            >
              01. Platforma Legal Tech &amp; Corporate Compliance (4 Moduly)
            </h2>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button
              type="button"
              (click)="speakSectionSummary('legal')"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              [class.bg-[#D8ED00]]="highContrast()"
              [class.text-[#130E17]]="highContrast()"
              [class.border-[#D8ED00]]="highContrast()"
              [class.bg-slate-800]="!highContrast()"
              [class.text-slate-100]="!highContrast()"
              [class.border-slate-700]="!highContrast()"
              aria-label="Odsluchaj opis platformy Legal Tech (TTS)"
            >
              <mat-icon class="text-base leading-none">volume_up</mat-icon>
              <span>Odsluchaj sekcje (TTS)</span>
            </button>
          </div>
        </div>

        <!-- 4 Documented Modules Grid -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (mod of legalModules; track mod.code) {
            <article
              class="rounded-lg border p-5 transition-colors"
              [class.border-[#D8ED00]/50]="highContrast()"
              [class.bg-[#130E17]]="highContrast()"
              [class.border-slate-800]="!highContrast()"
              [class.bg-slate-950/60]="!highContrast()"
            >
              <div class="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                <span>Modul ({{ mod.index }}) · {{ mod.code }}</span>
                <span>{{ mod.tech }}</span>
              </div>
              <h3
                class="mt-2 text-base font-bold"
                [class.text-[#D8ED00]]="highContrast()"
                [class.text-slate-100]="!highContrast()"
              >
                {{ mod.title }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-slate-300">
                @switch (audience()) {
                  @case ('professor') {
                    {{ mod.professorText }}
                  }
                  @case ('architect') {
                    {{ mod.architectText }}
                  }
                  @case ('layperson') {
                    {{ mod.laypersonText }}
                  }
                }
              </p>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-400">
                <span>Gwarancja: {{ mod.guarantee }}</span>
                <span aria-hidden="true">·</span>
                <span>Standard: {{ mod.standard }}</span>
              </div>
            </article>
          }
        </div>

        <!-- Interactive Rust Zero-Knowledge EXIF Scrubber & SHA-256 Append-Only Ledger -->
        <div class="mt-8 pt-6 border-t border-slate-800">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 class="text-base font-bold text-white">
                Symulator Warstwy Brzegowej Rust (Zero-Knowledge EXIF/PII) &amp; Rejestru SHA-256 Append-Only
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Przetestuj deterministyczne czyszczenie metadanych EXIF/XMP/OLE, maskowanie IP/PESEL i dopisanie bloku do niemodyfikowalnego lancucha audytowego.
              </p>
            </div>
            <span class="text-xs font-mono text-slate-400 shrink-0">
              Dlugosc lancucha: {{ auditChain().length }} blokow
            </span>
          </div>

          <form [formGroup]="auditForm" (ngSubmit)="appendAuditRecord()" class="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div class="lg:col-span-3">
              <label for="module-select" class="block text-xs font-medium text-slate-300 mb-1.5">
                Modul docelowy
              </label>
              <select
                id="module-select"
                formControlName="moduleCode"
                class="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D8ED00]"
              >
                <option value="SYGNALISTA_RUST_ZK">Kanal Sygnalistow (Rust Zero-Log)</option>
                <option value="RODO_RCP_DPIA">Rejestr RODO / RCP / Matryca DPIA</option>
                <option value="RAG_GUARDRAILS_PY">Analiza Klauzul RAG (Zero Retention)</option>
                <option value="CONTRACT_SHA256_GEN">Generator Umow (Wersjonowany Blok)</option>
              </select>
            </div>

            <div class="lg:col-span-6">
              <label for="payload-input" class="block text-xs font-medium text-slate-300 mb-1.5">
                Tresc zgloszenia lub klauzuli (tescik IP/PESEL do automatycznej anonimizacji)
              </label>
              <input
                id="payload-input"
                type="text"
                formControlName="rawText"
                placeholder="np. Zgloszenie naruszenia BHP z adresu 10.24.18.92, osoba: 84051209876"
                class="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D8ED00]"
              />
            </div>

            <div class="lg:col-span-3 flex items-end gap-2">
              <button
                type="submit"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 bg-[#D8ED00] text-[#130E17] hover:bg-[#e5f733]"
              >
                <mat-icon class="text-base leading-none">verified_user</mat-icon>
                <span>Oczysc EXIF i Dopisz SHA-256</span>
              </button>
            </div>
          </form>

          @if (validationMessage()) {
            <p class="mt-2 text-xs font-mono text-amber-400" role="alert">
              {{ validationMessage() }}
            </p>
          }

          <!-- Audit Chain Table -->
          <div class="mt-5 overflow-x-auto rounded-lg border border-slate-800">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-mono">
                  <th class="py-2.5 px-3">#</th>
                  <th class="py-2.5 px-3">Modul / Wersja</th>
                  <th class="py-2.5 px-3">Zanonimizowany Ladunek (Zero-PII / Zero-IP)</th>
                  <th class="py-2.5 px-3">Usuniete Metadane (Rust Edge)</th>
                  <th class="py-2.5 px-3">Skrot Lancucha SHA-256 (Append-Only)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/70">
                @for (block of auditChain(); track block.index) {
                  <tr class="hover:bg-slate-800/30">
                    <td class="py-2.5 px-3 font-mono tabular-nums text-slate-400">{{ block.index }}</td>
                    <td class="py-2.5 px-3 font-mono text-slate-200">
                      {{ block.moduleCode }} · {{ block.clauseVersion }}
                    </td>
                    <td class="py-2.5 px-3 text-slate-200">{{ block.payloadSummary }}</td>
                    <td class="py-2.5 px-3 font-mono text-emerald-400">
                      {{ block.strippedMetadataFields.join(' · ') }}
                    </td>
                    <td class="py-2.5 px-3 font-mono tabular-nums text-slate-300" [title]="block.sha256Hash">
                      {{ block.sha256Hash.slice(0, 16) }}...{{ block.sha256Hash.slice(-8) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Section B: Pilotaz GovTech / PPP "Dostepna Gmina - Cyfrowa Samopomoc" -->
      <section
        aria-labelledby="govtech-heading"
        class="rounded-xl border p-6 sm:p-8 transition-colors"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
        [class.bg-slate-900]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p class="text-xs font-mono text-slate-400">
              Sekcja 1.B · Pilotaz GovTech / PPP · Budzet PoC: 11 000 PLN brutto (~2 500 EUR) · Ponizej progu PZP
            </p>
            <h2
              id="govtech-heading"
              class="mt-1 text-xl sm:text-2xl font-bold tracking-tight balance-text"
              [class.text-[#D8ED00]]="highContrast()"
              [class.text-white]="!highContrast()"
            >
              02. Pilotaz GovTech / PPP "Dostepna Gmina — Cyfrowa Samopomoc"
            </h2>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <button
              type="button"
              (click)="toggleHeadphoneJack()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#D8ED00]]="headphoneJackPlugged()"
              [class.text-[#130E17]]="headphoneJackPlugged()"
              [class.border-[#D8ED00]]="headphoneJackPlugged()"
              [class.bg-slate-800]="!headphoneJackPlugged()"
              [class.text-slate-200]="!headphoneJackPlugged()"
              [class.border-slate-700]="!headphoneJackPlugged()"
            >
              <mat-icon class="text-base leading-none">headphones</mat-icon>
              <span>
                {{ headphoneJackPlugged() ? 'Gniazdo Jack: Sluchawki aktywne (Auto-Mute glosnikow)' : 'Symuluj wpiecie sluchawek Jack (Auto-Wyciszenie)' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Explanation based on audience -->
        <p class="mt-4 text-sm leading-relaxed text-slate-300">
          @switch (audience()) {
            @case ('professor') {
              Architektura socjotechniczna Human-in-the-Loop laczaca 3 utwardzone terminale audiokioskowe (WCAG 2.1 AAA, kontrast &gt;= 7:1, fizyczna ergonomia 80–110 cm dla osob na wozkach) z siecia 10 przeszkolonych lokalnych wolontariuszy. Przetwarzanie odbywa sie w ulotnej pamieci RAM (tryb Zero-PII) z pelnym wyczyszczeniem sesji po odejsciu obywatela.
            }
            @case ('architect') {
              Wdrozenie PoC w zamowieniu bezposrednim ponizej progu PZP (11 000 PLN brutto vs 130 000 PLN limitu PZP): 3 punkty krytyczne (OPS, Biblioteka Publiczna, Przychodnia POZ) po 2 200 PLN/pkt za sprzet + 1 900 PLN Kiosk-Mode/TTS/Zero-PII + 2 500 PLN materialy w druku powiekszonym/Braille i pakiet dla 10 wolontariuszy.
            }
            @case ('layperson') {
              W trzech najwazniejszych miejscach w gminie (Osrodek Pomocy Spolecznej, Biblioteka i Przychodnia) staja proste w obsludze terminale glosowe dla seniorow i osob z niepelnosprawnosciami. Na miejscu pomaga 10 lokalnych wolontariuszy, a terminal nie zapisuje zadnych danych osobowych po zakonczeniu rozmowy.
            }
          }
        </p>

        <!-- 3 Critical Locations + Budget Table -->
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div class="lg:col-span-7 space-y-4">
            <h3 class="text-sm font-semibold text-slate-200">
              3 Lokalizacje Krytyczne Terminali Audiokioskowych (Ergonomia 80–110 cm)
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              @for (loc of kioskLocations; track loc.id) {
                <button
                  type="button"
                  (click)="selectKioskLocation(loc.id)"
                  class="text-left rounded-lg border p-4 transition-colors cursor-pointer"
                  [class.border-[#D8ED00]]="selectedKioskId() === loc.id"
                  [class.bg-slate-800/80]="selectedKioskId() === loc.id"
                  [class.border-slate-800]="selectedKioskId() !== loc.id"
                  [class.bg-slate-950/60]="selectedKioskId() !== loc.id"
                >
                  <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Terminal #{{ loc.number }}</span>
                    <span>{{ loc.unitCostPln }} PLN</span>
                  </div>
                  <p class="mt-1.5 text-sm font-bold text-white">{{ loc.name }}</p>
                  <p class="mt-1 text-xs text-slate-300">{{ loc.focus }}</p>
                  <p class="mt-2 text-xs font-mono text-slate-400">
                    Wolontariusze: {{ loc.volunteersAssigned }} os. · Wys.: {{ loc.mountHeightCm }}
                  </p>
                </button>
              }
            </div>

            <!-- Interactive Kiosk Preview Panel -->
            @let activeKiosk = selectedKiosk();
            <div class="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
                <span>Aktywny Terminal: {{ activeKiosk.name }}</span>
                <span>
                  Audio: {{ headphoneJackPlugged() ? 'Sluchawki Jack (Glosniki wyciszone)' : 'Glosnik kierunkowy TTS aktywny' }}
                </span>
              </div>
              <p class="mt-2 text-sm text-slate-200">
                <strong>Scenariusz obywatelski:</strong> {{ activeKiosk.citizenScenario }}
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono text-emerald-400">
                <span>Tryb sesji: Zero-PII (RAM-Only)</span>
                <span aria-hidden="true">·</span>
                <span>Materialy fizyczne: Druk powiekszony 18pt + alfabet Braille'a</span>
              </div>
            </div>
          </div>

          <!-- Documented Budget Breakdown -->
          <div class="lg:col-span-5 rounded-lg border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-white">Kosztorys PoC (Ponizej Progu PZP)</h3>
                <span class="text-xs font-mono text-emerald-400">Zgodny z PZP / PFRON</span>
              </div>
              <dl class="mt-4 space-y-3 text-xs">
                <div class="flex items-start justify-between gap-4 pb-2.5 border-b border-slate-800/80">
                  <dt class="text-slate-300">
                    Sprzet ({{ govBudget().terminalsCount }}x terminal + audio + obudowy odporne, {{ govBudget().hardwarePerUnitPln }} PLN/pkt)
                  </dt>
                  <dd class="font-mono tabular-nums font-semibold text-white shrink-0">
                    {{ govBudget().hardwareTotalPln | number:'1.0-0' }} PLN
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-4 pb-2.5 border-b border-slate-800/80">
                  <dt class="text-slate-300">
                    Oprogramowanie i bezpieczenstwo (Kiosk-Mode, synteza TTS, izolacja Zero-PII)
                  </dt>
                  <dd class="font-mono tabular-nums font-semibold text-white shrink-0">
                    {{ govBudget().softwareSecurityPln | number:'1.0-0' }} PLN
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-4 pb-2.5 border-b border-slate-800/80">
                  <dt class="text-slate-300">
                    Wdrozenie, materialy w druku powiekszonym/Braille i pakiet dla {{ govBudget().volunteersCount }} wolontariuszy
                  </dt>
                  <dd class="font-mono tabular-nums font-semibold text-white shrink-0">
                    {{ govBudget().deploymentBrailleVolunteersPln | number:'1.0-0' }} PLN
                  </dd>
                </div>
              </dl>
            </div>

            <div class="mt-5 pt-4 border-t border-slate-800">
              <div class="flex items-baseline justify-between">
                <span class="text-xs uppercase tracking-wider font-mono text-slate-400">Suma Budzetu PoC Brutto</span>
                <span class="text-xl font-bold font-mono tabular-nums text-[#D8ED00]">
                  {{ govBudget().totalGrossPln | number:'1.0-0' }} PLN (~{{ govBudget().totalEurApprox | number:'1.0-0' }} EUR)
                </span>
              </div>
              <p class="mt-1.5 text-xs font-mono text-slate-400">
                Prog PZP: 130 000 PLN · Kosztorys bazowy PFRON PoC: 16 850 PLN (limit dotacji PUP Slupsk: 143 400 PLN)
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class ProjectsCompliancePanel {
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();
  readonly speakText = output<string>();

  readonly headphoneJackPlugged = signal(false);
  readonly selectedKioskId = signal<'ops' | 'biblioteka' | 'poz'>('ops');
  readonly validationMessage = signal('');

  readonly govBudget = computed(() => calculateGovTechPoCBudget(3, 10));

  readonly legalModules = [
    {
      index: 1,
      code: 'RODO / RCP / DPIA',
      tech: 'Go API + TypeScript',
      title: 'Automatyzacja Rejestrow Czynnosci Przetwarzania i Matryc Ryzyka',
      guarantee: 'RODO Art. 25/30/32/35',
      standard: 'ISO/IEC 29134 DPIA',
      professorText:
        'Algorytmiczna kwantyfikacja prawdopodobienstwa i wagi naruszenia praw lub wolnosci osob fizycznych w wielowymiarowej matrycy ryzyka DPIA z deterministycznym mapowaniem podstaw prawnych RCP.',
      architectText:
        'Mikroserwisy w Go generuja wersjonowane rejestry RCP oraz matryce ryzyka DPIA z izolacja kryptograficzna AES-256-GCM i eksportem gotowym do kontroli UODO.',
      laypersonText:
        'System sam pilnuje dokumentow o ochronie danych osobowych w firmie lub urzedzie i podpowiada, jak zabezpieczyc informacje o klientach i mieszkancach.',
    },
    {
      index: 2,
      code: 'SYGNALISCI ZERO-KNOWLEDGE',
      tech: 'Rust Edge Scrubber',
      title: 'Kanal Sygnalistow z Czyszczeniem Metadanych EXIF/XMP/OLE',
      guarantee: 'Brak logowania IP (Zero-Log)',
      standard: 'Dyrektywa UE 2019/1937',
      professorText:
        'Kryptograficzny potok brzegowy w jezyku Rust realizujacy bezstanowa sanityzacje strumienia binarnego (usuwanie struktur EXIF, XMP, strumieni OLE2 oraz naglowkow sieciowych) przed zapisem.',
      architectText:
        'Modul w Rust na brzegu sieci wycina geolokalizacje GPS, numery seryjne urzadzen i autorow dokumentow Office/PDF bez logowania adresow IP zglaszajacego.',
      laypersonText:
        'Pracownik moze bezpiecznie zglosic nieprawidlowosci — system automatycznie usuwa ze zdjec i plikow ukryte slady (np. lokalizacje telefonu czy nazwisko autora).',
    },
    {
      index: 3,
      code: 'RAG GUARDRAILS',
      tech: 'Python NLP + Guardrails',
      title: 'Deterministyczna Analiza Klauzul Umownych RAG (Zero Data Retention)',
      guarantee: 'BERTScore F1: 0.87',
      standard: 'EU AI Act High-Risk Compliance',
      professorText:
        'Weryfikacja semantyczna klauzul umownych oparta o wyszukiwanie wektorowe z twardymi wiezami walidacyjnymi (Guardrails) eliminujacymi halucynacje i wymuszajacymi cytowanie zrodla.',
      architectText:
        'Pipeline w Pythonie ocenia ryzyko klauzul wzgledem bazy wzorcow (BERTScore F1 >= 0.87, ROUGE-L 0.68) w polityce Zero Data Retention (brak trenowania na danych klienta).',
      laypersonText:
        'Program w kilka sekund sprawdza umowe i wskazuje niebezpieczne zapisy, a po analizie natychmiast zapomina tekst umowy, dbajac o tajemnice zawodowa.',
    },
    {
      index: 4,
      code: 'SHA-256 APPEND-ONLY',
      tech: 'Rust + SHA-256 Chain',
      title: 'Generator Umow z Wersjonowanych Blokow Prawnych ze Sladem Audytowym',
      guarantee: 'Niemodyfikowalny lancuch SHA-256',
      standard: 'NIS2 Art. 21 Audit Trail',
      professorText:
        'Struktura kryptograficznego dziennika dopisywanego (Append-Only Ledger), w ktorej kazda zmiana klauzuli tworzy nowy wezel drzewa skrotow SHA-256 powiazany z poprzednim stanem.',
      architectText:
        'Kompilator umow z zatwierdzonych blokow prawnych — kazda wygenerowana wersja otrzymuje niepodrabialny podpis SHA-256 stanowiacy dowod rozliczalnosci audytowej.',
      laypersonText:
        'Umowy sa skladane ze sprawdzonych klockow prawnych, a kazda wersja ma cyfrowa pieczec, dzieki ktorej nikt nie moze potajemnie podmienic ani jednego slowa.',
    },
  ];

  readonly kioskLocations = [
    {
      id: 'ops' as const,
      number: 1,
      name: 'Osrodek Pomocy Spolecznej (OPS)',
      focus: 'Wnioski socjalne, dodatki energetyczne i wsparcie senioralne',
      unitCostPln: 2200,
      volunteersAssigned: 4,
      mountHeightCm: '85 cm (dostosowany do wozkow)',
      citizenScenario:
        'Senior z dysfunkcja wzroku odsluchuje przez sluchawki (z automatycznym wyciszeniem glosnika) instrukcje wypelnienia wniosku z pomoca wolontariusza.',
    },
    {
      id: 'biblioteka' as const,
      number: 2,
      name: 'Biblioteka Publiczna',
      focus: 'Edukacja cyfrowa, e-Doręczenia, Profil Zaufany i dyzury wolontariuszy',
      unitCostPln: 2200,
      volunteersAssigned: 3,
      mountHeightCm: '95 cm (regulowany kat nachylenia)',
      citizenScenario:
        'Mieszkaniec korzysta z kontrastu 14.9:1 (#130E17 / #D8ED00) oraz instrukcji w druku powiekszonym i alfabecie Braille’a do bezpiecznego kontaktu z urzedem.',
    },
    {
      id: 'poz' as const,
      number: 3,
      name: 'Przychodnia Podstawowej Opieki Zdrowotnej (POZ)',
      focus: 'Informacja o e-Receptach, e-Skierowaniach i prawach pacjenta',
      unitCostPln: 2200,
      volunteersAssigned: 3,
      mountHeightCm: '90 cm (strefa cicha z gniazdem Jack)',
      citizenScenario:
        'Pacjent sprawdza procedure rejestracji glosowo w trybie Zero-PII — terminal po zakonczeniu sesji automatycznie zeruje pamiec podreczna.',
    },
  ];

  readonly selectedKiosk = computed(
    () => this.kioskLocations.find((k) => k.id === this.selectedKioskId()) ?? this.kioskLocations[0]
  );

  readonly auditForm = new FormGroup({
    moduleCode: new FormControl('SYGNALISTA_RUST_ZK', { nonNullable: true }),
    rawText: new FormControl(
      'Zgloszenie z hosta 192.168.40.12 dot. procedury przetargowej, identyfikator 91042211223.',
      { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }
    ),
  });

  readonly auditChain = signal<AuditBlock[]>(this.buildInitialChain());

  private buildInitialChain(): AuditBlock[] {
    const genesis = computeDeterministicSha256Hex('POMORZE_SMART_GRID_LEGAL_GENESIS_2026');
    const b1 = sanitizeAndCreateAuditBlock(
      1,
      'RODO_RCP_DPIA',
      'v3.1-ART35',
      'Inicjalizacja matrycy ryzyka DPIA dla terminali audiokioskowych OPS/Biblioteka/POZ.',
      ['EXIF:CreatorTool', 'XMP:ModifyDate'],
      genesis,
      '2026-11-09T08:15:00Z'
    );
    const b2 = sanitizeAndCreateAuditBlock(
      2,
      'SYGNALISTA_RUST_ZK',
      'v2.4-ZERO-LOG',
      'Weryfikacja kanalu sygnalistow z IP 172.16.0.44 dla rekordu testowego 88021499887.',
      ['EXIF:GPSCoordinate', 'OLE:LastAuthor', 'IP:SourceHeader'],
      b1.sha256Hash,
      '2026-11-09T09:30:00Z'
    );
    return [b1, b2];
  }

  appendAuditRecord(): void {
    const rawText = this.auditForm.controls.rawText.value.trim();
    if (rawText.length < 5) {
      this.validationMessage.set('Wprowadz co najmniej 5 znakow tresci, aby wygenerowac blok audytowy SHA-256.');
      return;
    }
    this.validationMessage.set('');
    const currentChain = this.auditChain();
    const lastBlock = currentChain[currentChain.length - 1];
    const nextIndex = lastBlock ? lastBlock.index + 1 : 1;
    const prevHash = lastBlock ? lastBlock.sha256Hash : computeDeterministicSha256Hex('GENESIS');

    const newBlock = sanitizeAndCreateAuditBlock(
      nextIndex,
      this.auditForm.controls.moduleCode.value,
      'v2.5-SHA256',
      rawText,
      ['EXIF:GPSInfo', 'XMP:Author', 'OLE:Company', 'HTTP:X-Forwarded-For'],
      prevHash,
      '2026-11-09T12:45:00Z'
    );

    this.auditChain.update((chain) => [newBlock, ...chain]);
  }

  selectKioskLocation(id: 'ops' | 'biblioteka' | 'poz'): void {
    this.selectedKioskId.set(id);
  }

  toggleHeadphoneJack(): void {
    this.headphoneJackPlugged.update((v) => !v);
  }

  speakSectionSummary(section: 'legal' | 'govtech'): void {
    if (section === 'legal') {
      this.speakText.emit(
        'Platforma Legal Tech obejmuje cztery moduly: automatyzacje RODO i DPIA, kanal sygnalistow w jezyku Rust czyszczacy metadane bez logowania IP, deterministyczna analize klauzul RAG w Pythonie oraz generator umow z lancuchem SHA-256.'
      );
    } else {
      this.speakText.emit(
        'Pilotaz Dostepna Gmina obejmuje trzy terminale audiokioskowe w OPS, Bibliotece i Przychodni POZ oraz siec dziesieciu wolontariuszy w budzecie jedenastu tysiecy zlotych brutto.'
      );
    }
  }
}
