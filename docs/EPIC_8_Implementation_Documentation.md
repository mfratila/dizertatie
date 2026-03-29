# Dashboard-uri manageriale (MVP) ca sistem de suport decizional

## 1. Rolul dashboard-urilor în arhitectura aplicației

În arhitectura aplicației dezvoltate în cadrul lucrării, dashboard-urile manageriale reprezintă stratul de vizualizare și interpretare a datelor agregate, construit deasupra modulelor deja implementate pentru gestiunea proiectelor, urmărirea progresului, colectarea datelor de execuție și calculul KPI-urilor. Din această perspectivă, dashboard-urile nu introduc logică nouă de business, ci valorifică rezultatele deja persistate de motorul KPI și le prezintă într-o formă ușor de interpretat de către factorii de decizie.

Această poziționare este specifică unui **sistem de suport decizional (Decision Support System – DSS)**: datele operaționale nu sunt analizate direct de utilizatorul final, ci sunt prelucrate într-un nivel intermediar și transformate în informații sintetice, relevante pentru control managerial. În MVP, această transformare se bazează pe snapshot-uri KPI persistate server-side, care asigură reproducibilitate, auditabilitate și coerență între calculele efectuate și reprezentarea lor în interfață.

Prin urmare, dashboard-urile nu trebuie înțelese ca simple ecrane grafice, ci ca interfața managerială a unui sistem informatic orientat spre monitorizarea performanței proiectelor și sprijinirea deciziei pe baza indicatorilor KPI.

---

## 2. Distincția dintre dashboard-ul de portofoliu și dashboard-ul de proiect

În varianta MVP au fost implementate două dashboard-uri complementare, fiecare răspunzând unui nivel diferit de analiză managerială.

### 2.1. Dashboard-ul de portofoliu

Dashboard-ul de portofoliu oferă o vedere de ansamblu asupra proiectelor vizibile pentru utilizatorul curent. Acesta este conceput pentru a facilita identificarea rapidă a proiectelor cu performanță bună, incertă sau problematică, fără a intra încă în detalii operaționale.

Pentru fiecare proiect, dashboard-ul de portofoliu afișează:
- identificatorul și numele proiectului;
- statusul proiectului;
- ultimul snapshot disponibil pentru fiecare KPI principal: CPI, SPI și Burn Rate;
- o stare agregată de tip RAG (`overall health`), derivată din stările celor trei KPI.

Logica de agregare este deterministă și explicită:
- `RED` are prioritate maximă;
- apoi `YELLOW`;
- apoi `GREEN`;
- iar `NA` este tratat ca absență de informație calculabilă.

Această regulă permite o triere rapidă a proiectelor din perspectivă managerială. Dacă un proiect are cel puțin un indicator critic, întregul proiect este marcat ca problematic la nivel de portofoliu, ceea ce reflectă principiul prudenței manageriale.

### 2.2. Dashboard-ul de proiect

Dashboard-ul de proiect reprezintă nivelul detaliat de analiză. Acesta este accesat prin navigarea din portofoliu către proiectul selectat și oferă două tipuri de informații:

1. **starea curentă a performanței**, prin afișarea ultimelor valori KPI disponibile;
2. **evoluția în timp a performanței**, prin afișarea seriilor istorice pentru fiecare KPI.

În implementarea actuală, dashboard-ul de proiect include:
- KPI cards pentru CPI, SPI și Burn Rate;
- status RAG pentru fiecare KPI;
- timestamp-ul ultimului calcul (`lastComputedAt`);
- grafice simple de linie pentru trendurile CPI, SPI și Burn Rate;
- buton de recalcul manual pentru Admin și PM, cu feedback explicit de loading, success și error.

Prin această structură, dashboard-ul de proiect îndeplinește rolul de instrument managerial de control și analiză: el nu doar semnalează o problemă, ci permite și observarea evoluției acesteia în timp.

---

## 3. Maparea KPI → semnificație managerială și decizie

Pentru ca dashboard-urile să poată fi justificate din perspectivă DSS, este esențială explicitarea legăturii dintre fiecare KPI și deciziile manageriale pe care le poate susține.

### 3.1. CPI (Cost Performance Index)

CPI exprimă eficiența costului și este calculat în MVP ca raport dintre `EV` și `AC`. Interpretarea managerială este următoarea:
- **CPI > 1**: proiectul consumă mai puține resurse financiare decât valoarea câștigată; situație favorabilă;
- **CPI = 1**: proiectul este exact pe buget;
- **CPI < 1**: proiectul cheltuiește mai mult decât valoarea realizată; indică depășire de buget sau ineficiență de cost.

Exemplu de decizie managerială:
- dacă **CPI < 1**, managerul poate decide revizuirea structurii costurilor, limitarea cheltuielilor neesențiale, reevaluarea resurselor sau investigarea cauzelor de ineficiență.

### 3.2. SPI (Schedule Performance Index)

SPI exprimă eficiența raportată la planificare și este calculat în MVP ca raport dintre `EV` și `PV`.

Interpretarea managerială:
- **SPI > 1**: proiectul avansează mai repede decât planul;
- **SPI = 1**: proiectul este la timp;
- **SPI < 1**: proiectul este în întârziere față de planificare.

Exemplu de decizie managerială:
- dacă **SPI < 1**, managerul poate decide realocarea resurselor, reprioritizarea activităților, simplificarea unor livrabile sau revizuirea calendarului de execuție.

### 3.3. Burn Rate

Burn Rate exprimă ritmul mediu de consum al costului în timp și este calculat în MVP ca raport dintre `AC` și `elapsedDays`. Acest indicator este util în special pentru monitorizarea vitezei de consum a bugetului.

Interpretarea managerială:
- un Burn Rate mai mare indică un consum mai accelerat al bugetului;
- un Burn Rate mai redus indică un consum mai lent.

În MVP, Burn Rate este tratat în aceeași infrastructură generală de KPI și RAG, însă trebuie menționat că semnificația „mai mare = mai bun” nu este universal valabilă pentru acest indicator. Prin urmare, în discursul academic, Burn Rate trebuie prezentat mai degrabă ca **indicator descriptiv de consum**, util pentru analiza ritmului financiar al execuției, decât ca indicator normativ suficient în sine.

Exemplu de decizie managerială:
- dacă Burn Rate crește semnificativ în timp, managerul poate decide investigarea surselor de cost, limitarea cheltuielilor variabile sau recalibrarea etapelor rămase.

---

## 4. Exemple de interpretare managerială pe baza datelor demo

Pentru validarea dashboard-urilor, pot fi utilizate datele demo reale introduse în seed. În scenariul actual, proiectele demo permit ilustrarea unor situații manageriale distincte, ceea ce este util atât pentru demonstrație practică, cât și pentru capitolul de validare.

### 4.1. Exemplu: Project Alpha

În datele demo, `Project Alpha` este configurat astfel încât să ilustreze un proiect aflat într-o stare mixtă:
- **CPI = 0.95** → semnalizează o ușoară ineficiență de cost;
- **SPI = 1.03** → sugerează că execuția este ușor înaintea planului;
- **Burn Rate = 1250.00 currency/day** → oferă o imagine asupra ritmului de consum bugetar.

Interpretare managerială:
- proiectul nu este critic din punct de vedere al calendarului, deoarece `SPI > 1`;
- însă există o atenționare pe cost, deoarece `CPI < 1`;
- în dashboard-ul de portofoliu, acest proiect este clasificat global ca `YELLOW`, deoarece statusul agregat este derivat după regula „cel mai rău KPI domină”.

Concluzia managerială este că proiectul poate continua fără măsuri radicale, dar necesită monitorizare atentă a costurilor.

### 4.2. Exemplu: Project Beta

În datele demo, `Project Beta` este configurat astfel încât să evidențieze o stare problematică:
- **CPI = 0.82** → depășire de cost mai accentuată;
- **SPI = 0.88** → întârziere față de plan;
- **Burn Rate = 2100.00 currency/day** → ritm de consum bugetar mai ridicat.

Interpretare managerială:
- proiectul are simultan probleme de cost și de calendar;
- dashboard-ul de portofoliu îl va marca global `RED`;
- dashboard-ul de proiect permite observarea directă a valorilor și a trendurilor care justifică această clasificare.

Concluzia managerială este că proiectul necesită intervenție: realocare de resurse, control mai strict al costurilor și revizuirea executării activităților.

---

## 5. Trenduri KPI și valoarea lor în suportul decizional

Una dintre diferențele esențiale dintre un simplu ecran de indicatori și un DSS constă în capacitatea de a susține **analiza evolutivă**, nu doar fotografia punctuală a stării curente. Din această perspectivă, graficele de trend pentru CPI, SPI și Burn Rate au un rol central.

În MVP, trendurile sunt construite pe baza istoricului `KPISnapshot` și respectă două principii importante:
- ordinea temporală este păstrată cronologic;
- lipsa datelor într-un interval este reprezentată ca „gap”, fără a fabrica valori intermediare.

Această abordare este corectă metodologic, deoarece evită concluzii false. Dacă într-un interval nu există date suficiente pentru calcul, sistemul nu afișează un `0` artificial și nici nu interpolează o valoare care nu a fost calculată efectiv.

Din perspectivă managerială, trendurile permit observarea:
- deteriorării treptate a cost performance;
- recuperării sau accentuării întârzierilor;
- accelerării consumului financiar.

Prin urmare, dashboard-ul de proiect nu se limitează la controlul post-factum, ci oferă suport pentru anticiparea tendințelor și pentru intervenție timpurie.

---

## 6. Tratarea explicită a stărilor inițiale și a datelor insuficiente

Un element important pentru corectitudinea decizională a dashboard-urilor este tratarea explicită a cazurilor în care datele necesare nu sunt încă disponibile. În MVP au fost luate în considerare trei situații:

1. proiect fără definiții KPI;
2. proiect cu definiții KPI, dar fără snapshot-uri calculate;
3. KPI individual în stare `NA`.

În toate aceste cazuri, interfața nu afișează valori fabricate și nu substituie lipsa informației prin `0`. În schimb:
- valorile lipsă sunt afișate ca `N/A`;
- statusul este marcat explicit `NA`;
- utilizatorului i se oferă mesaje descriptive, de tip „Insufficient data to compute KPI”.

Această decizie de design este importantă pentru poziționarea dashboard-ului ca DSS, deoarece previne interpretările eronate. Un sistem de suport decizional credibil nu trebuie să simplifice artificial situațiile de incertitudine, ci să le marcheze explicit.

---

## 7. Controlul accesului și relevanța managerială

Dashboard-urile sunt integrate în mecanismul RBAC deja implementat în aplicație. Vizualizarea este permisă tuturor utilizatorilor cu acces la proiect, însă recalcularea KPI este permisă doar rolurilor `ADMIN` și `PM`, atât în endpoint-ul backend, cât și în interfață.

Această separare are relevanță managerială și academică:
- utilizatorii de tip `VIEWER` și `MEMBER` pot interpreta starea proiectului, dar nu pot modifica artificial rezultatele analitice;
- rolurile manageriale pot declanșa în mod controlat recalcularea, ceea ce permite demonstrarea live a impactului modificărilor de execuție asupra indicatorilor.

Prin urmare, dashboard-ul nu este doar un instrument de vizualizare, ci un punct de interacțiune controlată între execuție, analiză și decizie.

---

## 8. Capturi de ecran și utilizarea lor în lucrare

Pentru capitolul de implementare și validare, se recomandă inserarea a cel puțin două tipuri de capturi de ecran:

### 8.1. Captură pentru dashboard-ul de portofoliu
Aceasta trebuie să evidențieze:
- lista proiectelor;
- KPI latest per proiect;
- overall health;
- diferența dintre un proiect cu status `YELLOW` și unul cu status `RED`.

### 8.2. Captură pentru dashboard-ul de proiect
Aceasta trebuie să evidențieze:
- KPI cards pentru CPI, SPI și Burn Rate;
- timestamp-ul ultimului snapshot;
- trendurile KPI în timp;
- eventual butonul `Recalculate KPI`, dacă utilizatorul este `PM` sau `ADMIN`.

În textul lucrării, capturile trebuie descrise nu doar ca ilustrare vizuală, ci ca dovadă a faptului că sistemul transformă date operaționale în informații manageriale interpretabile.

---

## 9. Legătura directă cu obiectivele lucrării

Dashboard-urile contribuie direct la obiectivele lucrării din trei perspective.

### 9.1. Integrarea modulelor implementate
Ele demonstrează că modulele de proiect, work items, execuție și KPI engine funcționează integrat într-un sistem informatic coerent.

### 9.2. Suport decizional managerial
Prin utilizarea KPI, a clasificării RAG și a trendurilor istorice, dashboard-urile susțin luarea rapidă a deciziilor și identificarea proiectelor problematice.

### 9.3. Validare practică a MVP-ului
Dashboard-urile constituie punctul în care MVP-ul devine vizibil ca produs software orientat spre management. Ele traduc modelele de date și formulele teoretice în interfețe concrete, utilizabile în scenarii reale sau simulate.

În consecință, dashboard-urile pot fi poziționate în mod legitim, în cadrul lucrării, ca o componentă de tip DSS implementată într-o formă minimală, dar funcțională și justificabilă academic.

---

## 10. Concluzie

Dashboard-urile manageriale implementate în MVP reprezintă componenta prin care aplicația trece de la simpla colectare și calcul al datelor la furnizarea unui suport real pentru decizie. Dashboard-ul de portofoliu permite identificarea rapidă a proiectelor care necesită atenție, iar dashboard-ul de proiect oferă context detaliat asupra stării curente și a evoluției performanței.

Prin maparea explicită dintre KPI și semnificația managerială, prin utilizarea snapshot-urilor istorice și prin tratarea corectă a stărilor de tip `NA`, aceste dashboard-uri susțin obiectivul central al lucrării: dezvoltarea unui sistem informatic de monitorizare a performanței proiectelor și sprijinirea deciziei manageriale pe baza indicatorilor KPI.
