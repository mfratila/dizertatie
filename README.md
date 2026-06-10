# KPI Tracker

KPI Tracker este o aplicație web dezvoltată ca MVP pentru lucrarea de disertație. Scopul aplicației este monitorizarea performanței proiectelor prin colectarea datelor operaționale, calculul indicatorilor KPI și afișarea rezultatelor în dashboard-uri manageriale.

Aplicația urmărește relația dintre planificare, execuție și control managerial, folosind indicatori precum **CPI**, **SPI** și **Burn Rate**.

---

## Funcționalități principale

- autentificare cu email și parolă prin NextAuth;
- control acces pe roluri: `ADMIN`, `PM`, `MEMBER`, `VIEWER`;
- creare și administrare proiecte;
- alocare membri pe proiecte;
- definire și urmărire activități / work items;
- introducere date de execuție: pontaje, costuri și riscuri;
- definire baseline și KPI-uri;
- recalculare KPI și salvare snapshot-uri istorice;
- dashboard de portofoliu și dashboard de proiect.

---

## Arhitectură generală

Aplicația este construită ca sistem web full-stack pe baza arhitecturii oferite de Next.js App Router.

```text
Browser
  ↓
Next.js App Router
  ↓
Server Components / Server Actions / API Routes
  ↓
Prisma ORM
  ↓
PostgreSQL
```

### Componente principale

- **Frontend**: pagini Next.js, componente React și stilizare CSS/Tailwind;
- **Backend**: API Routes și Server Actions în Next.js;
- **Autentificare**: NextAuth cu Credentials Provider;
- **Autorizare**: RBAC aplicat server-side pentru pagini și API;
- **Persistență**: PostgreSQL accesat prin Prisma ORM;
- **KPI Engine**: calcul server-side pentru PV, EV, AC, CPI, SPI și Burn Rate;
- **Dashboard-uri**: strat read-only pentru agregare și suport decizional.

---

## Model de date MVP

Modelul de date este centrat pe entitatea `Project`, care agregă planificarea, execuția și evaluarea performanței.

Entitățile principale sunt:

- `User`
- `Project`
- `ProjectMember`
- `WorkItem`
- `Timesheet`
- `CostEntry`
- `Risk`
- `Baseline`
- `KPIDefinition`
- `KPISnapshot`

---

## Tehnologii utilizate

- **Next.js**
- **React**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **NextAuth**
- **bcrypt**
- **Tailwind CSS**
- **Docker Compose** pentru baza de date locală

---

## Rulare locală

### Cerințe

- Node.js `>= 18`
- Docker Desktop cu Docker Compose

### 1. Instalare dependențe

```bash
npm install
```

### 2. Configurare variabile de mediu

Copiază fișierul de exemplu:

```bash
cp .env.example .env
```

Pentru rulare locală cu Docker Compose, valorile implicite din `.env.example` sunt suficiente.

### 3. Pornire PostgreSQL local

```bash
docker compose up -d
```

### 4. Aplicare migrații Prisma

```bash
npx prisma migrate dev
```

### 5. Populare date demo

```bash
npx prisma db seed
```

### 6. Pornire aplicație

```bash
npm run dev
```

Aplicația va fi disponibilă la:

```text
http://localhost:3000
```

---

## Verificare rapidă

Endpoint pentru verificarea aplicației și a conexiunii la baza de date:

```text
http://localhost:3000/api/health
```

Răspuns așteptat:

```json
{
  "status": "ok",
  "db": "ok"
}
```

---

## Utilizatori demo

După rularea seed-ului, sunt disponibili următorii utilizatori:

| Rol | Email | Parolă |
| --- | --- | --- |
| ADMIN | `admin@demo.local` | `admin123` |
| PM | `pm@demo.local` | `pm123` |
| MEMBER | `member@demo.local` | `member123` |
| MEMBER | `member2@demo.local` | `member123` |
| VIEWER | `viewer@demo.local` | `viewer123` |

Datele demo sunt destinate exclusiv testării și prezentării aplicației.

---

## Build și verificări

```bash
npm run build
npm run lint
npm run format:check
npm run test:run
```

Pentru deployment pe Vercel, proiectul include scriptul:

```bash
npm run vercel-build
```

---

## Deployment

Pentru o variantă simplă de deployment, aplicația poate fi rulată cu:

- **Vercel** pentru aplicația Next.js;
- **Supabase PostgreSQL** sau alt serviciu PostgreSQL managed pentru baza de date.

Variabilele principale necesare în mediu de producție sunt:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="..."
NEXTAUTH_URL="https://domeniu-aplicatie.vercel.app"
```

Pentru baza de date de producție se recomandă:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Seed-ul trebuie rulat doar intenționat, pentru inițializarea sau resetarea datelor demo.

---

## Observații

Acest proiect este un MVP academic, nu o platformă enterprise completă. Funcționalitățile au fost delimitate pentru a demonstra clar fluxul:

```text
Date operaționale → KPI Engine → Snapshot-uri KPI → Dashboard managerial
```

Scopul principal este evidențierea modului în care un sistem informatic de gestiune poate transforma datele despre execuția proiectelor în informație utilă pentru monitorizare și decizie managerială.
