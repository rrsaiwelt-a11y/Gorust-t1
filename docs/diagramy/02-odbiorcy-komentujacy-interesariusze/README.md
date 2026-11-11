# Folder 2: Diagramy dla Przegladajacych, Komentujacych i Odbiorcow Oprogramowania

Katalog zawiera przystepne diagramy procesowe, spoleczne i finansowe przeznaczone dla samorzadow, recenzentow, obywateli, seniorow oraz inwestorow:

1. **PUB-01: Sciezka Obywatela i Seniora w Pilotazu "Dostepna Gmina — Cyfrowa Samopomoc" (3 Audiokioski + 10 Wolontariuszy)**
2. **PUB-02: Mapa Korzysci Spolecznych i Ekologicznych: Ustka — Slupsk — Trojmiasto (Zielona Energia & Czyste Powietrze)**
3. **PUB-03: Przejrzysty Schemat Finansowy: Model 60 / 30 / 10, 4 Wypłaty w Miesiącu i Mnożenie Kapitału**
4. **PUB-04: Przewodnik Zaufania dla Odbiorcow: Dlaczego Sygnalista jest Anonimowy, a Umowa Niepodrabialna?**

---

## PUB-01: Sciezka Obywatela i Seniora ("Dostepna Gmina")

```mermaid
flowchart LR
  Citizen["Mieszkaniec / Senior / Osoba na Wozku"] -->|Wysokosc 80-110 cm| Kiosk["Audiokiosk (OPS / Biblioteka / Przychodnia POZ)"]
  Kiosk -->|Wpiecie Sluchawek Jack| Audio["Auto-Wyciszenie Glosnika + Czytnik Glosowy TTS"]
  Kiosk -->|Kontrast 14.54:1 + Braille| Volunteer["Wsparcie 1 z 10 Lokalnych Wolontariuszy"]
  Audio --> Finish["Zalatwienie Sprawy Urzedowej / Zdrowotnej"]
  Volunteer --> Finish
  Finish -->|Koniec Sesji| Wipe["Automatyczne Wyzerowanie Pamieci RAM (Zero-PII)"]
```

---

## PUB-02: Mapa Korzysci Korytarza Pomorskiego

```mermaid
flowchart LR
  Offshore["Morskie Farmy Wiatrowe Baltica 2 & 3 (2.5 GW)"] --> UstkaPort["Ustka: Czyste Powietrze bez Falszywych Alarmow Mglowych"]
  UstkaPort --> SlupskGrid["Slupsk (GPZ Wierzbiecino): Bezpieczna Siec Energetyczna 400 kV"]
  SlupskGrid --> GdanskHub["Trojmiasto (Hotel Gdansk): Zielony Standard dla Turystyki i Biznesu"]
  GdanskHub --> Citizens["Korzysc dla Mieszkancow: Zdrowie, Dostepne Urzedy i Nowe Miejsca Pracy"]
```

---

## PUB-03: Przeplywy Finansowe 60 / 30 / 10 i Wodospad Kapitalu

```mermaid
flowchart TB
  Work["Czas Pracy Architekta: 60% Kontrakt B2B | 30% Abonamenty SLA | 10% Audyty i Wdrozenia"] --> Calendar["4 Wplywy w Miesiacu: 5. dzien (SLA) | 10. dzien (B2B) | 18. dzien (40% Zaliczki) | 25. dzien (Gminy/Offshore)"]
  Grants["Dotacje: PFRON (do 143 400 PLN) + FE Pomorza 1.1 B+R (600k - 2 mln PLN)"] --> Infra["Infrastruktura Badawcza i Pilotaze PoC"]
  Calendar --> Tax["Optymalizacja Podatkowa: IP Box 5% PIT lub Ryczalt 12% (+ 0% VAT UE)"]
  Tax --> Waterfall1["Krok 1: Poduszka Finansowa 6M (Subkonto EUR/PLN + Obligacje TOS/COI)"]
  Waterfall1 --> Waterfall2["Krok 2: Tarcze Emerytalne IKE (0% Belki) & IKZE (Ulga PIT)"]
  Waterfall2 --> Waterfall3["Krok 3: Dlugoterminowe ETF (MSCI ACWI) & Obligacje Antyinflacyjne EDO"]
```

---

## PUB-04: Przewodnik Zaufania (Sygnalista & Niepodrabialne Umowy)

```mermaid
flowchart LR
  UserFile["Dokument lub Zdjecie od Uzytkownika"] --> Shredder["Cyfrowa Niszczarka Metadanych (Usuwa GPS, Autora i Adres IP)"]
  Shredder --> AIReview["Kontrola Prawna ze Scisla Tajemnica (Zero Zapamietywania Danych)"]
  AIReview --> Seal["Cyfrowa Plomba SHA-256 (Chroni przed Potajemna Zmiana Tekstu)"]
```
