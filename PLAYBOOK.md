Pasul 0 – Alege un clientId
Exemple:

erikajurescu

bistro-luna

hotel-albatros

petjungle etc.

Fără spații, doar litere, cifre și -.

Pasul 1 – Creează structura de fișiere
În folderul clients/:
clients/
  noul-client-id/
    config.json
    prompts/
      system-prompt.txt
      context.txt        # opțional, dar foarte util

Poți copia un client existent ca template (ex. erikajurescu) și apoi modifici valorile.

Pasul 2 – config.json (config client)
Template de bază:
{
  "id": "noul-client-id",
  "name": "Numele complet al clientului",
  "brandColor": "#4F46E5",
  "defaultLanguage": "ro",
  "description": "Descriere scurtă a afacerii / serviciilor.",
  "toneOfVoice": "prietenoasă, clară, profesionistă",
  "openingMessage": "Bună! 👋 Sunt asistentul virtual al [Nume Client]. Cu ce vă pot ajuta?",
  "allowedTopics": [
    "informații generale",
    "servicii",
    "program",
    "programări",
    "tarife",
    "contact"
  ]
}

Câmpurile folosite în mod special:


id – trebuie să corespundă cu numele folderului.


name – apare în UI (în header și în listă).


brandColor – îl poți folosi în UI, dacă vrei (momentan e mai mult informativ).


openingMessage – mesajul cu care se prezintă botul, pe care îl poate folosi frontend-ul.


Atât timp cât există clients/<id>/config.json, serverul îl va vedea automat în GET /api/clients.

Pasul 3 – system-prompt.txt (regulile de comportament)
Acesta e promptul de sistem specific clientului.
Fișier: clients/<id>/prompts/system-prompt.txt.
Template generic (business „normal” – restaurant / hotel / magazin):
Ești asistentul virtual al [Nume Client], un [tip de business: restaurant/hotel/magazin/etc.] din România.

SCOP:
- răspunzi la întrebările clienților într-un mod util, clar și politicos;
- oferi informații despre serviciile disponibile, program, locație, prețuri orientative (dacă sunt puse la dispoziție în context);
- ajuți utilizatorii să ajungă la o rezervare / comandă / programare, atunci când este relevant.

STIL:
- răspunzi în limba română;
- folosești un ton [prietenoasă, clară, profesionistă] (adaptat din config);
- adresezi utilizatorul la persoana a II-a plural („dumneavoastră”) – excepție doar dacă businessul vrea un ton foarte casual;
- răspunsurile sunt scurte și la obiect: 1–3 paragrafe sau liste cu bullet points.

LIMITĂRI:
- dacă o informație lipsește din context (de exemplu, nu ai prețuri exacte), nu inventezi cifre; spui sincer că nu ai detaliul respectiv și inviți utilizatorul să contacteze direct businessul;
- dacă utilizatorul cere ceva complet în afara businessului (de exemplu, sfaturi medicale detaliate pentru un restaurant), explici politicos că nu este domeniul tău și recomanzi un specialist relevant.

Dacă nu ești sigur(ă) de un răspuns, recunoști acest lucru și sugerezi utilizatorului să contacteze direct echipa [Nume Client] (telefon, e-mail, formular de pe site).

Pentru tipuri specifice (psiholog, clinică, etc.) e bine să ai un template separat cu reguli de siguranță (nu pui diagnostice, redirecționezi către 112 în caz de urgență etc.).

Pasul 4 – context.txt (context business, date concrete)
Fișier opțional, dar foarte util: clients/<id>/prompts/context.txt.
Aici pui:


lista de servicii exact cum apare pe site;


locație, program, tipuri de clienți;


valori, stil, câteva explicații mai lungi etc.


Important: nu trebuie să fie scris „pentru utilizator”, ci „pentru model”. Exemplu:
CONTEXT DESPRE [NUME CLIENT] – DOAR PENTRU MODEL

1. TIP AFACERE
[Descriere în 2–3 fraze]

2. SERVICII / PRODUSE
- [Serviciu 1] – descriere scurtă
- [Serviciu 2] – descriere scurtă
- [Serviciu 3] – descriere scurtă

Asistentul virtual trebuie să folosească această listă când vorbește despre servicii și să nu inventeze alte servicii.

3. PROGRAM ȘI LOCAȚIE
- Adresă: [stradă, oraș]
- Program: L–V [ore], S [ore] etc.

4. ALTE INFORMAȚII
- Politica de rezervări / anulări (dacă există)
- Alte detalii utile

chat.ts adaugă acest text la system prompt ca „context”, cu instrucțiunea să nu fie copiat mot-a-mot, ci folosit ca sursă de adevăr.
Dacă context.txt lipsește, pur și simplu nu e folosit – deci nu strică nimic.

Pasul 5 – Testare client nou


Pornește serverul:
npm run dev



Deschide http://localhost:3000.


În dropdown-ul de sus se încarcă lista din GET /api/clients.
Ar trebui să vezi și noul client (numele din config.json).


Selectează clientul și începe conversația.
Frontend-ul trimite istoricul în format:
{
  "messages": [
    { "role": "user", "content": "Bună!" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "Vreau o rezervare vineri seara" }
  ]
}



Dacă răspunsurile nu sunt cum îți dorești, ajustezi:


system-prompt.txt → ton & reguli


context.txt → informații mai precise



4. Formatul messages în API
Endpoint:
POST /api/chat/:clientId
Content-Type: application/json

Body:
{
  "messages": [
    { "role": "user", "content": "Primul mesaj" },
    { "role": "assistant", "content": "Răspunsul botului" },
    { "role": "user", "content": "Mesaj nou" }
  ]
}

Serverul:


adaugă un system message cu promptul construit (config + system-prompt + context)


trimite totul la OpenAI


întoarce:


{
  "clientId": "client-id",
  "clientName": "Nume Client",
  "reply": "Textul răspunsului generat"
}

Frontend-ul adaugă reply în messages ca:
{ "role": "assistant", "content": reply }

și îl afișează în UI.

5. Workflow cu Git (foarte pe scurt)


vezi ce s-a schimbat:
git status



adaugi modificări:
git add .



commit:
git commit -m "Adaugat client nou [id]"



push:
git push



Pe alt computer:
git clone https://github.com/USERNAME/chatbot-agency-template.git
cd chatbot-agency-template
npm install
# creezi .env
npm run dev


6. Checklist „client nou în 5 minute”


 Aleg clientId și creez clients/<clientId>/.


 Creez config.json (copiat dintr-un client existent + modificat).


 Creez prompts/system-prompt.txt cu regulile business-ului.


 (Opțional dar recomandat) Creez prompts/context.txt cu servicii, program, alte info.


 Pornesc serverul și testez în UI.


 Ajustez prompturile dacă răspunsurile nu sunt OK.


 git add ., git commit, git push.


Dacă toți pașii de mai sus sunt bifați, clientul e gata de prezentat. 🎯

---

Vrei să-ți adaug la final și o secțiune cu **exemple de `system-prompt.txt` și `context.txt`** pentru alte tipuri de business (restaurant, hotel, magazin online)?  
Așa ai totul într-un singur loc, în același fișier.
