# EPIC 8 – Dashboard Managerial (MVP)
## Story 1: Define dashboard use-cases & KPIs displayed (spec)

---

## 1. Obiectiv

Definirea clară și neambiguă a dashboard-urilor MVP, a KPI-urilor afișate și a regulilor RBAC aferente, astfel încât implementarea să fie deterministă, congruentă cu modulele deja existente și ușor de documentat în disertație.

Scopul dashboard-urilor este strict de **vizualizare managerială și agregare a datelor existente**, fără introducere de logică nouă de business.

---

## 2. Context arhitectural

Dashboard Managerial se bazează pe modulele deja implementate:

- **Project** – identitate proiect, perioadă, BAC
- **WorkItem** – progres proiect
- **CostEntry** – cost real (AC)
- **Risk** – context managerial
- **KPISnapshot** – KPI curenți și istoric
- **KPI Engine** – responsabil pentru calcul KPI

### Principiu cheie

**Dashboard = read-only aggregation layer peste date existente**

NU:
- calculează KPI
- modifică date
- introduce logică nouă

---

## 3. Rolul dashboard-urilor în lucrare

Dashboard-urile demonstrează:

- integrarea modulelor
- transformarea datelor în informație managerială
- suport decizional bazat pe KPI

---

## 4. Dashboard-uri MVP

### 4.1 Portfolio Dashboard

Scop:
- sinteză starea proiectelor
- identificare rapidă proiecte problematice
- navigare către Project Dashboard

### 4.2 Project Dashboard

Scop:
- vizualizare KPI curenți
- analiză trend KPI
- contextualizare prin progres, cost, risc

---

## 5. Use-cases

### UC-D1: Vizualizare portofoliu
Actor: ADMIN, PM, MEMBER, VIEWER

Rezultat:
- listă proiecte
- status general (RAG)

### UC-D2: Vizualizare proiect
Actor: ADMIN, PM, MEMBER, VIEWER

Rezultat:
- KPI curenți
- progres
- cost
- risc

### UC-D3: Vizualizare trend KPI
Actor: ADMIN, PM, MEMBER, VIEWER

Rezultat:
- evoluție CPI, SPI, Burn Rate

### UC-D4: Interpretare RAG
Actor: ADMIN, PM, MEMBER, VIEWER

Rezultat:
- status GREEN / YELLOW / RED / NA

### UC-D5: Navigare portofoliu → proiect

### UC-D6: Recalcul KPI
Actor: ADMIN, PM

Rezultat:
- apel endpoint recalcul
- refresh dashboard

---

## 6. KPI afișați

### KPI oficiali MVP

- CPI
- SPI
- Burn Rate

### Semnificație

- CPI → eficiență cost
- SPI → eficiență plan
- Burn Rate → ritm consum cost

---

## 7. Structura dashboard-urilor

### 7.1 Portfolio Dashboard

Pentru fiecare proiect:

- name
- perioadă
- status
- progres
- BAC
- cost actual
- CPI, SPI, Burn Rate
- status RAG

### Regula RAG general

- RED dacă există KPI RED
- YELLOW dacă există KPI YELLOW
- GREEN dacă toate sunt GREEN
- NA dacă nu există date

---

### 7.2 Project Dashboard

#### A. Project Summary
- name
- interval
- BAC
- status
- progres

#### B. KPI Current
- CPI + RAG
- SPI + RAG
- Burn Rate + RAG

#### C. KPI Trends
- serie CPI
- serie SPI
- serie Burn Rate

#### D. Progress
- progres global
- listă work items

#### E. Cost & Risk
- AC total
- cost vs BAC
- nr. riscuri OPEN

---

## 8. RBAC

### ADMIN
- acces total
- recalcul KPI

### PM
- acces pe proiectele proprii
- recalcul KPI

### MEMBER
- acces read-only
- vede KPI
- fără recalcul

### VIEWER
- acces read-only
- vede KPI
- fără recalcul

### Clarificări

- MEMBER vede KPI → DA (read-only)
- VIEWER vede KPI → DA (read-only)
- Dashboard nu permite editare

---

## 9. Vizibilitate

- ADMIN → toate proiectele
- restul → doar proiectele unde sunt membri
- proiectele arhivate → excluse implicit

---

## 10. Legătura cu obiectivele lucrării

Dashboard-ul demonstrează:

### Integrare
- Project + WorkItem + Execution + KPI

### Suport decizional
- KPI + RAG + trend

### Auditabilitate
- bazat pe snapshot-uri

---

## 11. Scope MVP

### Inclus

- dashboard portofoliu
- dashboard proiect
- KPI current
- KPI trend
- RAG
- read-only
- recalcul KPI (ADMIN/PM)

### Exclus

- editare dashboard
- BI avansat
- forecast
- predicții
- configurare widget-uri

---

## 12. Concluzie

Specificația este:

- clară
- deterministă
- fără ambiguități
- aliniată cu arhitectura existentă

Dashboard-ul reprezintă stratul de vizualizare managerială al sistemului.

