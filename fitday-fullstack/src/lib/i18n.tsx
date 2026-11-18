"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "it" | "de" | "en";
type Message = readonly [italian: string, german: string, english: string];

const messages = {
  "common.language": ["Lingua", "Sprache", "Language"],
  "common.add": ["Aggiungi", "Hinzufügen", "Add"],
  "common.cancel": ["Annulla", "Abbrechen", "Cancel"],
  "common.close": ["Chiudi", "Schließen", "Close"],
  "common.save": ["Salva", "Speichern", "Save"],
  "common.saving": ["Salvataggio…", "Wird gespeichert…", "Saving…"],
  "common.loading": ["Caricamento…", "Wird geladen…", "Loading…"],
  "common.notSpecified": ["Non specificato", "Nicht angegeben", "Not specified"],
  "common.brand": ["Marchio", "Marke", "Brand"],
  "common.color": ["Colore", "Farbe", "Colour"],
  "common.fit": ["Vestibilità", "Passform", "Fit"],
  "common.availability": ["Disponibilità", "Verfügbarkeit", "Availability"],
  "common.photo": ["Foto", "Foto", "Photo"],
  "common.notes": ["Note", "Notizen", "Notes"],
  "nav.today": ["Oggi", "Heute", "Today"],
  "nav.wardrobe": ["Guardaroba", "Kleiderschrank", "Wardrobe"],
  "nav.outfits": ["Outfit", "Outfits", "Outfits"],
  "nav.avatar": ["Il mio avatar", "Mein Avatar", "My avatar"],
  "nav.workspace": ["Menu", "Menü", "Workspace"],
  "nav.tagline1": ["Il tuo guardaroba,", "Dein Kleiderschrank,", "Your wardrobe,"],
  "nav.tagline2": ["reinventato.", "neu gedacht.", "reimagined."],
  "nav.tagline3": ["Più stile, ogni giorno.", "Jeden Tag ein bisschen mehr Stil.", "A little more style, every day."],
  "ticker.story": ["INDOSSA LA TUA STORIA", "TRAG DEINE GESCHICHTE", "WEAR YOUR STORY"],
  "ticker.ready": ["PRONTO PER LA STRADA", "BEREIT FÜR DIE STRASSE", "STREET READY"],
  "ticker.party": ["NESSUN OUTFIT, NESSUNA FESTA", "KEIN OUTFIT, KEINE PARTY", "NO OUTFIT NO PARTY"],
  "ticker.drop": ["MOSTRA IL TUO LOOK", "ZEIG DEINEN LOOK", "DROP YOUR LOOK"],
  "ticker.volt": ["RIMANI VOLT", "BLEIB VOLT", "STAY VOLT"],

  "dashboard.title": ["Il tuo stile, ogni giorno.", "Dein Stil, jeden Tag.", "Your style, every day."],
  "dashboard.eyebrow": ["Streetwear · Il tuo guardaroba", "Streetwear · Dein Kleiderschrank", "Streetwear · Your wardrobe"],
  "dashboard.addGarment": ["Aggiungi capo", "Teil hinzufügen", "Add garment"],
  "dashboard.lookToday": ["LOOK DI OGGI", "LOOK DES TAGES", "TODAY'S LOOK"],
  "dashboard.heroTitleFirst": ["Vestiti.", "Zieh dich an.", "Get dressed."],
  "dashboard.heroTitleSecond": ["Esprimi chi sei.", "Zeig, wer du bist.", "Be yourself."],
  "dashboard.description": ["Il tuo guardaroba, una nuova combinazione ogni giorno. FITDAY crea look usando i capi che hai davvero.", "Dein Kleiderschrank, jeden Tag neu kombiniert. FITDAY kreiert Looks aus deinen eigenen Teilen.", "Your wardrobe, a new combination every day. FITDAY creates looks from pieces you actually own."],
  "dashboard.generate": ["Crea il tuo fit", "Erstelle deinen Fit", "Build your fit"],
  "dashboard.generating": ["Creo il look…", "Look wird erstellt…", "Creating your look…"],
  "dashboard.details": ["Apri il look", "Look ansehen", "View the look"],
  "dashboard.loginMessage": ["Accedi per caricare il tuo guardaroba.", "Melde dich an, um deinen Kleiderschrank zu laden.", "Sign in to load your wardrobe."],
  "dashboard.supabaseMessage": ["Collega Supabase per attivare il salvataggio cloud.", "Verbinde Supabase, um die Cloud-Speicherung zu aktivieren.", "Connect Supabase to enable cloud saving."],
  "dashboard.backendError": ["Server non raggiungibile. Avvialo e riprova.", "Server nicht erreichbar. Starte ihn und versuche es erneut.", "Server unreachable. Start it and try again."],
  "dashboard.generateError": ["Impossibile creare il look.", "Look konnte nicht erstellt werden.", "Could not create the look."],
  "dashboard.unexpectedError": ["Errore imprevisto.", "Unerwarteter Fehler.", "Unexpected error."],
  "dashboard.missing": ["Nel guardaroba mancano: {items}.", "Im Kleiderschrank fehlen: {items}.", "Missing from your wardrobe: {items}."],
  "missing.top": ["maglietta o felpa", "T-Shirt oder Sweatshirt", "top or sweatshirt"],
  "missing.bottom": ["pantaloni", "Hose", "trousers"],
  "missing.socks": ["calzini", "Socken", "socks"],
  "missing.shoes": ["scarpe", "Schuhe", "shoes"],
  "dashboard.updated": ["Look aggiornato!", "Look aktualisiert!", "Look updated!"],
  "dashboard.total": ["Capi totali", "Teile insgesamt", "Total pieces"],
  "dashboard.inWardrobe": ["Nel guardaroba", "Im Kleiderschrank", "In your wardrobe"],
  "dashboard.ready": ["Pronti da indossare", "Bereit zum Anziehen", "Ready to wear"],
  "dashboard.clean": ["Capi puliti", "Saubere Teile", "Clean pieces"],
  "dashboard.laundry": ["In lavanderia", "In der Wäsche", "In laundry"],
  "dashboard.unavailable": ["Non disponibili", "Nicht verfügbar", "Unavailable"],
  "dashboard.recent": ["Ultimi arrivi", "Neu hinzugefügt", "Recently added"],
  "dashboard.recentNote": ["I capi aggiunti di recente", "Zuletzt hinzugefügte Teile", "Your latest additions"],
  "dashboard.seeAll": ["Vedi tutto", "Alle ansehen", "See all"],
  "dashboard.loadingWardrobe": ["Caricamento guardaroba…", "Kleiderschrank wird geladen…", "Loading wardrobe…"],
  "dashboard.emptyTitle": ["Il guardaroba ti aspetta", "Dein Kleiderschrank wartet", "Your wardrobe is waiting"],
  "dashboard.emptyText": ["Aggiungi il tuo primo capo e crea nuovi look.", "Füge dein erstes Teil hinzu und kreiere neue Looks.", "Add your first piece and start creating looks."],
  "dashboard.addFirst": ["Aggiungi il primo capo", "Erstes Teil hinzufügen", "Add your first piece"],
  "dashboard.routine": ["La tua routine", "Deine Routine", "Your daily rhythm"],
  "dashboard.routineNote": ["Piccole mosse, più stile", "Kleine Schritte, mehr Stil", "Small habits, better style"],
  "dashboard.freshLook": ["Crea un nuovo fit", "Neuen Fit erstellen", "Create a fresh look"],
  "dashboard.fromClean": ["Un look con i capi puliti", "Ein Look aus sauberen Teilen", "A look made from clean pieces"],
  "dashboard.laundryCheck": ["Check lavanderia", "Wäsche-Check", "Laundry check"],
  "dashboard.availability": ["Aggiorna la disponibilità", "Halte die Verfügbarkeit aktuell", "Keep availability up to date"],
  "dashboard.completeWardrobe": ["Completa il guardaroba", "Ergänze deinen Kleiderschrank", "Complete your wardrobe"],
  "dashboard.addMostWorn": ["Aggiungi i capi che usi di più", "Füge deine meistgetragenen Teile hinzu", "Add the pieces you wear most"],
  "dashboard.lab": ["FITDAY lab", "FITDAY Lab", "FITDAY lab"],
  "dashboard.labNote": ["Come nascono i tuoi fit", "So entstehen deine Fits", "What powers your recommendations"],
  "dashboard.labDescription": ["I consigli partono dai tuoi capi puliti. Preferenze, colori e meteo renderanno i prossimi look ancora più personali.", "Unsere Empfehlungen starten mit deinen sauberen Teilen. Vorlieben, Farben und Wetter machen deine nächsten Looks noch persönlicher.", "Recommendations start with your clean pieces. Preferences, colours and weather will make your next looks even more personal."],
  "dashboard.cleanAvailable": ["Capi puliti disponibili", "Saubere Teile verfügbar", "Clean garments available"],
  "dashboard.saveAcrossDevices": ["Il tuo guardaroba, ovunque", "Dein Kleiderschrank überall", "Your wardrobe, across devices"],
  "dashboard.syncPrompt": ["Accedi per sincronizzare il guardaroba sui tuoi dispositivi.", "Melde dich an, um deinen Kleiderschrank auf deinen Geräten zu synchronisieren.", "Sign in to sync your wardrobe across devices."],
  "dashboard.signIn": ["Accedi", "Anmelden", "Sign in"],

  "category.all": ["Tutti i capi", "Alle Teile", "All pieces"],
  "category.tshirt": ["T-shirt", "T-Shirts", "T-shirts"],
  "category.hoodie": ["Felpe con cappuccio", "Hoodies", "Hoodies"],
  "category.crewneck": ["Felpe girocollo", "Sweatshirts", "Crewnecks"],
  "category.jeans": ["Jeans", "Jeans", "Jeans"],
  "category.trousers": ["Pantaloni", "Hosen", "Trousers"],
  "category.socks": ["Calzini", "Socken", "Socks"],
  "category.shoes": ["Scarpe", "Schuhe", "Shoes"],
  "category.other": ["Altro", "Sonstiges", "Other"],
  "status.clean": ["Pulito", "Sauber", "Clean"],
  "status.dirty": ["Da lavare", "Zu waschen", "To wash"],
  "status.washing": ["In lavatrice", "Wird gewaschen", "Washing"],
  "status.drying": ["In asciugatura", "Wird getrocknet", "Drying"],
  "fit.unknown": ["Non specificata", "Nicht angegeben", "Not specified"],
  "fit.slim": ["Aderente", "Slim Fit", "Slim"],
  "fit.regular": ["Regolare", "Regular Fit", "Regular"],
  "fit.relaxed": ["Comoda", "Relaxed Fit", "Relaxed"],
  "fit.oversized": ["Oversize", "Oversized", "Oversized"],
  "fit.wide": ["Ampia", "Wide Fit", "Wide"],

  "wardrobe.title": ["Il tuo guardaroba", "Dein Kleiderschrank", "Your wardrobe"],
  "wardrobe.eyebrow": ["Tutti i tuoi capi, sempre con te", "Alle deine Teile immer dabei", "Every piece, all in one place"],
  "wardrobe.add": ["Aggiungi capo", "Teil hinzufügen", "Add garment"],
  "wardrobe.signInTitle": ["Accedi per aprire il guardaroba", "Melde dich an, um deinen Kleiderschrank zu öffnen", "Sign in to open your wardrobe"],
  "wardrobe.privateMessage": ["I tuoi capi sono salvati in modo privato nel tuo account.", "Deine Teile werden sicher in deinem Konto gespeichert.", "Your pieces are stored privately in your account."],
  "wardrobe.allPieces": ["Tutti i capi", "Alle Teile", "All pieces"],
  "wardrobe.ready": ["Pronti da indossare", "Bereit zum Anziehen", "Ready to wear"],
  "wardrobe.laundry": ["In lavanderia", "In der Wäsche", "In laundry"],
  "wardrobe.pieces": ["I tuoi capi", "Deine Teile", "Your pieces"],
  "wardrobe.filterNote": ["Filtra per categoria o cerca per nome, marchio e colore.", "Filtere nach Kategorie oder suche nach Name, Marke und Farbe.", "Filter by category or search by name, brand and colour."],
  "wardrobe.search": ["Cerca nel guardaroba", "Kleiderschrank durchsuchen", "Search wardrobe"],
  "wardrobe.loading": ["Caricamento dei capi…", "Teile werden geladen…", "Loading your pieces…"],
  "wardrobe.noResults": ["Nessun capo trovato", "Keine Teile gefunden", "No pieces found"],
  "wardrobe.noResultsText": ["Aggiungi un capo o modifica i filtri.", "Füge ein Teil hinzu oder ändere die Filter.", "Add a garment or change the filters."],
  "wardrobe.delete": ["Elimina capo", "Teil löschen", "Delete garment"],
  "wardrobe.statusFor": ["Stato di {name}", "Status von {name}", "Laundry status for {name}"],
  "wardrobe.confirmDelete": ["Vuoi eliminare {name}?", "{name} wirklich löschen?", "Delete {name}?"],
  "wardrobe.entry": ["NUOVO CAPO", "NEUES TEIL", "WARDROBE ENTRY"],
  "wardrobe.addNew": ["Aggiungi un nuovo capo", "Neues Teil hinzufügen", "Add a new piece"],
  "wardrobe.garmentName": ["Nome del capo *", "Name des Kleidungsstücks *", "Garment name *"],
  "wardrobe.exampleTee": ["Es. T-shirt oversize", "z. B. Oversize-T-Shirt", "e.g. Boxy cotton tee"],
  "wardrobe.colorSwatch": ["Campione colore", "Farbfeld", "Colour swatch"],
  "wardrobe.photoHint": ["Massimo 10 MB", "Maximal 10 MB", "Max 10 MB"],
  "wardrobe.photoPrivate": ["Le foto sono private e archiviate nel tuo guardaroba Supabase.", "Fotos sind privat und in deinem Supabase-Kleiderschrank gespeichert.", "Photos are private and stored in your Supabase wardrobe."],
  "wardrobe.materialHint": ["Materiale, stagione, note per il lavaggio…", "Material, Saison, Pflegehinweise…", "Material, season, care notes…"],
  "wardrobe.save": ["Salva capo", "Teil speichern", "Save garment"],
  "wardrobe.saving": ["Salvataggio…", "Wird gespeichert…", "Saving…"],
  "wardrobe.loadError": ["Impossibile caricare il guardaroba.", "Kleiderschrank konnte nicht geladen werden.", "Unable to load wardrobe."],
  "wardrobe.saveError": ["Impossibile salvare il capo.", "Teil konnte nicht gespeichert werden.", "Unable to save garment."],
  "wardrobe.updateError": ["Impossibile aggiornare lo stato.", "Status konnte nicht aktualisiert werden.", "Unable to update status."],
  "wardrobe.deleteError": ["Impossibile eliminare il capo.", "Teil konnte nicht gelöscht werden.", "Unable to delete garment."],
  "wardrobe.unexpectedError": ["Errore imprevisto.", "Unerwarteter Fehler.", "Unexpected error."],
  "wardrobe.signInPhoto": ["Accedi prima di caricare una foto.", "Melde dich an, bevor du ein Foto hochlädst.", "Sign in before uploading a photo."],
  "wardrobe.imageOnly": ["Seleziona un file immagine.", "Wähle eine Bilddatei aus.", "Select an image file."],
  "wardrobe.imageSize": ["L'immagine deve essere inferiore a 10 MB.", "Das Bild muss kleiner als 10 MB sein.", "The image must be smaller than 10 MB."],
  "wardrobe.added": ["Capo aggiunto!", "Teil hinzugefügt!", "Garment added!"],
  "wardrobe.unknownError": ["Errore imprevisto (stato {status}).", "Unerwarteter Fehler (Status {status}).", "Unexpected error (status {status})."],
  "wardrobe.loadErrorStatus": ["Errore nel caricamento (stato {status}).", "Fehler beim Laden (Status {status}).", "Loading error (status {status})."],
  "wardrobe.addNote": ["Compila i campi per inserirlo nel guardaroba", "Fülle die Felder aus, um es hinzuzufügen", "Fill in the details to add it to your wardrobe"],
  "wardrobe.category": ["Categoria", "Kategorie", "Category"],
  "wardrobe.brandOptional": ["Marchio (facoltativo)", "Marke (optional)", "Brand (optional)"],
  "wardrobe.brandExample": ["Es. Uniqlo", "z. B. Uniqlo", "e.g. Uniqlo"],
  "wardrobe.colorExample": ["Es. blu navy", "z. B. Marineblau", "e.g. navy"],
  "wardrobe.colorHex": ["Codice HEX", "HEX-Farbcode", "HEX colour code"],
  "wardrobe.adding": ["Aggiunta in corso…", "Wird hinzugefügt…", "Adding…"],
  "wardrobe.count": ["{count} capi nel guardaroba", "{count} Teile im Kleiderschrank", "{count} pieces in your wardrobe"],
  "wardrobe.emptyTitle": ["Nessun capo presente", "Noch keine Teile vorhanden", "No pieces yet"],
  "wardrobe.emptyText": ["Aggiungi il tuo primo capo per iniziare.", "Füge dein erstes Teil hinzu, um loszulegen.", "Add your first piece to get started."],

  "outfits.title": ["Diario dei look", "Outfit-Tagebuch", "Outfit diary"],
  "outfits.eyebrow": ["I tuoi look, giorno dopo giorno", "Deine Looks, Tag für Tag", "Your looks, day by day"],
  "outfits.generate": ["Crea il look di oggi", "Heutigen Look erstellen", "Generate today's look"],
  "outfits.generating": ["Creazione…", "Wird erstellt…", "Generating…"],
  "outfits.loadError": ["Impossibile caricare il look.", "Look konnte nicht geladen werden.", "Could not load outfit."],
  "outfits.generateError": ["Impossibile creare il look.", "Look konnte nicht erstellt werden.", "Could not generate outfit."],
  "outfits.missing": ["Mancano: {items}", "Es fehlen: {items}", "Missing: {items}"],
  "outfits.ready": ["Il look di oggi è pronto.", "Dein Look für heute ist fertig.", "Today's outfit is ready."],
  "outfits.todayFirst": ["Il look", "Dein Look", "Today's"],
  "outfits.todaySecond": ["di oggi.", "für heute.", "combination."],
  "outfits.description": ["Crea un look usando i capi puliti e disponibili nel tuo guardaroba.", "Erstelle einen Look aus den sauberen, verfügbaren Teilen in deinem Kleiderschrank.", "Create a look from the clean pieces currently available in your wardrobe."],
  "outfits.regenerate": ["Rigenera il look", "Look neu erstellen", "Regenerate outfit"],
  "outfits.pieces": ["I capi del look", "Teile im Look", "The pieces"],
  "outfits.piecesNote": ["Per creare un look vengono usati solo i capi puliti.", "Für die Look-Erstellung werden nur saubere Teile verwendet.", "Only clean garments are eligible for outfit generation."],
  "outfits.loading": ["Caricamento del look…", "Look wird geladen…", "Loading outfit…"],
  "outfits.emptyTitle": ["Ancora nessun look", "Noch kein Outfit", "No outfit yet"],
  "outfits.emptyText": ["Aggiungi alcuni capi puliti e crea il tuo primo look.", "Füge ein paar saubere Teile hinzu und erstelle deinen ersten Look.", "Add a few clean garments, then create your first look."],
  "outfits.openWardrobe": ["Apri il guardaroba", "Kleiderschrank öffnen", "Open wardrobe"],

  "avatar.title": ["Il tuo avatar digitale", "Dein digitaler Avatar", "Your digital twin"],
  "avatar.eyebrow": ["Studio avatar", "Avatar-Studio", "Avatar studio"],
  "avatar.preview": ["ANTEPRIMA 3D", "3D-VORSCHAU", "3D PREVIEW"],
  "avatar.drag": ["Trascina per ruotare", "Zum Drehen ziehen", "Drag to rotate"],
  "avatar.disclaimer": ["Avatar 3D dimostrativo · il modello personale verrà configurato nei prossimi aggiornamenti", "3D-Demo-Avatar · dein persönliches Modell folgt in einem nächsten Update", "Demo 3D avatar · your personal model will be configured in a future update"],
  "avatar.outfitPreview": ["Anteprima outfit", "Outfit-Vorschau", "Outfit preview"],
  "avatar.colourDirection": ["Prova una palette", "Probiere eine Farbpalette", "Try a colour direction"],
  "avatar.selected": ["Selezionata", "Ausgewählt", "Selected"],
  "avatar.previewLabel": ["Anteprima", "Vorschau", "Preview"],
  "avatar.profile": ["Profilo corpo", "Körperprofil", "Your body profile"],
  "avatar.nextMilestone": ["Opzioni di personalizzazione · prossimi sviluppi", "Personalisierung · nächste Ausbaustufe", "Personalisation options — next milestone"],
  "avatar.bodyDescription": ["Per una vestibilità credibile servirà un avatar configurabile. Questa versione include un manichino 3D dimostrativo, con rotazione e cambio colore dei capi.", "Für eine realistische Passform braucht es einen anpassbaren Avatar. Diese Version enthält eine 3D-Demofigur mit Drehung und veränderbaren Kleidungsfarben.", "A convincing fit requires a configurable avatar. This version includes a demo 3D mannequin with rotation and garment colour changes."],
  "avatar.model": ["Modello avatar", "Avatar-Modell", "Avatar model"],
  "avatar.demoMannequin": ["Manichino dimostrativo", "Demo-Schaufensterpuppe", "Demo mannequin"],
  "avatar.asset": ["Modello 3D", "3D-Modell", "3D asset"],
  "avatar.planned": ["In programma", "Geplant", "Planned"],
  "avatar.fitting": ["Vestibilità capi", "Kleidungsanpassung", "Garment fitting"],
  "avatar.phaseTwo": ["Fase 2", "Phase 2", "Phase 2"],
  "avatar.openWardrobe": ["Apri il guardaroba", "Kleiderschrank öffnen", "Open wardrobe"],
  "avatar.previewOnly": ["Anteprima locale: accedi per sincronizzare l'avatar.", "Lokale Vorschau: Melde dich an, um deinen Avatar zu synchronisieren.", "Local preview — sign in to sync your avatar."],
  "avatar.synced": ["Preferenze avatar sincronizzate con il tuo account.", "Avatar-Einstellungen mit deinem Konto synchronisiert.", "Avatar preferences synced to your account."],
  "avatar.saving": ["Salvataggio preferenza…", "Einstellung wird gespeichert…", "Saving preference…"],
  "avatar.saved": ["Preferenza salvata nel profilo.", "Einstellung im Profil gespeichert.", "Preference saved to your profile."],
  "avatar.syncError": ["Impossibile sincronizzare questa preferenza.", "Einstellung konnte nicht synchronisiert werden.", "Could not sync this preference yet."],
  "avatar.offline": ["Anteprima offline: preferenza non sincronizzata.", "Offline-Vorschau: Einstellung nicht synchronisiert.", "Offline preview — preference not synced."],
  "avatar.sage": ["Salvia", "Salbei", "Sage"],
  "avatar.monochrome": ["Monocromatica", "Monochrom", "Monochrome"],
  "avatar.warmEarth": ["Terra calda", "Warme Erdtöne", "Warm earth"],
  "avatar.blueHour": ["Ora blu", "Blaue Stunde", "Blue hour"],

  "login.back": ["Torna a FITDAY", "Zurück zu FITDAY", "Back to FITDAY"],
  "login.eyebrow": ["IL TUO GUARDAROBA DIGITALE", "DEIN DIGITALER KLEIDERSCHRANK", "YOUR DIGITAL WARDROBE"],
  "login.welcome": ["Bentornato.", "Willkommen zurück.", "Welcome back."],
  "login.personal": ["Rendilo personale.", "Mach es persönlich.", "Make it personal."],
  "login.signInDescription": ["Accedi per ritrovare i tuoi capi e il tuo stile.", "Melde dich an und finde deine Teile und deinen Stil wieder.", "Sign in to find your pieces and your style."],
  "login.signUpDescription": ["Crea il tuo account e inizia a costruire il guardaroba digitale.", "Erstelle dein Konto und beginne mit deinem digitalen Kleiderschrank.", "Create your account and start building your digital wardrobe."],
  "login.name": ["Nome", "Name", "Name"],
  "login.namePlaceholder": ["Il tuo nome", "Dein Name", "Your name"],
  "login.email": ["Email", "E-Mail", "Email"],
  "login.password": ["Password", "Passwort", "Password"],
  "login.passwordHint": ["Almeno 8 caratteri", "Mindestens 8 Zeichen", "At least 8 characters"],
  "login.wait": ["Attendi…", "Bitte warten…", "Please wait…"],
  "login.signIn": ["Accedi", "Anmelden", "Sign in"],
  "login.signUp": ["Crea account", "Konto erstellen", "Create account"],
  "login.newHere": ["È la prima volta su FITDAY?", "Neu bei FITDAY?", "New to FITDAY?"],
  "login.haveAccount": ["Hai già un account?", "Du hast bereits ein Konto?", "Already have an account?"],
  "login.createAccount": ["Crea un account", "Konto erstellen", "Create an account"],
  "login.confirmEmail": ["Account creato. Controlla la tua email per confermare l'indirizzo e poi accedi.", "Konto erstellt. Bestätige deine E-Mail-Adresse und melde dich danach an.", "Account created. Check your email to confirm your address, then sign in."],
  "login.authError": ["Autenticazione non riuscita.", "Anmeldung fehlgeschlagen.", "Authentication failed."],
  "login.invalidCredentials": ["Email o password non corretti.", "E-Mail oder Passwort ist falsch.", "Email or password is incorrect."],
  "login.alreadyRegistered": ["Questa email è già registrata. Accedi al tuo account.", "Diese E-Mail ist bereits registriert. Melde dich an.", "This email is already registered. Sign in to your account."],
  "login.emailNotConfirmed": ["Conferma la tua email prima di accedere.", "Bestätige deine E-Mail, bevor du dich anmeldest.", "Confirm your email before signing in."],

  "api.unauthorized": ["Accesso non autorizzato.", "Nicht autorisierter Zugriff.", "Unauthorized access."],
  "api.signInRequired": ["Accedi per continuare.", "Melde dich an, um fortzufahren.", "Sign in to continue."],
  "api.notConfigured": ["Supabase non è configurato.", "Supabase ist nicht konfiguriert.", "Supabase is not configured."],
  "api.invalidJson": ["Richiesta JSON non valida.", "Ungültige JSON-Anfrage.", "Invalid JSON request."],
  "api.invalidGarment": ["Dati del capo non validi.", "Ungültige Kleidungsdaten.", "Invalid garment data."],
  "api.invalidRequest": ["Richiesta non valida.", "Ungültige Anfrage.", "Invalid request."],
  "api.requiredFields": ["Nome, categoria e colore sono obbligatori.", "Name, Kategorie und Farbe sind erforderlich.", "Name, category and colour are required."],
  "api.insufficientGarments": ["Non ci sono abbastanza capi puliti per creare un look.", "Es gibt nicht genügend saubere Teile für einen Look.", "There aren't enough clean pieces to create a look."],
  "api.serverError": ["Errore interno del server. Riprova più tardi.", "Interner Serverfehler. Bitte versuche es später erneut.", "Internal server error. Please try again later."],
  "api.databaseError": ["Errore del database", "Datenbankfehler", "Database error"],
} satisfies Record<string, Message>;

export type TranslationKey = keyof typeof messages;
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: Translate };

const LanguageContext = createContext<LanguageContextValue | null>(null);
const languageIndex: Record<Language, number> = { it: 0, de: 1, en: 2 };

function isLanguage(value: string | null): value is Language {
  return value === "it" || value === "de" || value === "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("it");

  useEffect(() => {
    const saved = window.localStorage.getItem("fitday-language");
    if (isLanguage(saved)) setLanguageState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === "it"
      ? "FITDAY — Il tuo guardaroba digitale"
      : language === "de"
        ? "FITDAY — Dein digitaler Kleiderschrank"
        : "FITDAY — Your digital wardrobe";
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = language === "it"
        ? "Il tuo guardaroba digitale e il tuo personal stylist AI."
        : language === "de"
          ? "Dein digitaler Kleiderschrank und dein persönlicher KI-Stylist."
          : "Your digital wardrobe and personal AI stylist.";
    }
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    window.localStorage.setItem("fitday-language", next);
    setLanguageState(next);
  }, []);
  const t = useCallback<Translate>((key, values) => {
    let value = messages[key][languageIndex[language]];
    for (const [name, replacement] of Object.entries(values ?? {})) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
    return value;
  }, [language]);
  const context = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={context}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used within LanguageProvider.");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className="language-switcher">
      <span className="sr-only">{t("common.language")}</span>
      <select aria-label={t("common.language")} value={language} onChange={(event) => {
        const next = event.target.value;
        if (isLanguage(next)) setLanguage(next);
      }}>
        <option value="it">IT · Italiano</option>
        <option value="de">DE · Deutsch</option>
        <option value="en">EN · English</option>
      </select>
    </label>
  );
}

export function categoryTranslationKey(category: string): TranslationKey {
  const keys: Record<string, TranslationKey> = {
    all: "category.all",
    tshirt: "category.tshirt",
    hoodie: "category.hoodie",
    crewneck: "category.crewneck",
    jeans: "category.jeans",
    trousers: "category.trousers",
    socks: "category.socks",
    shoes: "category.shoes",
    other: "category.other",
  };
  return keys[category] ?? "category.other";
}

export function fitTranslationKey(fit: string): TranslationKey {
  const keys: Record<string, TranslationKey> = {
    unknown: "fit.unknown",
    slim: "fit.slim",
    regular: "fit.regular",
    relaxed: "fit.relaxed",
    oversized: "fit.oversized",
    wide: "fit.wide",
  };
  return keys[fit] ?? "fit.unknown";
}

export function statusTranslationKey(status: string): TranslationKey {
  const keys: Record<string, TranslationKey> = {
    clean: "status.clean",
    dirty: "status.dirty",
    washing: "status.washing",
    drying: "status.drying",
  };
  return keys[status] ?? "status.clean";
}

export function localizeApiMessage(message: string, t: Translate) {
  const knownMessages: Record<string, TranslationKey> = {
    "Non autorizzato.": "api.unauthorized",
    "Non autorizzato. Fai il login.": "api.signInRequired",
    "Accedi per generare il tuo outfit.": "api.signInRequired",
    "Supabase non è configurato.": "api.notConfigured",
    "JSON non valido.": "api.invalidJson",
    "Body della richiesta non valido.": "api.invalidJson",
    "Dati del capo non validi.": "api.invalidGarment",
    "Configurazione avatar non valida.": "api.invalidRequest",
    "Richiesta non valida.": "api.invalidRequest",
    "Nome, categoria e colore sono obbligatori.": "api.requiredFields",
    "Errore interno del server. Controlla il terminale.": "api.serverError",
    "Non hai ancora abbastanza capi puliti per creare un outfit.": "api.insufficientGarments",
    "Invalid login credentials": "login.invalidCredentials",
    "User already registered": "login.alreadyRegistered",
    "Email not confirmed": "login.emailNotConfirmed",
  };
  const key = knownMessages[message];
  if (key) return t(key);
  if (message.startsWith("Database: ")) return `${t("api.databaseError")}: ${message.slice("Database: ".length)}`;
  return message;
}

export function localizeMissingItems(items: string[], t: Translate) {
  const keys: Record<string, TranslationKey> = {
    "maglietta o felpa": "missing.top",
    pantaloni: "missing.bottom",
    calzini: "missing.socks",
    scarpe: "missing.shoes",
  };
  return items.map((item) => keys[item] ? t(keys[item]) : item).join(", ");
}
