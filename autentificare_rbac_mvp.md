
# Autentificare și RBAC (MVP) — Documentație pentru dizertație

## 1. Obiectiv și context
Aplicația KPI-Tracker gestionează date operaționale (timp, cost), date de planificare (baseline)
și rezultate agregate (KPI snapshot-uri). Acest tip de date impune mecanisme minime de securitate
pentru prevenirea accesului neautorizat și delimitarea responsabilităților.

În MVP nu se urmărește implementarea unui sistem enterprise IAM, ci un mecanism simplu,
reproductibil local, suficient pentru demo și justificare academică.

---

## 2. Strategie de autentificare

### 2.1 Decizie de design
S-a ales NextAuth (v4) cu Credentials Provider (email + parolă) și parole hash-uite cu bcrypt.

**Motivație:**
- implementare simplă și locală
- integrare directă cu Prisma User
- suport nativ pentru sesiuni și RBAC

### 2.2 Flux de autentificare
1. Utilizatorul accesează pagina `/login`.
2. Introduce email și parolă.
3. Parola este verificată cu `bcrypt.compare()`.
4. La succes se creează o sesiune și utilizatorul este redirecționat către `/dashboard`.

### 2.3 Sesiune
Sesiunea este stocată sub forma unui JWT criptat (JWE) într-un cookie HTTP-only
(`next-auth.session-token`). Conținutul token-ului este accesibil exclusiv server-side.

---

## 3. Roluri și RBAC

### 3.1 Roluri definite
- **ADMIN** – administrare utilizatori și control complet
- **PM** – management proiecte și KPI
- **MEMBER** – introducere date de execuție
- **VIEWER** – vizualizare dashboard (read-only)

### 3.2 Propagarea rolului
Rolul este preluat din baza de date și propagat:
- în token-ul de sesiune
- în `session.user.role`, tipizat strict (`enum Role`)

---

## 4. Matrice rol → permisiuni (MVP)

| Permisiune | ADMIN | PM | MEMBER | VIEWER |
|-----------|-------|----|--------|--------|
| Administrare utilizatori | ✔ | ✖ | ✖ | ✖ |
| Creare proiecte | ✔ | ✔ | ✖ | ✖ |
| Definire baseline | ✔ | ✔ | ✖ | ✖ |
| Definire KPI | ✔ | ✔ | ✖ | ✖ |
| Recalcul KPI | ✔ | ✔ | ✖ | ✖ |
| Introducere timp/cost | ✔ | ✔ | ✔ | ✖ |
| Vizualizare dashboard | ✔ | ✔ | ✔ | ✔ |

---

## 5. Protecția rutelor UI

### 5.1 Middleware
Middleware-ul Next.js verifică existența cookie-ului de sesiune și redirecționează
utilizatorii neautentificați către `/login`.

### 5.2 Page guards
Page-guards server-side verifică:
- existența unei sesiuni valide
- rolul utilizatorului

Utilizatorii cu rol nepermis sunt redirecționați către `/access-denied`.

---

## 6. Protecția API

- **401 Unauthorized** – lipsă sesiune
- **403 Forbidden** – rol neautorizat

Endpoint-uri demonstrative:
- `/api/secure/ping`
- `/api/secure/admin-ping`

---

## 7. Utilizatori demo (seed)

Scriptul de seed creează:
- 1 × ADMIN
- 1 × PM
- 1 × MEMBER
- 1 × VIEWER

Parolele sunt simple, documentate pentru demo și stocate hash-uit.

---

## 8. Concluzie
Soluția implementată oferă autentificare sigură, RBAC coerent și control demonstrabil
al accesului, fiind adecvată pentru cerințele nefuncționale ale lucrării de dizertație.
