import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AudienceLevel, calculateWcagContrastRatio } from '../domain/architecture-logic';

interface ComplianceChecklistItem {
  id: string;
  norm: string;
  title: string;
  verified: boolean;
  technicalProof: string;
  professorNote: string;
  architectNote: string;
  laypersonNote: string;
}

@Component({
  selector: 'app-master-compliance-panel',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <section
        aria-labelledby="compliance-heading"
        class="rounded-xl border p-6 sm:p-8 transition-colors"
        [class.bg-[#130E17]]="highContrast()"
        [class.border-[#D8ED00]]="highContrast()"
        [class.bg-slate-900]="!highContrast()"
        [class.border-slate-800]="!highContrast()"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p class="text-xs font-mono text-slate-400">
              Sekcja 3 · Master Checklista Zgodnosci · WCAG 2.1 AAA / EAA · RODO Art. 25/32 · NIS2 · EU AI Act
            </p>
            <h2
              id="compliance-heading"
              class="mt-1 text-xl sm:text-2xl font-bold tracking-tight balance-text"
              [class.text-[#D8ED00]]="highContrast()"
              [class.text-white]="!highContrast()"
            >
              06. Master Checklista Zgodnosci Regulacyjnej i Technicznej (6/6 Kryteriow Zweryfikowanych)
            </h2>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="speakComplianceSummary()"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#D8ED00] text-[#130E17] hover:bg-[#e5f733] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <mat-icon class="text-base leading-none">volume_up</mat-icon>
              <span>Odsluchaj Checklist (TTS)</span>
            </button>
          </div>
        </div>

        <!-- Live WCAG 1.4.6 AAA Contrast Ratio Calculator -->
        <div class="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div class="lg:col-span-7">
            <h3 class="text-sm font-bold text-white">
              Weryfikator Matematyczny Kontrastu Wizualnego WCAG 2.1 AAA (Kryterium 1.4.6 &gt;= 7:1)
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Udokumentowana para barw systemowych: Tlo <code class="text-slate-200">#130E17</code> oraz Akcent <code class="text-[#D8ED00]">#D8ED00</code>. Mozesz rowniez przetestowac inne kombinacje ponizej.
            </p>

            <div class="mt-4 flex flex-wrap items-center gap-4">
              <div>
                <label for="bg-hex" class="block text-xs font-mono text-slate-400 mb-1">Kolor Tla (HEX)</label>
                <input
                  id="bg-hex"
                  type="text"
                  [value]="bgHex()"
                  (input)="updateBgHex($event)"
                  class="w-32 rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label for="fg-hex" class="block text-xs font-mono text-slate-400 mb-1">Kolor Akcentu (HEX)</label>
                <input
                  id="fg-hex"
                  type="text"
                  [value]="fgHex()"
                  (input)="updateFgHex($event)"
                  class="w-32 rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <button
                type="button"
                (click)="resetReferenceColors()"
                class="mt-5 px-3 py-1.5 rounded bg-slate-800 text-xs font-mono text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Przywroc #130E17 / #D8ED00
              </button>
            </div>
          </div>

          <div
            class="lg:col-span-5 rounded-lg border p-5 flex flex-col justify-between"
            [style.backgroundColor]="bgHex()"
            [style.borderColor]="fgHex()"
            [style.color]="fgHex()"
          >
            <div class="flex items-center justify-between text-xs font-mono">
              <span>WYNIK POMIARU LUMINANCJI</span>
              <span>{{ contrastRatio() >= 7 ? 'PASS WCAG AAA (>= 7:1)' : 'PONIZEJ AAA (< 7:1)' }}</span>
            </div>
            <p class="mt-2 text-3xl font-bold font-mono tabular-nums">
              {{ contrastRatio() }} : 1
            </p>
            <p class="mt-1 text-xs font-mono opacity-90">
              Probka tekstu o maksymalnej czytelnosci dla osob slabowidzacych (European Accessibility Act).
            </p>
          </div>
        </div>

        <!-- 6 Master Checklist Items -->
        <div class="mt-6 space-y-4">
          @for (item of checklistItems(); track item.id) {
            <article
              class="rounded-lg border p-5 transition-colors"
              [class.border-[#D8ED00]]="item.verified && highContrast()"
              [class.border-slate-800]="!highContrast()"
              [class.bg-slate-950/70]="!highContrast()"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="toggleChecklistVerification(item.id)"
                    class="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold transition-colors cursor-pointer shrink-0"
                    [class.bg-[#D8ED00]]="item.verified"
                    [class.text-[#130E17]]="item.verified"
                    [class.bg-slate-800]="!item.verified"
                    [class.text-slate-400]="!item.verified"
                    [attr.aria-label]="'Przelacz status punktu ' + item.norm"
                  >
                    {{ item.verified ? 'X' : ' ' }}
                  </button>
                  <div>
                    <span class="text-xs font-mono text-[#D8ED00]">{{ item.norm }}</span>
                    <h3 class="text-base font-bold text-white">{{ item.title }}</h3>
                  </div>
                </div>
                <span class="text-xs font-mono text-emerald-400 shrink-0">
                  {{ item.technicalProof }}
                </span>
              </div>

              <p class="mt-3 text-sm leading-relaxed text-slate-300 pl-9">
                @switch (audience()) {
                  @case ('professor') {
                    {{ item.professorNote }}
                  }
                  @case ('architect') {
                    {{ item.architectNote }}
                  }
                  @case ('layperson') {
                    {{ item.laypersonNote }}
                  }
                }
              </p>
            </article>
          }
        </div>
      </section>
    </div>
  `,
})
export class MasterCompliancePanel {
  readonly audience = input.required<AudienceLevel>();
  readonly highContrast = input.required<boolean>();
  readonly speakText = output<string>();

  readonly bgHex = signal('#130E17');
  readonly fgHex = signal('#D8ED00');

  readonly contrastRatio = computed(() => {
    const bg = /^#[0-9A-Fa-f]{6}$/.test(this.bgHex()) ? this.bgHex() : '#130E17';
    const fg = /^#[0-9A-Fa-f]{6}$/.test(this.fgHex()) ? this.fgHex() : '#D8ED00';
    return calculateWcagContrastRatio(bg, fg);
  });

  readonly checklistItems = signal<ComplianceChecklistItem[]>([
    {
      id: 'wcag_aaa',
      norm: 'WCAG 1.4.6 / EAA (European Accessibility Act)',
      title: 'Kontrast wizualny >= 7:1 (#130E17 tlo / #D8ED00 akcent), pelna obsluga z klawiatury, synteza mowy TTS',
      verified: true,
      technicalProof: 'Luminancja 14.54:1 >= 7.0:1 · Focus-Visible · Web Speech TTS',
      professorNote:
        'Spelnienie najwyzszego poziomu dostepnosci percepcyjnej WCAG 2.1 AAA poprzez wymuszenie relatywnej luminancji L1/L2 = 14.54:1 oraz deterministyczne drzewo dostepnosci DOM (ARIA / Keyboard Navigation).',
      architectNote:
        'Natywna obsluga nawigacji klawiszami Tab/Enter/Space bez pulapek fokusowych, wsparcie syntezatora TTS oraz tryb wysokiego kontrastu #130E17 / #D8ED00.',
      laypersonNote:
        'Ekran ma bardzo wyrazne zolto-zielone litery na ciemnym tle, mozna go obslugiwac sama klawiatura, a komputer potrafi glosno przeczytac kazdy tekst.',
    },
    {
      id: 'ergonomia_kioski',
      norm: 'Ergonomia Fizyczna (3 Audiokioski GovTech)',
      title: 'Montaz 80–110 cm nad podloga, gniazdo sluchawkowe Jack z auto-wyciszeniem',
      verified: true,
      technicalProof: 'OPS + Biblioteka + POZ · 80–110 cm · Hardware Jack Auto-Mute',
      professorNote:
        'Antropometryczna optymalizacja strefy dosiegu konczyn gornych dla osob poruszajacych sie na wozkach inwalidzkich (80–110 cm) wraz ze sprzetowym przelaczaniem toru akustycznego.',
      architectNote:
        'Obudowy odporne w OPS, Bibliotece i POZ z fizycznym gniazdem sluchawkowym 3.5mm Jack automatycznie odcinajacym glosnik zewnetrzny dla zachowania prywatnosci rozmowy.',
      laypersonNote:
        'Terminale sa zamontowane na takiej wysokosci, by wygodnie skorzystala z nich osoba na wozku, a po wlozeniu sluchawek glosnik sam sie wycisza.',
    },
    {
      id: 'rodo_art25',
      norm: 'RODO Art. 25 / Art. 32 (Privacy by Design)',
      title: 'Zero-Tracking (0 zewnetrznych cookies), tryb Zero-PII w audiokioskach, izolacja AES-256-GCM',
      verified: true,
      technicalProof: '0 Cookies · RAM-Only Session · Szyfrowanie AES-256-GCM',
      professorNote:
        'Techniczna realizacja zasady Privacy by Default (Art. 25 RODO): brak zewnetrznych skryptow sledzacych, ulotne sesje pamieciowe w audiokioskach oraz uwierzytelnione szyfrowanie symetryczne AES-256-GCM.',
      architectNote:
        'Brak ciasteczek analitycznych stron trzecich, automatyczny reset stanu po zakonczeniu sesji obywatela oraz szyfrowanie spoczynkowe AES-256-GCM w bazie dokumentow.',
      laypersonNote:
        'System nie sledzi uzytkownikow w internecie, nie wysyla reklam, a dane w terminalach gminnych znikaja natychmiast po zakonczeniu zalatwiania sprawy.',
    },
    {
      id: 'sygnalisci_rust',
      norm: 'Ochrona Sygnalistow (Dyrektywa UE 2019/1937)',
      title: 'Automatyczne czyszczenie metadanych EXIF/PII w warstwie brzegowej (Rust), brak logowania IP',
      verified: true,
      technicalProof: 'Rust Edge Scrubber · EXIF/XMP/OLE Strip · Zero-IP Logging',
      professorNote:
        'Bezstanowy filtr kryptograficzny w jezyku Rust usuwajacy wektory deanonimizacji posredniej (tagi EXIF, XMP, metadane rewizji OLE oraz adresacje warstwy sieciowej L3/L7).',
      architectNote:
        'Zgloszenia przechodza przez mikroserwis w Rust wycinajacy GPS, autora pliku i adres IP zanim pakiet dotrze do warstwy aplikacyjnej.',
      laypersonNote:
        'Osoba zglaszajaca naduzycie pozostaje w pelni anonimowa — program sam wymazuje informacje o tym, z jakiego komputera czy telefonu wyslano plik.',
    },
    {
      id: 'nis2_ai_act',
      norm: 'NIS2 & EU AI Act Compliance',
      title: 'Niemodyfikowalne logi audytowe (SHA-256 Chain), polityka Zero Data Retention, RAG Guardrails',
      verified: true,
      technicalProof: 'SHA-256 Append-Only · Zero Data Retention · BERTScore F1 0.87',
      professorNote:
        'Kryptograficzna rozliczalnosc operacji za pomoca lancucha skrotow SHA-256 oraz deterministyczne ograniczanie przestrzeni generacji modelu jezykowego poprzez RAG Guardrails.',
      architectNote:
        'Kazda operacja na umowach zostawia niemodyfikowalny slad SHA-256 wymagany przez dyrektywe NIS2, a modele AI dzialaja w trybie Zero Data Retention.',
      laypersonNote:
        'Kazda zmiana w dokumentach jest trwale odnotowana cyfrowym podpisem, a sztuczna inteligencja dziala pod scisla kontrola i nie uczy sie na poufnych danych.',
    },
    {
      id: 'integralnosc_smart_grid',
      norm: 'Integralnosc Danych i Finansow (Smart Grid & SLA)',
      title: 'Walidacja telemetrii AQI/dCi (Slupsk, Ustka, Trojmiasto), swiatlowod < 5 ms, RTO < 2h',
      verified: true,
      technicalProof: 'DWDM 3.84 ms (< 5 ms) · RTO < 2h · Korekta RH > 85% & Flatline',
      professorNote:
        'Ciaglosc dzialania systemow cyber-fizycznych (CPS) w korytarzu pomorskim z czasem odtworzenia RTO < 2h oraz opoznieniem optycznym DWDM 3.84 ms dla integracji 2.5 GW mocy morskich farm wiatrowych.',
      architectNote:
        'Automatyczne wykrywanie bledow zawieszenia czujnika (Flatline), korekta wilgotnosci RH > 85%, lacze DWDM < 5 ms oraz gwarancja przywrocenia systemu RTO ponizej 2 godzin.',
      laypersonNote:
        'Pomiary energii i czystosci powietrza w Ustce, Slupsku i Trojmiescie sa przesylane ultraszybkim swiatlowodem, a w razie awarii system ma zasilanie zapasowe i wraca do pracy w mniej niz 2 godziny.',
    },
  ]);

  updateBgHex(event: Event): void {
    this.bgHex.set((event.target as HTMLInputElement).value.trim());
  }

  updateFgHex(event: Event): void {
    this.fgHex.set((event.target as HTMLInputElement).value.trim());
  }

  resetReferenceColors(): void {
    this.bgHex.set('#130E17');
    this.fgHex.set('#D8ED00');
  }

  toggleChecklistVerification(id: string): void {
    this.checklistItems.update((items) =>
      items.map((item) => (item.id === id ? { ...item, verified: !item.verified } : item))
    );
  }

  speakComplianceSummary(): void {
    this.speakText.emit(
      `Master Checklista Zgodnosci potwierdza szesc kluczowych obszarow: kontrast WCAG 2.1 AAA wynoszacy ${this.contrastRatio()} do jednego, ergonomie trzech audiokioskow na wysokosci 80 do 110 centymetrow, RODO Zero-Tracking, ochrone sygnalistow w jezyku Rust, zgodnosc z NIS2 i EU AI Act oraz integralnosc Smart Grid z latencja swiatlowodu ponizej pieciu milisekund.`
    );
  }
}
