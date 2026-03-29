# ADR-001 — Strategie de autentificare (MVP)

## Status

**ACCEPTED (MVP)**

---

## Context și problemă

Aplicația dezvoltată în cadrul lucrării de dizertație gestionează date sensibile de proiect (costuri, timp de execuție, baseline, KPI-uri și snapshot-uri istorice). Prin urmare, este necesar un mecanism de autentificare care să asigure:

- protecția minimă a datelor,
- diferențierea clară a rolurilor utilizatorilor (RBAC),
- integrare coerentă cu arhitectura Next.js (App Router),
- reproductibilitate completă în mediu local,
- simplitate și ușurință de justificare academică.

Având în vedere obiectivele lucrării (MVP demonstrabil, fără infrastructură enterprise), nu se urmărește implementarea unui sistem complex de tip IAM (Identity and Access Management).

---

## Cerințe funcționale (MVP)

- Autentificare pe bază de **email + parolă**
- Stocarea securizată a parolelor prin **hash (bcrypt)**
- Autentificare bazată pe **sesiune (session-based)**
- Compatibilitate directă cu mecanismul de **Role-Based Access Control (RBAC)**
- Funcționare exclusiv locală (fără OAuth extern, IdP sau servicii terțe)

---

## Decizia

Se adoptă **NextAuth.js (Auth.js)** cu **Credentials Provider**, configurat pentru:

- validarea credențialelor utilizatorului direct în baza de date PostgreSQL,
- compararea parolelor folosind `bcrypt.compare`,
- gestionarea sesiunilor la nivel de aplicație (session-based authentication),
- injectarea rolului utilizatorului în obiectul de sesiune pentru suport RBAC.

---

## Justificarea alegerii

### 1. Simplitate și eficiență pentru MVP

NextAuth reduce semnificativ cantitatea de cod necesară pentru gestionarea autentificării (login, sesiuni, cookies), permițând focalizarea pe logica de domeniu și pe KPI-uri.

### 2. Integrare nativă cu Next.js

Soluția este optimizată pentru Next.js App Router și permite protejarea coerentă a:

- rutelor UI (frontend guards),
- endpoint-urilor API (backend authorization).

### 3. Compatibilitate directă cu RBAC

Rolul utilizatorului (`ADMIN`, `PM`, `MEMBER`, `VIEWER`) este inclus în sesiune și utilizat uniform atât în UI, cât și în backend.

### 4. Reproductibilitate și demo local

Autentificarea nu depinde de servicii externe (Google, GitHub, Azure AD etc.), ceea ce permite rularea completă a aplicației pe orice sistem local, conform README.

---

## Alternative analizate (și motivele respingerii)

### 1. Autentificare custom (cookies + session store manual)

- Control complet asupra implementării
- **Respins**: complexitate ridicată, risc crescut de erori de securitate

### 2. JWT stateless custom

- Scalabilitate bună
- **Respins**: necesită mecanisme suplimentare (refresh tokens, revocare), nejustificate pentru MVP

### 3. OAuth / Identity Provider extern

- Securitate ridicată
- **Respins**: dependență externă, scade reproductibilitatea și claritatea demo-ului academic

---

## Implicații arhitecturale și de securitate

### Avantaje

- Parolele nu sunt stocate în clar (bcrypt)
- Sesiunile pot fi invalidate ușor
- Mecanism unificat pentru UI și API

### Limitări asumate (MVP)

- Fără MFA
- Fără politici avansate de parolă
- Fără rate limiting avansat (posibil minim)

Aceste limitări sunt asumate explicit și documentate ca fiind în afara scopului MVP-ului.

---

## Decizii concrete de implementare

1. Modelul `User` conține câmpurile: `email`, `password` (hash), `role`
2. Hash-ul parolei se realizează cu **bcrypt** la seed și la crearea utilizatorilor
3. NextAuth Credentials Provider:
   - caută utilizatorul după email
   - validează parola prin bcrypt
4. Callback-uri NextAuth:
   - `session`: injectează `userId` și `role`
   - `jwt` (dacă este utilizat): persistă rolul
5. Strategia de sesiune recomandată: **persistare în DB (Prisma Adapter)**

---

## Suport pentru RBAC

Rolul utilizatorului este disponibil în `session.user.role` și este utilizat pentru:

- protejarea rutelor UI (ex. dashboard, management proiecte)
- autorizarea endpoint-urilor API
- diferențierea funcționalităților disponibile (PM vs Member vs Viewer)

---

## Concluzie

Strategia de autentificare aleasă (NextAuth.js + Credentials Provider) oferă un echilibru optim între securitate, simplitate și reproductibilitate. Aceasta este adecvată pentru un MVP academic și susține în mod direct obiectivele lucrării de dizertație, fără a introduce complexitate nejustificată de tip enterprise.
