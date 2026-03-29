# EPIC 2 – Data Model & Domain Design (MVP)

## Story: Define core domain entities (Conceptual Model)

### Context

Acest document definește **modelul conceptual al domeniului** pentru sistemul informatic de monitorizare a performanței proiectelor bazat pe indicatori KPI.  
Modelul conceptual descrie **entitățile principale**, rolul acestora în domeniul managementului de proiect și limitele explicite ale responsabilității fiecăreia.

Nu sunt incluse detalii de implementare (tabele, atribute, chei străine sau tehnologii).

---

## Core Domain Entities

### 1. User

**Scop:**  
Reprezintă o persoană care interacționează cu sistemul (manager de proiect, membru al echipei sau observator) și care contribuie la execuția proiectului sau la monitorizarea acestuia.

**Out of scope:**

- mecanisme avansate de autentificare și autorizare (SSO, MFA),
- management complet al identității,
- politici complexe de securitate.

---

### 2. Role

**Scop:**  
Definește tipul de responsabilitate și nivelul de acces al unui utilizator în cadrul sistemului și al proiectelor (ex. administrator, manager de proiect, membru echipă).

**Out of scope:**

- sisteme complexe de control al accesului (RBAC/ABAC detaliat),
- permisiuni fine-grained pe resurse individuale.

---

### 3. Project

**Scop:**  
Reprezintă unitatea centrală de analiză și monitorizare. Un proiect agregă activitățile, resursele, costurile, baseline-ul planificat și indicatorii de performanță.

**Out of scope:**

- management de portofoliu sau program,
- integrare cu instrumente externe de project management,
- workflow-uri avansate de aprobare și guvernanță.

---

### 4. ProjectMember

**Scop:**  
Modelează relația dintre utilizatori și proiecte, indicând apartenența unui utilizator la un proiect și rolul acestuia în contextul respectiv.

**Out of scope:**

- ierarhii organizaționale complexe,
- alocări detaliate de capacitate sau competențe,
- management HR.

---

### 5. WorkItem (Task)

**Scop:**  
Reprezintă o activitate sau unitate de lucru planificată în cadrul unui proiect, utilizată pentru urmărirea progresului și pentru corelarea execuției cu planificarea inițială.

**Out of scope:**

- structură WBS completă,
- dependențe între activități și critical path,
- metodologii agile complete (sprinturi, backlog-uri).

---

### 6. Timesheet

**Scop:**  
Înregistrează timpul efectiv lucrat de utilizatori în cadrul proiectului (și, opțional, al unei activități). Constituie o sursă primară pentru calculul costurilor reale și al performanței.

**Out of scope:**

- pontaj legal și conformitate HR,
- fluxuri de aprobare multi-nivel,
- integrare cu sisteme de salarizare.

---

### 7. CostEntry

**Scop:**  
Reprezintă o înregistrare de cost efectiv asociată unui proiect, pentru cheltuieli care nu derivă direct din timpul lucrat (materiale, servicii, ajustări).

**Out of scope:**

- contabilitate financiară completă,
- facturare, taxe, TVA,
- centre de cost avansate.

---

### 8. Baseline

**Scop:**  
Definește planul aprobat al proiectului la un moment dat (buget și interval temporal), utilizat ca referință pentru comparația dintre planificat și realizat.

**Out of scope:**

- management complex al modificărilor (change control),
- reconcilierea simultană a mai multor baseline-uri,
- forecast avansat.

---

### 9. KPIDefinition

**Scop:**  
Descrie formal un indicator de performanță (ex. CPI, SPI), incluzând semnificația acestuia, scopul managerial și regulile generale de calcul.

**Out of scope:**

- motoare generice de formule,
- configurare dinamică avansată de KPI-uri,
- indicatori predictivi complecși.

---

### 10. KPISnapshot

**Scop:**  
Reprezintă o valoare istorică a unui KPI calculată la un moment specific în timp, permițând analiza evoluției performanței proiectului.

**Out of scope:**

- sisteme de tip data warehouse,
- analize predictive și simulări,
- agregări multi-proiect complexe.

---

## Notă de delimitare

Modelul conceptual este intenționat **minimal și orientat către MVP**, având ca obiectiv principal susținerea calculului și stocării indicatorilor CPI și SPI într-un mod clar, justificabil academic și extensibil ulterior.

Acest model va fi rafinat în etapele următoare prin:

- definirea relațiilor și cardinalităților (model logic),
- specificarea atributelor minime,
- implementarea fizică în baza de date.

## Model Logic – Relații și Cardinalități (ERD)

### Context

Această secțiune definește **relațiile dintre entitățile domeniului** și cardinalitățile asociate, constituind baza pentru realizarea diagramei ERD utilizate în capitolul de proiectare al lucrării.

Modelul logic rafinează modelul conceptual prin:

- explicitarea relațiilor one-to-many și many-to-many,
- definirea cheilor primare și a cheilor străine,
- justificarea deciziilor de modelare din perspectiva managementului proiectelor.

---

## Relații între entități

### 1. User ↔ Project (many-to-many prin ProjectMember)

**Tip relație:**  
User `N — M` Project, prin entitatea de asociere **ProjectMember**.

**Cardinalități:**

- Un **User** poate participa la 0..N proiecte.
- Un **Project** poate avea 0..N utilizatori asociați.
- Un **ProjectMember** aparține exact unui User și exact unui Project.

**Chei:**

- User (PK: `userId`)
- Project (PK: `projectId`)
- ProjectMember (PK: `projectMemberId`)
- ProjectMember (FK: `userId` → User)
- ProjectMember (FK: `projectId` → Project)
- Constrângere de unicitate: `(projectId, userId)`

**Justificare many-to-many:**  
Relația many-to-many este necesară deoarece un utilizator poate lucra simultan pe mai multe proiecte, iar un proiect implică mai mulți utilizatori. În plus, relația are atribute proprii (ex. rolul utilizatorului în proiect), ceea ce impune utilizarea unei entități intermediare dedicate.

---

### 2. Project → WorkItem (one-to-many)

**Tip relație:**  
Project `1 — N` WorkItem

**Cardinalități:**

- Un **Project** are 0..N work item-uri.
- Un **WorkItem** aparține exact unui Project.

**Chei:**

- Project (PK: `projectId`)
- WorkItem (PK: `workItemId`)
- WorkItem (FK: `projectId` → Project)

**Rațiune:**  
Work item-urile reprezintă activitățile planificate și executate în cadrul unui proiect și nu pot exista independent de acesta.

---

### 3. WorkItem → Timesheet (one-to-many)

**Tip relație:**  
WorkItem `1 — N` Timesheet

**Cardinalități:**

- Un **WorkItem** poate avea 0..N înregistrări de timp.
- Un **Timesheet** este asociat unui singur WorkItem.

**Chei:**

- WorkItem (PK: `workItemId`)
- Timesheet (PK: `timesheetId`)
- Timesheet (FK: `workItemId` → WorkItem)

**Observație:**  
Această relație permite corelarea directă dintre execuția activităților și planificarea inițială, fiind relevantă pentru calculul valorii câștigate (Earned Value).

---

### 4. Project → CostEntry (one-to-many)

**Tip relație:**  
Project `1 — N` CostEntry

**Cardinalități:**

- Un **Project** poate avea 0..N înregistrări de cost.
- Un **CostEntry** aparține exact unui Project.

**Chei:**

- Project (PK: `projectId`)
- CostEntry (PK: `costEntryId`)
- CostEntry (FK: `projectId` → Project)

**Rațiune:**  
Costurile reale sunt urmărite la nivel de proiect și constituie o sursă directă pentru calculul costului real (Actual Cost).

---

### 5. Project → Baseline (one-to-many)

**Tip relație:**  
Project `1 — N` Baseline

**Cardinalități:**

- Un **Project** poate avea 0..N baseline-uri.
- Un **Baseline** aparține exact unui Project.

**Chei:**

- Project (PK: `projectId`)
- Baseline (PK: `baselineId`)
- Baseline (FK: `projectId` → Project)

**Rațiune:**  
Baseline-ul reprezintă planul aprobat al proiectului și poate exista în mai multe versiuni, corespunzătoare unor momente diferite de aprobare.

---

### 6. Project → KPIDefinition (one-to-many)

**Tip relație:**  
Project `1 — N` KPIDefinition

**Cardinalități:**

- Un **Project** poate avea 0..N definiții de KPI.
- O **KPIDefinition** aparține exact unui Project.

**Chei:**

- Project (PK: `projectId`)
- KPIDefinition (PK: `kpiDefinitionId`)
- KPIDefinition (FK: `projectId` → Project)

**Rațiune:**  
Definițiile KPI sunt dependente de contextul proiectului (baseline, praguri, obiective) și sunt menținute la nivel de proiect în MVP.

---

### 7. KPIDefinition → KPISnapshot (one-to-many)

**Tip relație:**  
KPIDefinition `1 — N` KPISnapshot

**Cardinalități:**

- O **KPIDefinition** poate avea 0..N snapshot-uri în timp.
- Un **KPISnapshot** aparține exact unei KPIDefinition.

**Chei:**

- KPIDefinition (PK: `kpiDefinitionId`)
- KPISnapshot (PK: `kpiSnapshotId`)
- KPISnapshot (FK: `kpiDefinitionId` → KPIDefinition)

**Rațiune:**  
KPISnapshot permite stocarea evoluției în timp a unui indicator de performanță, fiind esențial pentru analiza istorică și decizională.

---

## Observații privind lizibilitatea ERD

Modelul logic poate fi reprezentat într-o diagramă ERD lizibilă (maximum o pagină A4) prin următoarele agregări principale:

- User —< ProjectMember >— Project
- Project —< WorkItem —< Timesheet
- Project —< CostEntry
- Project —< Baseline
- Project —< KPIDefinition —< KPISnapshot

Această structură asigură claritate, coerență și suport direct pentru calculul indicatorilor CPI și SPI în cadrul MVP-ului.

## Model Logic – Atribute minime (MVP Data Dictionary)

### Principii de modelare (MVP)

- Se introduc doar câmpuri care sunt necesare pentru:
  1. calcul KPI (CPI/SPI/Burn Rate) sau
  2. afișare/filtrare în UI (listări, status, intervale).
- Orice câmp care nu justifică direct (1) sau (2) este exclus.
- Tipurile sunt alese pentru stabilitate (DateTime pentru perioade; Decimal pentru bani).

---

## 1) User

**Câmpuri:**

- `id` — identificator unic (PK)
- `email` — identificare unică în sistem (login/demo + UI)
- `name` — afișare în UI (liste, timesheet)
- `role` — rol global (minim, până la auth avansat)
- `createdAt` — audit minim (util în seed, debug, trasabilitate)

**Justificare:** necesar pentru asocierea pontajelor și membership-ului pe proiect, plus afișare în UI.

---

## 2) Project

**Câmpuri:**

- `id` — identificator unic (PK)
- `name` — identificare în UI și referințe
- `startDate`, `endDate` — interval proiect (filtrare + perioade KPI)
- `plannedBudget (BAC)` — buget planificat (referință pentru control de cost / baseline)
- `status` — stare proiect (UI + filtrare)
- `createdAt` — audit minim

**Justificare KPI/UI:** intervalul și BAC sunt referințe pentru comparație plan vs actual; status pentru management operațional și listări.

---

## 3) ProjectMember

**Câmpuri:**

- `id` — PK (simplifică implementarea)
- `projectId` — FK către Project
- `userId` — FK către User
- `roleInProject` — rol în proiect (PM / MEMBER etc.)
- `createdAt` — audit minim
- Constrângere: `UNIQUE(projectId, userId)` (fără duplicate)

**Justificare:** relație many-to-many necesară (User lucrează pe mai multe proiecte; proiectul are echipă) și are atribut propriu (rol în proiect).

---

## 4) WorkItem (Task)

**Câmpuri:**

- `id` — PK
- `projectId` — FK către Project
- `name` — afișare în UI
- `plannedEndDate` — planificare minimă (UI + raportare)
- `progressPercent` — progres (0–100) pentru derivare simplă EV (MVP)
- `createdAt` — audit minim

**Justificare KPI/UI:** progresul este necesar pentru a susține EV într-o formă minimă; datele pentru planificare/filtrare.

---

## 5) Timesheet

**Câmpuri:**

- `id` — PK
- `userId` — FK către User
- `workItemId` — FK către WorkItem (legarea timpului de execuție)
- `date` — momentul execuției (serii temporale)
- `hours` — efort actual (bază pentru cost actual dacă ai rată sau pentru burn rate)
- `createdAt` — audit minim

**Justificare KPI:** sursă de date pentru execuție (actual effort/actual cost la nivel minim).

---

## 6) CostEntry

**Câmpuri:**

- `id` — PK
- `projectId` — FK către Project
- `date` — momentul costului (time series)
- `amount` — cost actual (AC)
- `createdAt` — audit minim

**Justificare KPI:** sursă directă pentru Actual Cost (AC) la nivel proiect.

---

## 7) Baseline

**Câmpuri:**

- `id` — PK
- `projectId` — FK către Project
- `plannedValueTotal` — valoare planificată totală (PV total / referință plan)
- `startDate`, `endDate` — interval baseline (clarifică perioada planului aprobat)
- `createdAt` — audit minim

**Justificare KPI:** furnizează referința planificată pentru comparații; PV total este un minim pragmatic în MVP.

---

## 8) KPIDefinition

**Câmpuri:**

- `id` — PK
- `projectId` — FK către Project
- `type` — tip KPI (CPI / SPI / BURN_RATE)
- `thresholdGreen` — prag pentru status verde
- `thresholdYellow` — prag pentru status galben
- `createdAt` — audit minim
- Constrângere recomandată: `UNIQUE(projectId, type)` (un singur CPI/SPI per proiect)

**Justificare KPI/UI:** permite configurarea pragurilor per proiect și tip KPI fără motor de formule.

---

## 9) KPISnapshot

**Câmpuri:**

- `id` — PK
- `projectId` — FK către Project (filtrare rapidă + integritate domeniu)
- `kpiDefinitionId` — FK către KPIDefinition
- `value` — valoarea KPI (ex. CPI numeric)
- `status` — verde/galben/roșu (UI)
- `computedAt` — momentul calculului (istoric)
- `createdAt` — audit minim

**Justificare KPI/UI:** stocare istorică în timp (cerință explicită); status pentru UI fără calcule suplimentare la afișare.
