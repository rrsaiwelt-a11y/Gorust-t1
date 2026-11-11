import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AudienceLevel, calculateWcagContrastRatio } from './domain/architecture-logic';
import { ProjectsCompliancePanel } from './components/projects-compliance-panel';
import { SmartGridTelemetryPanel } from './components/smart-grid-telemetry-panel';
import { AntiGravityDeskPanel } from './components/anti-gravity-desk-panel';
import { FinancialArchitecturePanel } from './components/financial-architecture-panel';
import { MasterCompliancePanel } from './components/master-compliance-panel';
import { DiagramsRoadmapPanel } from './components/diagrams-roadmap-panel';
import { NextGenThreePillarsPanel } from './components/nextgen-three-pillars-panel';

export type NavigationTab = 'all' | 'projects' | 'smartgrid' | 'hardware' | 'finance' | 'diagrams';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    MatIconModule,
    ProjectsCompliancePanel,
    SmartGridTelemetryPanel,
    AntiGravityDeskPanel,
    FinancialArchitecturePanel,
    MasterCompliancePanel,
    DiagramsRoadmapPanel,
    NextGenThreePillarsPanel,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);

  readonly activeTab = signal<NavigationTab>('all');
  readonly audience = signal<AudienceLevel>('architect');
  readonly highContrastAAA = signal<boolean>(false);
  readonly lastSpokenText = signal<string>('');
  readonly isSpeaking = signal<boolean>(false);
  readonly exportModalOpen = signal<boolean>(false);
  readonly copiedConfirmation = signal<boolean>(false);

  readonly wcagReferenceRatio = computed(() => calculateWcagContrastRatio('#130E17', '#D8ED00'));

  readonly exportManifestJson = computed(() =>
    JSON.stringify(
      {
        title: 'KOMPLETNA DOKUMENTACJA ARCHITEKTONICZNA I FINANSOWA (OD PROFESORA DO LAIKA)',
        role: 'Systems & Security Architect | Smart Grid Lab & Legal Tech | RODO, NIS2, WCAG 2.1 AAA / EAA',
        researchProfile: 'Inzynier Oprogramowania (11. semestr mgr uzupelniajacych, obrona marzec 2027)',
        supervisor: 'Prof. dr hab. inz. Cezary Orlowski (Smart Grid, Systemy Rozproszone, Energetyka)',
        corridor: 'Ustka (Port / Offshore Baltica 2 & 3, 2.5 GW) - Slupsk (GPZ Wierzbiecino 400 kV) - Trojmiasto (Hotel Gdansk)',
        techStack: ['Rust (Anonimizacja/Crypto)', 'Go (Mikroserwisy API)', 'Python (NLP Guardrails & Analiza dCi/AQI)', 'TypeScript'],
        nextGenThreePillars2027_2032: {
          pillar1LegalTech: 'zk-SNARKs (Plonky3 WASM) + Z3 SMT Formal Contract Verifier + NIST PQC ML-DSA-65 + eIDAS 2.0 EUDI Wallet',
          pillar2SmartGrid: 'Dynamic Line Rating DLR 400 kV (+18-28% MW) + Synchrofazory PMU Grid-Forming BESS (< 5 ms DWDM) + Zielony Wodor H2 Port Ustka',
          pillar3AssistiveAccessibility: 'Edge Eye-Gaze (Tetraplegia/SLA) + Filtr Drzenia Kalmana (Parkinson) + 2-Way PJM Vision 3D + Mikronawigacja UWB ±15 cm + Kalkulator PFRON Zero-PII',
        },
        qualityGates: {
          BERTScore_F1: 0.87,
          BLEU_4: 0.42,
          ROUGE_L: 0.68,
          CodeBLEU: 0.74,
          dwdmLatencyMs: 3.84,
        },
        govTechPoC: {
          name: 'Dostepna Gmina - Cyfrowa Samopomoc',
          terminals: ['OPS', 'Biblioteka Publiczna', 'Przychodnia POZ'],
          volunteers: 10,
          totalBudgetGrossPln: 11000,
          hardwarePln: 6600,
          softwareSecurityPln: 1900,
          deploymentBraillePln: 2500,
        },
        antiGravityDesk: {
          stationaryWatts: 1000,
          mobileWeightKg: 5.98,
          batteryCapacityWh: 340,
          fieldAutonomyHours: 13.7,
        },
        financialArchitecture: {
          split: '60% B2B / 30% SLA MRR / 10% Audyty (min. 40% zadatku)',
          payoutDays: [5, 10, 18, 25],
          pfronGrantLimitPln: 143400,
          pfronPoCBasePln: 16850,
          fePomorzaGrantRangePln: '600 000 - 2 000 000 PLN',
          taxRegimes: ['Ryczalt IT 12%', 'IP Box 5% PIT', '0% VAT Reverse Charge UE'],
        },
        diagramsRepository: {
          folder01Experts: 'docs/diagramy/01-eksperci-architekci-secops-smartgrid/ (EXP-01..EXP-04)',
          folder02Recipients: 'docs/diagramy/02-odbiorcy-komentujacy-interesariusze/ (PUB-01..PUB-04)',
          folder03Roadmap: 'docs/diagramy/03-przyszle-zastosowania-i-rozbudowa/roadmapa-2027-2030.md',
        },
        wcagContrastRatio: `${this.wcagReferenceRatio()}:1 (#130E17 / #D8ED00)`,
      },
      null,
      2
    )
  );

  setTab(tab: NavigationTab): void {
    this.activeTab.set(tab);
  }

  setAudience(level: AudienceLevel): void {
    this.audience.set(level);
  }

  toggleHighContrast(): void {
    this.highContrastAAA.update((v) => !v);
  }

  handleSpeak(text: string): void {
    this.lastSpokenText.set(text);
    this.isSpeaking.set(true);

    if (isPlatformBrowser(this.platformId) && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pl-PL';
        utterance.rate = 1.0;
        utterance.onend = () => this.isSpeaking.set(false);
        utterance.onerror = () => this.isSpeaking.set(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback for headless environments without audio device
      }
    }
  }

  stopSpeaking(): void {
    this.isSpeaking.set(false);
    this.lastSpokenText.set('');
    if (isPlatformBrowser(this.platformId) && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore in headless environment
      }
    }
  }

  openExportModal(): void {
    this.exportModalOpen.set(true);
    this.copiedConfirmation.set(false);
  }

  closeExportModal(): void {
    this.exportModalOpen.set(false);
  }

  copyManifestToClipboard(): void {
    if (isPlatformBrowser(this.platformId) && navigator.clipboard) {
      navigator.clipboard.writeText(this.exportManifestJson()).catch((err: unknown) => {
        if (err) {
          this.copiedConfirmation.set(true);
        }
      });
    }
    this.copiedConfirmation.set(true);
  }
}
