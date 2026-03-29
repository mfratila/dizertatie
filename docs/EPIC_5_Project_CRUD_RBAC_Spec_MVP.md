# EPIC 5 – Project Management (CRUD + Team Assignment) (MVP)

## Story 1: Define Project CRUD Use-Cases & RBAC Rules (Specification)

---

## 1. Obiectiv

Definirea clară și neambiguă a:

- Cazurilor de utilizare pentru Project CRUD
- Regulilor RBAC aplicabile proiectelor
- Regulilor de vizibilitate a proiectelor
- Constrângerilor pentru membership

Scopul acestui document este asigurarea:

- consistenței arhitecturale,
- implementării deterministe,
- auditabilității regulilor de acces,
- alinierii cu principiile MVP.

---

## 2. Context arhitectural

Modelul de securitate este bazat pe:

- Roluri globale (Global Role): ADMIN | PM | MEMBER | VIEWER
- Membership la nivel de proiect: entitate ProjectMember
- Control de acces determinat de:
  - rol global
  - existența membership-ului
  - rolul în proiect (roleInProject)

---

## 3. Entități relevante (MVP)

### 3.1 Project

Câmpuri relevante:

- id
- name
- startDate
- endDate
- plannedBudget (BAC)
- status
- archivedAt
- createdAt
- updatedAt

### 3.2 ProjectMember

- projectId
- userId
- roleInProject ∈ {PM, MEMBER, VIEWER}
- Constrângere: UNIQUE(projectId, userId)

---

## 4. Principii de control acces (MVP)

1. Least privilege – utilizatorii au doar drepturile strict necesare.
2. Separarea responsabilităților – doar rolurile manageriale pot modifica proiecte.
3. Visibility by membership – proiectele sunt vizibile doar membrilor.
4. Determinism – accesul este determinat exclusiv de:
   - rol global
   - membership
   - rol în proiect

---

# 5. Project Visibility Rules

## 5.1 Listare proiecte (GET /projects)

ADMIN – vede toate proiectele  
PM – vede doar proiectele unde este membru  
MEMBER – vede doar proiectele unde este membru  
VIEWER – vede doar proiectele unde este membru

Implicit:

- Proiectele arhivate nu sunt incluse în listare (filtru default: active only).

---

## 5.2 Detalii proiect (GET /projects/{id})

Acces permis dacă:

- Utilizatorul este ADMIN
- SAU există ProjectMember(userId, projectId)

Răspunsuri standard:

- 401 – fără sesiune
- 403 – sesiune validă dar fără drept

---

# 6. Project CRUD – Use Cases & RBAC

## 6.1 CREATE Project

Permis pentru:

- ADMIN ✔
- PM ✔
- MEMBER ✖
- VIEWER ✖

Reguli:

- Creatorul devine automat ProjectMember(roleInProject = PM)
- MEMBER/VIEWER → 403 Forbidden

---

## 6.2 READ Project

Conform regulilor de vizibilitate definite în secțiunea 5.

---

## 6.3 UPDATE Project

Permis pentru:

- ADMIN ✔ orice proiect
- PM ✔ doar proiectele unde este PM
- MEMBER ✖
- VIEWER ✖

### Câmpuri editabile (MVP)

Editabile:

- name
- startDate
- endDate
- plannedBudget (BAC)
- status

Needitabile direct:

- archivedAt
- createdAt
- updatedAt

### Regula privind impactul KPI

Modificările la:

- startDate
- endDate
- plannedBudget

NU declanșează recalcul automat KPI.

Recalcularea KPI rămâne manuală prin endpoint dedicat.

---

## 6.4 ARCHIVE Project (Soft Delete)

Permis pentru:

- ADMIN ✔
- PM ✔ doar proiectele unde este PM
- MEMBER ✖
- VIEWER ✖

Efecte:

- archivedAt != null
- status = ARCHIVED
- Proiectul nu apare în listări implicite

---

# 7. Team Assignment (Project Members)

## 7.1 Add Member

Permis pentru:

- ADMIN ✔
- PM ✔ doar în proiectele unde este PM
- MEMBER ✖
- VIEWER ✖

Se poate seta:
roleInProject ∈ {PM, MEMBER, VIEWER}

Restricții:

- Nu se pot modifica roluri globale
- Un user poate avea un singur membership per proiect

---

## 7.2 Remove Member

Permis pentru:

- ADMIN ✔
- PM ✔ doar în proiectele unde este PM

Constrângeri:

1. Un proiect trebuie să aibă cel puțin un PM.
2. Este interzisă eliminarea ultimului PM.
3. Eliminarea ultimului PM → 409 Conflict.

---

## 7.3 Change Member Role

Permis pentru:

- ADMIN ✔
- PM ✔ doar în proiectele unde este PM

Regulă:

- Nu se poate lăsa proiectul fără PM.

---

# 8. Matrice sumar RBAC (MVP)

| Acțiune         | ADMIN | PM (unde e PM) | MEMBER | VIEWER |
| --------------- | ----- | -------------- | ------ | ------ |
| List projects   | ✔     | ✔              | ✔      | ✔      |
| Read project    | ✔     | ✔              | ✔      | ✔      |
| Create project  | ✔     | ✔              | ✖      | ✖      |
| Update project  | ✔     | ✔              | ✖      | ✖      |
| Archive project | ✔     | ✔              | ✖      | ✖      |
| Manage members  | ✔     | ✔              | ✖      | ✖      |

---

# 9. Constrângeri suplimentare (MVP)

- Soft delete obligatoriu (nu hard delete).
- Enforcement exclusiv server-side.
- Membership verificat în query layer.
- Decizii RBAC centralizate.

---

# 10. Concluzie

Specificația:

- elimină ambiguitățile
- menține coerența cu MVP
- este deterministă
- este ușor de testat
- este ușor de documentat în disertație
- este aliniată cu arhitectura existentă

Status: READY FOR IMPLEMENTATION
