# Modulul de execuție (MVP): Timesheets, CostEntry și Risk

## 1. Contextul modulului

Modulul de execuție reprezintă componenta aplicației prin care sunt colectate datele operaționale minimale necesare pentru monitorizarea execuției proiectului în varianta MVP. Acesta extinde modulul de proiect și modulul de work items prin introducerea a trei categorii de date:

- **Timesheet** – evidența orelor lucrate pe activități, pe zile și utilizatori;
- **CostEntry** – evidența costurilor reale asociate proiectului;
- **Risk** – registrul minimal de riscuri pentru managementul proiectului.

În arhitectura sistemului, acest modul are un rol dublu. Pe de o parte, susține dimensiunea operațională a aplicației prin trasabilitatea muncii efectuate, a costurilor și a riscurilor. Pe de altă parte, oferă datele necesare pentru calculul indicatorilor KPI, în special pentru componenta de cost. În MVP, maparea critică este:

**CostEntry → Actual Cost (AC) → CPI / Burn Rate**.

Prin urmare, modulul de execuție este componenta care face legătura dintre activitatea curentă din proiect și componenta analitică implementată în KPI Engine.

---

## 2. Poziționarea modulului în arhitectura aplicației

Fluxul general al aplicației, după implementarea modulului de execuție, este următorul:

1. Se creează proiectul și se alocă membrii echipei.
2. Se definesc work items și se actualizează progresul acestora.
3. Se introduc datele de execuție:
   - ore lucrate prin timesheets,
   - costuri reale prin cost entries,
   - riscuri prin risk register.
4. KPI Engine citește datele persistate din bază.
5. Se calculează variabilele EVM și KPI-urile derivate.
6. Rezultatele sunt salvate în snapshot-uri pentru analiză istorică.

Această succesiune este coerentă cu arhitectura generală a aplicației și cu rolul modulului Project ca fundament pentru celelalte module. Execuția nu funcționează independent, ci este legată de:

- `Project` – ca agregat principal;
- `ProjectMember` – pentru controlul accesului;
- `WorkItem` – pentru asocierea pontajelor și a progresului;
- `KPI Engine` – pentru utilizarea costurilor reale în calcul.

---

## 3. Obiectivele funcționale ale modulului

În varianta MVP, modulul de execuție urmărește patru obiective funcționale principale:

1. **captarea datelor operaționale minimale** necesare pentru demonstrarea unui sistem de monitorizare a proiectelor;
2. **separarea clară a datelor de execuție** față de datele de planificare și față de rezultatele agregate;
3. **susținerea calculului KPI** prin furnizarea unei surse explicite pentru costul real;
4. **demonstrarea unei dimensiuni manageriale** prin introducerea unui registru simplu de riscuri.

Această delimitare este importantă din perspectivă academică, deoarece justifică faptul că sistemul nu este doar un dashboard de indicatori, ci un PMIS minimal în care datele introduse manual sunt transformate în rezultate măsurabile.

---

## 4. Entitățile modulului de execuție

### 4.1. Entitatea Timesheet

Entitatea **Timesheet** reprezintă o înregistrare a timpului lucrat de un utilizator pe o activitate (`WorkItem`) într-o anumită zi.

### Rol funcțional

Scopul principal al acestei entități este de a oferi trasabilitate operațională. Prin timesheets, aplicația poate demonstra că progresul și execuția proiectului sunt susținute de date concrete privind munca efectuată.

### Câmpuri relevante în MVP

- `id` – identificator unic;
- `userId` – utilizatorul care a introdus pontajul;
- `workItemId` – activitatea pe care s-au lucrat orele;
- `date` – data execuției;
- `hours` – numărul de ore lucrate;
- `note` – explicație opțională;
- `createdAt` – audit minim.

### Semnificație managerială

Timesheet-ul permite observarea distribuției efortului în timp, la nivel de activitate și utilizator. Chiar dacă în MVP nu este utilizat direct pentru calculul costului real, acesta oferă realism și trasabilitate, permițând o extensie ulterioară către costuri derivate din efort și rate orare.

### Observație de proiectare

În MVP, `Timesheet` este tratat ca **supporting data**, nu ca sursă oficială pentru `AC`.

---

### 4.2. Entitatea CostEntry

Entitatea **CostEntry** reprezintă o înregistrare de cost real asociată unui proiect.

### Rol funcțional

Aceasta este cea mai importantă entitate a modulului din perspectiva KPI Engine, deoarece furnizează sursa oficială pentru **Actual Cost (AC)**.

### Câmpuri relevante în MVP

- `id` – identificator unic;
- `projectId` – proiectul căruia îi aparține costul;
- `date` – data costului;
- `amount` – valoarea costului;
- `category` – categorie opțională (`Labor`, `Tools`, `Other`);
- `note` – explicație opțională;
- `createdAt` – audit minim.

### Semnificație managerială

Prin această entitate pot fi înregistrate costuri reale de tip muncă, instrumente sau cheltuieli diverse. Sistemul nu urmărește contabilitate completă, ci doar captarea acelor costuri care permit analiza performanței în raport cu progresul și bugetul.

### Rol în KPI Engine

În implementarea MVP, **AC se calculează ca sumă a valorilor `CostEntry.amount` filtrate pe proiect și moment de calcul**. Această decizie păstrează motorul KPI clar, determinist și ușor de justificat.

---

### 4.3. Entitatea Risk

Entitatea **Risk** reprezintă o înregistrare în registrul de riscuri al proiectului.

### Rol funcțional

Scopul său este de a demonstra că aplicația nu colectează doar date cantitative, ci și date manageriale relevante pentru conducerea proiectului.

### Câmpuri relevante în MVP

- `id` – identificator unic;
- `projectId` – proiectul asociat;
- `title` – descriere scurtă a riscului;
- `probability` – probabilitate pe scară 1–5;
- `impact` – impact pe scară 1–5;
- `status` – `OPEN` sau `CLOSED`;
- `ownerUserId` – responsabil opțional;
- `note` – detalii opționale;
- `createdAt`, `updatedAt` – audit minim.

### Semnificație managerială

Registrul de riscuri permite proiectului să rețină amenințări relevante și să arate o componentă minimală de control managerial. În MVP nu se implementează scoruri compuse, workflow complex de aprobare sau integrare automată cu KPI-urile.

### Observație de proiectare

În MVP, `Risk` este **vizibil și gestionabil**, dar **nu intră direct în formulele de calcul KPI**.

---

## 5. Relațiile dintre entități

Modulul de execuție se integrează în modelul de date al aplicației prin relații simple și coerente:

- `Project 1 — N CostEntry`
- `Project 1 — N Risk`
- `Project 1 — N WorkItem`
- `WorkItem 1 — N Timesheet`
- `User 1 — N Timesheet`
- `User 1 — N Risk (ca owner opțional)`

Acest model are trei avantaje importante:

1. menține integritatea datelor la nivel de proiect;
2. permite controlul accesului pe baza apartenenței la proiect;
3. oferă suport direct pentru KPI Engine fără transformări complicate.

---

## 6. Use-cases ale modulului de execuție

### 6.1. Introducerea execuției prin timesheets

Un membru al proiectului sau un PM poate introduce o înregistrare de tip timesheet selectând:

- activitatea (`workItem`),
- data,
- numărul de ore,
- o notă opțională.

Cazul de utilizare susține trasabilitatea muncii și permite analizarea distribuției efortului pe activități și pe intervale de timp.

### 6.2. Urmărirea costurilor reale

Un PM sau un administrator poate introduce costuri reale pentru proiect, specificând:

- data costului,
- suma,
- categoria,
- nota opțională.

Acest caz de utilizare este critic deoarece costurile introduse alimentează direct variabila `AC`, utilizată ulterior în calculul `CPI` și `Burn Rate`.

### 6.3. Gestionarea registrului de riscuri

Un PM sau un administrator poate crea, actualiza sau închide riscuri. Utilizatorii cu acces read-only pot vizualiza registrul, fără a modifica datele.

Acest caz de utilizare oferă suport pentru dimensiunea managerială a sistemului și poate fi utilizat în capitolul de validare pentru a demonstra că aplicația tratează atât execuția operațională, cât și controlul managerial al proiectului.

---

## 7. RBAC și reguli de acces

Controlul accesului în modulul de execuție respectă modelul RBAC definit pentru întregul MVP și este aplicat server-side.

### 7.1. Timesheets

- `ADMIN` – poate crea, vedea, actualiza și șterge orice entry;
- `PM` – poate crea și gestiona timesheets în proiectele unde este PM;
- `MEMBER` – poate crea timesheets în proiectele unde este membru și își poate modifica doar propriile înregistrări;
- `VIEWER` – poate doar vizualiza datele, fără drept de modificare.

### 7.2. CostEntry

- `ADMIN` – acces complet;
- `PM` – poate crea și gestiona costuri în proiectele unde este PM;
- `MEMBER` – doar vizualizare în MVP;
- `VIEWER` – doar vizualizare.

### 7.3. Risk

- `ADMIN` – acces complet;
- `PM` – CRUD minimal în proiectele unde este PM;
- `MEMBER` – read-only în MVP;
- `VIEWER` – read-only.

### Observație

Deși modelul RBAC general al MVP permite conceptual introducerea de date de execuție și de către `MEMBER`, pentru `CostEntry` și `Risk` s-a ales o variantă mai restrictivă, justificată de impactul acestor date asupra analizei manageriale și asupra KPI-urilor.

---

## 8. Validări și reguli de integritate

Pentru a menține consistența datelor, modulul aplică validări explicite în API și în server actions.

### 8.1. Validări pentru Timesheet

- `hours > 0`
- `hours <= 24`
- `date` trebuie să fie validă
- `workItemId` trebuie să existe
- `workItem` trebuie să aparțină proiectului în contextul căruia se face operația
- `MEMBER` nu poate modifica timesheet-uri care aparțin altui utilizator

### 8.2. Validări pentru CostEntry

- `amount > 0`
- `date` trebuie să fie validă
- `projectId` trebuie să existe
- nu se pot adăuga costuri pe proiecte arhivate
- `category`, dacă este completată, trebuie să aparțină setului permis în MVP

### 8.3. Validări pentru Risk

- `title` este obligatoriu
- `probability` trebuie să fie în intervalul `1..5`
- `impact` trebuie să fie în intervalul `1..5`
- `status` trebuie să fie `OPEN` sau `CLOSED`
- `ownerUserId`, dacă există, trebuie să aparțină unui membru al proiectului

Aceste reguli simplifică validarea și reduc riscul introducerii de date incoerente.

---

## 9. Maparea modulului de execuție către KPI Engine

Din perspectiva integrării cu KPI Engine, nu toate entitățile din modulul de execuție au același rol.

### 9.1. Maparea directă

În MVP, maparea directă este:

- `CostEntry.amount` → `AC`
- `AC` + `EV` → `CPI`
- `AC` + `elapsedDays` → `Burn Rate`

### 9.2. Maparea indirectă sau contextuală

- `Timesheet` – oferă suport operațional și trasabilitate, dar nu intră direct în formula `AC`;
- `Risk` – oferă context managerial, dar nu este utilizat în formulele KPI.

### 9.3. Formula relevantă

În implementarea MVP, variabilele de cost sunt calculate astfel:

- `AC = SUM(CostEntry.amount)`
- `CPI = EV / AC`
- `Burn Rate = AC / elapsedDays`

Prin această mapare, modulul de execuție contribuie direct la analiza performanței de cost, dar păstrează în același timp o separare clară între datele brute și rezultatele agregate.

---

## 10. Fluxul operațional al modulului

Fluxul operațional minimal al modulului de execuție poate fi descris astfel:

1. Utilizatorul accesează pagina proiectului și intră în secțiunea de execuție.
2. Utilizatorul introduce un timesheet, un cost sau un risc, în funcție de rol.
3. Datele sunt validate server-side.
4. Entitățile sunt persistate în baza de date PostgreSQL prin Prisma.
5. Datele devin vizibile imediat în listări după revalidarea paginilor.
6. KPI Engine poate folosi costurile introduse pentru recalcularea indicatorilor.
7. Rezultatele sunt persistate sub formă de snapshot-uri KPI.

Acest flux este suficient pentru MVP deoarece evită complexitatea aprobărilor, a automatizărilor și a integrărilor externe, păstrând totuși trasabilitatea completă.

---

## 11. Scenariu minimal de validare

Pentru validarea funcțională a modulului și pentru demonstrarea integrării cu KPI Engine, poate fi folosit următorul scenariu:

### Context inițial

Se consideră proiectul `Project Alpha`, pentru care există deja:

- work items cu progres înregistrat;
- cost entries inițiale;
- definiții KPI configurate;
- posibilitatea de recalcul manual KPI.

### Pași

1. PM-ul proiectului introduce un nou `CostEntry` cu:
   - `date = 2026-02-20`
   - `amount = 800`
   - `category = Tools`
2. Costul este salvat în baza de date și apare în lista de costuri.
3. Se declanșează recalcularea KPI prin endpoint-ul dedicat.
4. KPI Engine recitește datele din bază.
5. Variabila `AC` crește cu valoarea nou introdusă.
6. Indicatorii `CPI` și `Burn Rate` se modifică.
7. Rezultatul recalculării este salvat într-un nou snapshot.

### Rezultat așteptat

- lista de costuri reflectă noua înregistrare;
- valoarea `AC` utilizată la calcul este mai mare decât la momentul anterior;
- `CPI` se modifică în sensul reducerii eficienței de cost dacă `EV` rămâne constant;
- `Burn Rate` crește dacă numărul de zile scurse rămâne același.

Acest scenariu demonstrează explicit relația dintre datele introduse în modulul de execuție și indicatorii calculați de motorul KPI.

---

## 12. Date seed și utilitatea lor în demonstrație

Pentru a permite demonstrarea aplicației fără input manual extins, în seed-ul bazei de date sunt introduse date de execuție pentru `Project Alpha`, incluzând:

- mai multe timesheets distribuite pe mai multe zile și utilizatori;
- mai multe cost entries cu valori și categorii diferite;
- două riscuri, unul deschis și unul închis.

Acest set de date permite:

- listarea și filtrarea în UI;
- demonstrarea controlului RBAC;
- recalcularea KPI pe baza unui `AC` nenul;
- observarea modificării KPI-urilor în mai multe momente.

Prin urmare, seed-ul nu are doar rol tehnic, ci și rol de suport pentru validarea experimentală a lucrării.

---

## 13. Limitările MVP

Modulul de execuție este intenționat minimal. Limitările sale principale sunt următoarele:

### 13.1. Limitări privind costurile

- costurile sunt introduse manual;
- nu există integrare cu sisteme contabile sau ERP;
- nu există TVA, centre de cost sau clasificări financiare avansate;
- nu există generare automată a costurilor din timesheets.

### 13.2. Limitări privind timesheets

- nu există workflow de aprobare;
- nu există pontaj legal sau logică HR;
- nu există reguli avansate privind suprapuneri sau norme zilnice/săptămânale.

### 13.3. Limitări privind riscurile

- nu există scor compus probabilitate × impact automatizat în interfață;
- nu există istoric separat de schimbări de status;
- nu există integrare între riscuri și recalcul KPI;
- nu există planuri de răspuns sau workflow de tratare.

### 13.4. Limitări de integrare

- recalcularea KPI este manuală, nu automată la fiecare modificare de cost;
- modulul nu implementează forecast avansat;
- datele sunt gestionate la nivel de proiect individual, nu multi-proiect.

Aceste limitări sunt acceptabile în contextul MVP deoarece scopul principal este demonstrarea unui flux coerent și justificabil academic, nu realizarea unui sistem enterprise complet.

---

## 14. Justificarea alegerilor de proiectare

Alegerea unui modul de execuție minimal este justificată prin trei argumente principale.

### 14.1. Simplitate controlată

Sistemul trebuie să fie suficient de mic pentru a putea fi implementat, testat și explicat complet în cadrul unei lucrări de dizertație.

### 14.2. Trasabilitate clară

Fiecare entitate introdusă are o justificare directă:

- `Timesheet` – susține execuția operațională;
- `CostEntry` – alimentează `AC`;
- `Risk` – susține dimensiunea managerială.

### 14.3. Extensibilitate ulterioară

Modelul permite extinderi viitoare fără a necesita restructurări majore, de exemplu:

- costuri derivate din timesheets;
- scor automat de risc;
- integrare cu forecast și indicatori avansați;
- aprobări și audit extins.

---

## 15. Concluzie

Modulul de execuție completează arhitectura aplicației prin introducerea datelor operaționale și manageriale necesare pentru monitorizarea proiectului în MVP. Acesta este alcătuit din trei entități principale: `Timesheet`, `CostEntry` și `Risk`, fiecare având un rol bine definit în sistem.

Contribuția esențială a modulului este furnizarea unei surse explicite și controlate pentru costul real al proiectului. Prin maparea `CostEntry → AC → CPI / Burn Rate`, modulul se conectează direct la KPI Engine și permite demonstrarea relației dintre datele de execuție și indicatorii de performanță.

În același timp, prin timesheets și risk register, aplicația depășește nivelul unui simplu calculator de KPI și demonstrează caracterul unui sistem minimal de management al proiectelor, cu suport pentru execuție, control managerial și analiză istorică.

Prin urmare, modulul de execuție este congruent cu implementarea realizată, suficient pentru obiectivele MVP și adecvat pentru includerea directă în capitolul de implementare și validare al lucrării.
