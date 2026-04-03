# DEMO.md — Scenariu demo / studiu de caz (MVP)

## 1. Scop

Acest document definește un scenariu demo reproductibil pentru validarea cap-coadă a aplicației de monitorizare a performanței proiectelor. Scenariul este conceput pentru:

- demonstrarea relației dintre planificare, execuție și KPI;
- evidențierea efectului modificării costurilor și progresului asupra indicatorilor;
- susținerea capitolului de validare din lucrarea de dizertație;
- rulare repetabilă după reset/seed.

Scenariul utilizează proiectul **Project Alpha** și urmărește două momente distincte de recalcul KPI (`asOf` diferit), astfel încât evoluția indicatorilor să poată fi interpretată managerial.

---

## 2. Premise și ipoteze

Scenariul este construit pentru MVP-ul curent și se bazează pe următoarele reguli:

- `PV` este calculat liniar între `startDate` și `endDate`;
- `EV` este derivat din progresul mediu al work item-urilor (equal-weighted);
- `AC` este calculat ca suma valorilor din `CostEntry.amount`;
- `CPI = EV / AC`;
- `SPI = EV / PV`;
- `Burn Rate = AC / elapsedDays`;
- recalcularea KPI este declanșată manual prin endpoint / butonul de recalcul;
- snapshot-urile KPI sunt persistate pentru analiză istorică.

---

## 3. Datele demo — Project Alpha

### 3.1 Baseline proiect

Project Alpha este configurat astfel:

- **Nume:** Project Alpha
- **Start date:** 2026-01-01
- **End date:** 2026-03-31
- **Planned Budget (BAC):** 100000

Durata totală este de 90 zile calendaristice (în aproximare MVP).

---

### 3.2 Work items (4–6 task-uri)

Pentru scenariul demo se vor folosi 5 task-uri:

| ID logic | Task | Planned interval | Progres la momentul 1 | Progres la momentul 2 |
|---|---|---|---:|---:|
| W1 | Initiation & Scope | 2026-01-01 → 2026-01-15 | 100% | 100% |
| W2 | Requirements & Analysis | 2026-01-10 → 2026-01-31 | 80% | 100% |
| W3 | Core Implementation | 2026-02-01 → 2026-02-28 | 40% | 70% |
| W4 | KPI & Reporting Integration | 2026-02-15 → 2026-03-15 | 20% | 50% |
| W5 | Final Validation | 2026-03-01 → 2026-03-28 | 0% | 10% |

### 3.3 Progress ratio

#### Momentul 1

Progres mediu:

(100 + 80 + 40 + 20 + 0) / 5 = **48%**

Rezultă:

- `progressRatio = 0.48`
- `EV = 100000 × 0.48 = 48000`

#### Momentul 2

Progres mediu:

(100 + 100 + 70 + 50 + 10) / 5 = **66%**

Rezultă:

- `progressRatio = 0.66`
- `EV = 100000 × 0.66 = 66000`

---

### 3.4 Cost entries

Scenariul folosește două momente de introducere a costurilor.

#### Costuri existente la momentul 1

| Date | Category | Amount | Note |
|---|---|---:|---|
| 2026-01-20 | Labor | 12000 | Analysis effort |
| 2026-02-05 | Tools | 8000 | Tooling and subscriptions |
| 2026-02-10 | Labor | 10000 | Initial implementation effort |

Total la momentul 1:

- `AC1 = 30000`

#### Costuri suplimentare introduse înainte de momentul 2

| Date | Category | Amount | Note |
|---|---|---:|---|
| 2026-02-20 | Labor | 12000 | Extra implementation effort |
| 2026-02-24 | Other | 8000 | Unexpected integration overhead |

Cost suplimentar:

- `20000`

Total la momentul 2:

- `AC2 = 50000`

---

### 3.5 Timesheets (pentru trasabilitate)

Timesheet-urile nu intră direct în formula AC în MVP, dar trebuie să existe pentru demonstrarea trasabilității execuției.

Exemple de timesheets utile în demo:

| Date | User | Work item | Hours | Note |
|---|---|---|---:|---|
| 2026-01-12 | pm@demo.local | W1 | 6 | Scope review |
| 2026-01-13 | member@demo.local | W2 | 5 | Requirements detailing |
| 2026-02-06 | member@demo.local | W3 | 7 | Core implementation |
| 2026-02-18 | member2@demo.local | W4 | 4 | KPI integration |
| 2026-02-25 | member@demo.local | W3 | 6 | Refactoring after issues |
| 2026-02-26 | member2@demo.local | W4 | 5 | Reporting improvements |

Aceste înregistrări sunt folosite în demo pentru a arăta că execuția este documentată și poate fi exportată în CSV.

---

## 4. Momentele de recalcul KPI

## 4.1 Recalcul KPI — momentul 1

### As-of date
- **2026-02-15**

### Planned Value (PV1)

Elapsed ratio aproximativ:

- zile trecute din 2026-01-01 până la 2026-02-15 ≈ 45
- durată totală ≈ 90
- `elapsedRatio ≈ 0.50`

Rezultă:

- `PV1 = 100000 × 0.50 = 50000`

### Earned Value (EV1)

- `EV1 = 48000`

### Actual Cost (AC1)

- `AC1 = 30000`

### KPI-uri la momentul 1

- `CPI1 = EV1 / AC1 = 48000 / 30000 = 1.60`
- `SPI1 = EV1 / PV1 = 48000 / 50000 = 0.96`
- `BurnRate1 = 30000 / 45 ≈ 666.67`

### Interpretare managerială

La primul moment de analiză:

- proiectul este **eficient din punct de vedere al costului** (`CPI > 1`);
- proiectul este **ușor în urmă față de plan** (`SPI < 1`);
- ritmul de consum al bugetului este moderat.

Acest moment este util pentru a arăta că proiectul poate avea cost performance bună chiar dacă este puțin în întârziere.

---

## 4.2 Modificări înainte de momentul 2

Între cele două momente de recalcul se efectuează următoarele modificări:

1. se introduc costuri suplimentare:
   - +12000
   - +8000

2. se actualizează progresul task-urilor:
   - W2: 80% → 100%
   - W3: 40% → 70%
   - W4: 20% → 50%
   - W5: 0% → 10%

Aceste modificări trebuie făcute explicit în demo pentru a arăta impactul datelor operaționale asupra KPI.

---

## 4.3 Recalcul KPI — momentul 2

### As-of date
- **2026-02-28**

### Planned Value (PV2)

Elapsed ratio aproximativ:

- zile trecute din 2026-01-01 până la 2026-02-28 ≈ 58
- durată totală ≈ 90
- `elapsedRatio ≈ 0.6444`

Rezultă:

- `PV2 ≈ 100000 × 0.6444 = 64444.44`

### Earned Value (EV2)

- `EV2 = 66000`

### Actual Cost (AC2)

- `AC2 = 50000`

### KPI-uri la momentul 2

- `CPI2 = EV2 / AC2 = 66000 / 50000 = 1.32`
- `SPI2 = EV2 / PV2 ≈ 66000 / 64444.44 ≈ 1.02`
- `BurnRate2 = 50000 / 58 ≈ 862.07`

### Interpretare managerială

Comparativ cu momentul 1:

- `CPI` **scade** de la **1.60** la **1.32**  
  → proiectul rămâne eficient din punct de vedere al costului, dar eficiența se deteriorează după introducerea costurilor suplimentare;

- `SPI` **crește** de la **0.96** la **1.02**  
  → proiectul recuperează întârzierea și ajunge ușor înaintea planului;

- `Burn Rate` **crește**  
  → ritmul de consum al bugetului se accelerează.

Acest comportament este „cu sens” și este potrivit pentru validarea managerială a aplicației.

---

## 5. Trendul KPI demonstrat de scenariu

Scenariul produce o evoluție interpretabilă:

| KPI | Moment 1 | Moment 2 | Trend | Interpretare |
|---|---:|---:|---|---|
| CPI | 1.60 | 1.32 | în scădere | costuri suplimentare reduc eficiența |
| SPI | 0.96 | 1.02 | în creștere | progresul crește și proiectul recuperează |
| Burn Rate | 666.67 | 862.07 | în creștere | consum bugetar accelerat |

Acesta este exact tipul de scenariu util pentru capitolul de validare: KPI-urile nu se schimbă arbitrar, ci în acord cu modificările introduse în datele de execuție.

---

## 6. Pașii demo (exact)

## 6.1 Reset / pregătire mediu

1. pornește baza de date:
   ```bash
   docker compose up -d