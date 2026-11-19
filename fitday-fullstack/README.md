# FITDAY

FITDAY è un’app web per gestire un guardaroba digitale, tenere traccia del bucato e comporre look giornalieri. L’interfaccia è in italiano, con supporto per inglese e tedesco.

## Stack

- **Next.js 16** con App Router e Route Handlers
- **React 19** e **TypeScript** in modalità strict
- **Supabase** per autenticazione, PostgreSQL e storage
- **Zod** per validare i payload
- **Vercel AI SDK** per la selezione opzionale degli outfit
- **Three.js**, React Three Fiber e Drei per l’avatar 3D
- **Tailwind CSS 4** e CSS del progetto per gli stili

## Struttura del codice

```text
src/
├── app/                         # Pagine Next.js, layout, API e stili globali
│   ├── api/                     # Route Handlers server-side
│   ├── components/              # Componenti condivisi dall’app
│   └── <route>/page.tsx         # Entry point delle pagine
├── features/
│   └── wardrobe/                # Interfaccia e logica specifiche del guardaroba
│       ├── components/          # Form e inventario dei capi
│       └── wardrobe-page.tsx    # Stato, filtri e operazioni del guardaroba
├── lib/                         # Integrazioni, utility e validazione condivisa
│   ├── supabase/                # Client Supabase browser/server e proxy
│   └── validation/              # Schemi di validazione
└── types/                       # Tipi condivisi del dominio

supabase/
└── migrations/                  # Migrazioni SQL versionate
```

Le pagine in `src/app` sono entry point del router. La logica specifica di una funzionalità va in `src/features/<feature>`; utility e integrazioni riutilizzabili restano in `src/lib`, mentre i tipi condivisi vivono in `src/types`.

## Requisiti

- Node.js 20.9 o superiore (consigliato Node.js 22 LTS)
- npm 10 o superiore
- Un progetto Supabase

## Avvio in locale

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Crea `.env.local` partendo da `.env.example` e inserisci URL e chiave publishable del tuo progetto Supabase:

   ```bash
   cp .env.example .env.local
   ```

   In PowerShell, in alternativa:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Applica la migrazione `supabase/migrations/20261116000100_initial_schema.sql` dal SQL Editor di Supabase oppure tramite Supabase CLI:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

4. Avvia il server di sviluppo:

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000) e crea un account. Se la conferma email è attiva, verifica l’indirizzo prima di accedere.

## Variabili d’ambiente

| Variabile | Necessaria | Utilizzo |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sì | URL del progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sì | Chiave publishable per i client Supabase |
| `AI_GATEWAY_API_KEY` | No | Accesso server-side a Vercel AI Gateway |
| `AI_MODEL` | No | Modello abilitato su AI Gateway |
| `WEATHER_API_KEY` | No | Predisposizione per integrazione meteo |

Le variabili con prefisso `NEXT_PUBLIC_` sono esposte al browser: usarle solo per valori pubblici. Non inserire mai chiavi `service_role`, password o altre credenziali server-side in variabili pubbliche o nel repository. `.env.local` è escluso da Git.

## Funzionalità

- Dashboard con riepilogo del guardaroba e outfit del giorno
- Gestione dei capi con categoria, brand, colore, vestibilità, stato del bucato e foto
- Ricerca, filtri, ordinamento e selezione multipla dei capi
- Diario degli outfit e generazione di una combinazione a partire dai capi puliti
- Profilo e anteprima 3D dell’avatar
- Autenticazione email/password con sessioni Supabase
- Interfaccia multilingue e preferenze di lingua salvate nel browser

La selezione degli outfit usa una modalità deterministica quando l’integrazione AI non è configurata. L’avatar attuale è un modello procedurale: non rappresenta una scansione corporea né una simulazione realistica dei vestiti.

## API

| Metodo | Endpoint | Scopo |
|---|---|---|
| `GET`, `POST` | `/api/garments` | Elenco e creazione dei capi |
| `GET`, `PATCH`, `DELETE` | `/api/garments/:id` | Lettura, aggiornamento ed eliminazione di un capo |
| `GET`, `POST` | `/api/outfits` | Storico e salvataggio degli outfit |
| `GET` | `/api/outfits/today?date=YYYY-MM-DD` | Outfit del giorno per una data |
| `POST` | `/api/outfits/generate` | Generazione di un outfit |
| `DELETE` | `/api/outfits/:id` | Eliminazione di un outfit |
| `GET`, `PATCH` | `/api/avatar` | Lettura e aggiornamento del profilo avatar |

Le route server-side usano la sessione Supabase dell’utente. L’accesso ai dati deve continuare a essere limitato da policy Row Level Security oltre ai controlli applicativi.

## Dati e storage

La migrazione iniziale crea:

- `profiles`: nome visualizzato e preferenze di stile
- `garments`: inventario personale e stato del bucato
- `avatar_profiles`: configurazione dell’avatar
- `outfits` e `outfit_items`: outfit giornalieri e capi associati
- enum, indici, trigger di aggiornamento e policy RLS
- bucket privato `wardrobe`, con policy per limitare i file alla cartella dell’utente

Quando si aggiungono tabelle o bucket, aggiornare le migrazioni e le policy RLS insieme alle relative route; non affidarsi solo ai controlli dell’interfaccia.

## Qualità e verifiche

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript senza emissione di file
npm run build      # Build di produzione Next.js
```

## Sicurezza e manutenzione

- Non committare file `.env*` contenenti credenziali; mantenere nel repository solo `.env.example` con valori segnaposto.
- Non esporre chiavi Supabase `service_role` al client.
- Mantenere privato il bucket delle immagini e verificare le policy di accesso per utente.
- Configurare redirect URL, email e SMTP in Supabase Auth prima della produzione.
- Prima del rilascio, aggiungere test automatizzati, rate limiting, monitoraggio, backup e controllo dei contenuti caricati.

## Possibili evoluzioni

1. Completare onboarding e preferenze del profilo.
2. Aggiungere feedback sugli outfit e contesto meteo.
3. Migliorare la generazione ibrida con vincoli e preferenze esplicite.
4. Valutare un avatar riggato e asset 3D di capi prima di presentare la funzione come prova virtuale realistica.
5. Esporre le API documentate anche a un eventuale client mobile.
