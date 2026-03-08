# Modulul Project Management (MVP)

## Documentație pentru lucrarea de disertație

### Context general

Modulul **Project Management** reprezintă componenta centrală a aplicației dezvoltate în cadrul lucrării de disertație. Rolul acestui modul este de a gestiona entitățile de tip proiect, membrii acestora și regulile de acces, oferind infrastructura necesară pentru colectarea datelor operaționale și pentru calculul indicatorilor KPI (CPI, SPI, Burn Rate) în modulul KPI Engine.

Acest modul este implementat într-o arhitectură web modernă, utilizând:

- **Next.js (App Router)** pentru API și interfață
- **Prisma ORM** pentru accesul la baza de date
- **PostgreSQL** pentru persistența datelor
- **NextAuth** pentru autentificare
- **RBAC (Role Based Access Control)** pentru controlul accesului

Modulul Project Management este dezvoltat incremental, conform principiilor Agile, și constituie baza pentru modulele ulterioare:

- Task Management
- Execution Tracking
- KPI Engine

---

# 1. Use‑Cases ale modulului Project

## Actori

| Actor  | Descriere                               |
| ------ | --------------------------------------- |
| Admin  | administratorul sistemului              |
| PM     | project manager responsabil de proiect  |
| Member | membru al proiectului                   |
| Viewer | utilizator cu acces doar la vizualizare |

## Tabel Use‑Cases

| Use Case             | Actor                           | Descriere                            |
| -------------------- | ------------------------------- | ------------------------------------ |
| Create Project       | Admin, PM                       | creează un proiect nou               |
| View Projects        | Toți utilizatorii autentificați | vizualizează proiectele accesibile   |
| View Project Details | Admin, membri proiect           | vizualizează detaliile proiectului   |
| Update Project       | Admin, PM proiect               | modifică parametrii proiectului      |
| Manage Members       | Admin, PM proiect               | adaugă sau elimină membri            |
| Archive Project      | Admin, PM proiect               | arhivează proiectul                  |
| Access KPI           | Membrii proiectului             | accesează indicatorii de performanță |

---

# 2. Regulile RBAC pentru modulul Project

Controlul accesului este implementat prin modelul **RBAC (Role Based Access Control)**.

## Roluri globale

- **ADMIN**
- **PM**
- **MEMBER**
- **VIEWER**

## Roluri în contextul proiectului

În interiorul unui proiect există roluri specifice:

- **PM**
- **MEMBER**
- **VIEWER**

## Matrice RBAC

| Operație        | Admin | PM proiect | Member | Viewer |
| --------------- | ----- | ---------- | ------ | ------ |
| Create project  | ✔     | ✔          | ✖      | ✖      |
| View project    | ✔     | ✔          | ✔      | ✔      |
| Update project  | ✔     | ✔          | ✖      | ✖      |
| Manage members  | ✔     | ✔          | ✖      | ✖      |
| Archive project | ✔     | ✔          | ✖      | ✖      |
| View KPI        | ✔     | ✔          | ✔      | ✔      |

Regulă importantă de integritate:

> Un proiect trebuie să aibă întotdeauna cel puțin un PM.

Prin urmare, sistemul nu permite eliminarea ultimului PM din proiect.

---

# 3. Modelele de date

## 3.1 Modelul Project

Modelul **Project** reprezintă entitatea principală a sistemului.

### Câmpuri principale

| Câmp                | Tip       | Descriere                    |
| ------------------- | --------- | ---------------------------- |
| id                  | integer   | identificator unic           |
| name                | string    | numele proiectului           |
| startDate           | date      | data de început              |
| endDate             | date      | data de final                |
| plannedBudget (BAC) | decimal   | buget planificat             |
| status              | enum      | starea proiectului           |
| createdAt           | datetime  | data creării                 |
| archivedAt          | datetime? | data arhivării (soft delete) |

### Statusuri proiect

- PLANNED
- ACTIVE
- COMPLETED

Proiectele arhivate sunt marcate prin câmpul `archivedAt` și nu sunt eliminate fizic din baza de date.

---

## 3.2 Modelul ProjectMember

Modelul **ProjectMember** definește relația dintre utilizatori și proiecte.

### Câmpuri

| Câmp          | Tip      | Descriere                  |
| ------------- | -------- | -------------------------- |
| projectId     | integer  | referință către proiect    |
| userId        | integer  | referință către utilizator |
| roleInProject | enum     | rolul utilizatorului       |
| createdAt     | datetime | data atribuirii            |

### Constrângeri

- un utilizator nu poate fi adăugat de două ori în același proiect
- există constrângere unică:

```
@@unique([projectId, userId])
```

Aceasta asigură integritatea datelor la nivel de bază de date.

---

# 4. Fluxul operațional al modulului

Fluxul tipic al utilizării modulului Project este următorul:

## 1. Crearea proiectului

Un utilizator cu rol **Admin** sau **PM** creează un proiect nou, specificând:

- numele proiectului
- perioada de execuție
- bugetul planificat (BAC)

Implicit, creatorul proiectului devine **PM al proiectului**.

## 2. Alocarea membrilor

Project Manager-ul poate adăuga membri în proiect și le poate atribui roluri:

- PM
- MEMBER
- VIEWER

## 3. Colectarea datelor de execuție

În modulele ulterioare ale aplicației sunt introduse:

- activități (tasks)
- progresul acestora
- costurile reale

Aceste date sunt asociate proiectului.

## 4. Calculul KPI

Datele colectate sunt utilizate de **KPI Engine** pentru a calcula indicatorii:

- CPI (Cost Performance Index)
- SPI (Schedule Performance Index)
- Burn Rate

Rezultatele sunt salvate sub formă de **snapshot-uri KPI**.

---

# 5. Integrarea cu modulele următoare

Modulul Project reprezintă baza pentru restul sistemului.

## Task Module

Gestionarea activităților proiectului.

Responsabilități:

- definirea task-urilor
- urmărirea progresului

## Execution Module

Colectarea datelor operaționale:

- progres task-uri
- costuri reale
- milestone-uri

## KPI Engine

Calculează indicatorii de performanță:

- CPI
- SPI
- Burn Rate

Pe baza datelor colectate în modulul Execution.

---

# 6. Concluzie

Modulul Project Management oferă infrastructura necesară pentru organizarea proiectelor și gestionarea accesului utilizatorilor. Prin utilizarea unui model RBAC și a unor constrângeri de integritate la nivel de bază de date, sistemul asigură consistența datelor și prevenirea accesului neautorizat.

Acest modul constituie fundamentul arhitectural pentru funcționalitățile de execuție și analiză a performanței proiectelor implementate în modulele ulterioare ale aplicației.
