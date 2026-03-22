// ─── SalesTrack Demo Data ──────────────────────────
export type ClientType = "lead" | "strategic" | "regular" | "inactive"
export type InactivityFlag = "amber" | "red" | null
export type InteractionType = "call" | "meeting" | "email" | "note" | "task"
export type InteractionStatus = "todo" | "done"
export type InteractionPriority = "low" | "medium" | "high"
export type CampaignType = "email_blast" | "event" | "cold_outreach" | "linkedin" | "trade_show" | "webinar"
export type CampaignStatus = "draft" | "active" | "completed"
export type SystemFlag = "in_progress" | "won" | "lost" | "on_hold"

export interface DemoInteraction {
  id: string
  type: InteractionType
  title: string
  clientId: string
  opportunityId: string | null
  assignedTo: string
  createdBy: string
  scheduledAt: string
  completedAt: string | null
  priority: InteractionPriority
  status: InteractionStatus
  description: string
  emailTo: string | null
  emailSubject: string | null
  campaignId: string | null
}

export interface DemoClient {
  id: string
  name: string
  type: ClientType
  industry: string
  city: string
  country: string
  assignedTo: string
  leadScore: number
  isActive: boolean
  website: string
  phone: string
  notes: string
}

export interface DemoOpportunity {
  id: string
  name: string
  clientId: string
  stageId: string
  ownerId: string
  value: number
  probability: number
  expectedClose: string
  lastActivity: string
  inactivityFlag: InactivityFlag
  notes: string
}
export const demoPipelineStages = [
  { id: "stage-001", name: "Kwalifikacja", order: 1, systemFlag: "in_progress" as SystemFlag, color: "#6366f1", probability: 20, isActive: true },
  { id: "stage-002", name: "Propozycja",   order: 2, systemFlag: "in_progress" as SystemFlag, color: "#3b82f6", probability: 40, isActive: true },
  { id: "stage-003", name: "Negocjacje",   order: 3, systemFlag: "in_progress" as SystemFlag, color: "#f59e0b", probability: 70, isActive: true },
  { id: "stage-004", name: "Wygrany",      order: 4, systemFlag: "won"         as SystemFlag, color: "#10b981", probability: 100, isActive: true },
  { id: "stage-005", name: "Przegrany",    order: 5, systemFlag: "lost"        as SystemFlag, color: "#ef4444", probability: 0,   isActive: true },
]
export const demoCloseReasons = [
  { id: "cr-001", name: "Najlepsza oferta cenowa", type: "won" as const, isActive: true },
  { id: "cr-002", name: "Relacja i zaufanie",      type: "won" as const, isActive: true },
  { id: "cr-003", name: "Szybka realizacja",       type: "won" as const, isActive: true },
  { id: "cr-004", name: "Brak budżetu",            type: "lost" as const, isActive: true },
  { id: "cr-005", name: "Wybrał konkurencję",      type: "lost" as const, isActive: true },
  { id: "cr-006", name: "Projekt odłożony",        type: "lost" as const, isActive: true },
  { id: "cr-007", name: "Brak decyzji",            type: "lost" as const, isActive: true },
]
export const demoProducts = [
  { id: "prod-001", name: "RequestFlow – Licencja roczna", sku: "RF-LIC-01", category: "Licencja", price: 9600,  currency: "PLN", isActive: true, description: "Roczna licencja modułu RequestFlow dla do 50 użytkowników." },
  { id: "prod-002", name: "SalesTrack – Licencja roczna",  sku: "ST-LIC-01", category: "Licencja", price: 12000, currency: "PLN", isActive: true, description: "Roczna licencja modułu SalesTrack dla do 20 handlowców." },
  { id: "prod-003", name: "ProjectHub – Licencja roczna",  sku: "PH-LIC-01", category: "Licencja", price: 8400,  currency: "PLN", isActive: true, description: "Roczna licencja modułu ProjectHub." },
  { id: "prod-004", name: "SMB 360 – Pakiet Enterprise",   sku: "SMB-ENT-01", category: "Pakiet",  price: 48000, currency: "PLN", isActive: true, description: "Pełna platforma SMB 360 dla do 100 użytkowników." },
  { id: "prod-005", name: "Wdrożenie i migracja danych",   sku: "SVC-IMP-01", category: "Usługa",  price: 15000, currency: "PLN", isActive: true, description: "Jednorazowa usługa wdrożenia i migracji danych." },
  { id: "prod-006", name: "Support Premium (12 mies.)",    sku: "SVC-SUP-01", category: "Usługa",  price: 7200,  currency: "PLN", isActive: true, description: "Priorytetowy support techniczny na 12 miesięcy." },
]
export const demoEmailTemplates = [
  { id: "et-001", name: "Powitanie nowego leada",   subject: "Witamy w SMB 360 — {{company_name}}", body: "Dzień dobry {{contact_name}},\n\nDziękujemy za zainteresowanie platformą SMB 360. Chętnie umówimy bezpłatną prezentację.\n\nZ poważaniem,\n{{sender_name}}", isShared: true,  createdBy: "u1" },
  { id: "et-002", name: "Follow-up po spotkaniu",   subject: "Podsumowanie spotkania — {{date}}",    body: "Dzień dobry {{contact_name}},\n\nDziękuję za dzisiejsze spotkanie. W załączniku przesyłam omawianą ofertę.\n\nZ poważaniem,\n{{sender_name}}", isShared: true,  createdBy: "u1" },
  { id: "et-003", name: "Przypomnienie o ofercie",  subject: "Oferta wciąż aktualna — {{opportunity_name}}", body: "Dzień dobry {{contact_name}},\n\nChciałem przypomnieć, że nasza oferta pozostaje aktualna.\n\nZ poważaniem,\n{{sender_name}}", isShared: false, createdBy: "u2" },
]
export const demoInactivityThresholds = { amberDays: 14, redDays: 21 }
export const demoClients: DemoClient[] = [
  { id: "cl-001", name: "TechCorp Sp. z o.o.", type: "strategic" as ClientType, industry: "IT",           city: "Warszawa",  country: "PL", assignedTo: "u1", leadScore: 5, isActive: true,  website: "techcorp.pl",   phone: "+48 22 000 0001", notes: "Klient kluczowy — pełne wdrożenie SMB 360." },
  { id: "cl-002", name: "Retail Plus S.A.",    type: "regular"   as ClientType, industry: "Retail",       city: "Kraków",    country: "PL", assignedTo: "u2", leadScore: 3, isActive: true,  website: "retailplus.pl", phone: "+48 12 000 0002", notes: "Stały klient — licencja roczna." },
  { id: "cl-003", name: "BuildCo Sp. z o.o.",  type: "lead"      as ClientType, industry: "Budownictwo",  city: "Wrocław",   country: "PL", assignedTo: "u1", leadScore: 2, isActive: true,  website: "buildco.pl",    phone: "+48 71 000 0003", notes: "Zainteresowany modułem RequestFlow." },
  { id: "cl-004", name: "MedGroup S.A.",        type: "strategic" as ClientType, industry: "Healthcare",   city: "Gdańsk",    country: "PL", assignedTo: "u3", leadScore: 4, isActive: true,  website: "medgroup.pl",   phone: "+48 58 000 0004", notes: "Planuje wdrożenie modułu HR." },
  { id: "cl-005", name: "LogiFlow Sp. z o.o.",  type: "regular"   as ClientType, industry: "Logistyka",    city: "Łódź",      country: "PL", assignedTo: "u2", leadScore: 3, isActive: true,  website: "logiflow.pl",   phone: "+48 42 000 0005", notes: "Rozszerza licencję." },
  { id: "cl-006", name: "EduSoft S.A.",         type: "lead"      as ClientType, industry: "Edukacja",     city: "Poznań",    country: "PL", assignedTo: "u1", leadScore: 1, isActive: true,  website: "edusoft.pl",    phone: "+48 61 000 0006", notes: "Pilot — szkolenia online." },
  { id: "cl-007", name: "FinServ Sp. z o.o.",   type: "inactive"  as ClientType, industry: "Finanse",      city: "Warszawa",  country: "PL", assignedTo: "u3", leadScore: 2, isActive: false, website: "finserv.pl",    phone: "+48 22 000 0007", notes: "Zawiesił współpracę." },
  { id: "cl-008", name: "AutoDealer S.A.",      type: "regular"   as ClientType, industry: "Motoryzacja",  city: "Katowice",  country: "PL", assignedTo: "u2", leadScore: 3, isActive: true,  website: "autodealer.pl", phone: "+48 32 000 0008", notes: "Zainteresowany modułem BookIt." },
]
export const demoClientContacts = [
  { id: "cc-001", clientId: "cl-001", firstName: "Marek",     lastName: "Nowak",        email: "m.nowak@techcorp.pl",          phone: "+48 601 000 001", role: "Dyrektor IT",         isPrimary: true  },
  { id: "cc-002", clientId: "cl-001", firstName: "Joanna",    lastName: "Wiśniewska",   email: "j.wisniewska@techcorp.pl",     phone: "+48 602 000 002", role: "Kierownik projektu",  isPrimary: false },
  { id: "cc-003", clientId: "cl-002", firstName: "Tomasz",    lastName: "Zając",        email: "t.zajac@retailplus.pl",        phone: "+48 603 000 003", role: "Prezes zarządu",      isPrimary: true  },
  { id: "cc-004", clientId: "cl-003", firstName: "Katarzyna", lastName: "Lewandowska",  email: "k.lewandowska@buildco.pl",     phone: "+48 604 000 004", role: "CFO",                 isPrimary: true  },
  { id: "cc-005", clientId: "cl-004", firstName: "Piotr",     lastName: "Wróbel",       email: "p.wrobel@medgroup.pl",         phone: "+48 605 000 005", role: "Dyrektor operacyjny", isPrimary: true  },
  { id: "cc-006", clientId: "cl-005", firstName: "Agnieszka", lastName: "Kamińska",     email: "a.kaminska@logiflow.pl",       phone: "+48 606 000 006", role: "Kierownik logistyki", isPrimary: true  },
  { id: "cc-007", clientId: "cl-006", firstName: "Michał",    lastName: "Kowalczyk",    email: "m.kowalczyk@edusoft.pl",       phone: "+48 607 000 007", role: "CEO",                 isPrimary: true  },
  { id: "cc-008", clientId: "cl-008", firstName: "Barbara",   lastName: "Jankowska",    email: "b.jankowska@autodealer.pl",    phone: "+48 608 000 008", role: "Kierownik sprzedaży", isPrimary: true  },
]
export const demoOpportunities: DemoOpportunity[] = [
  { id: "op-001", name: "Wdrożenie SMB 360",        clientId: "cl-001", stageId: "stage-003", ownerId: "u1", value: 48000, probability: 70,  expectedClose: "2026-04-15", lastActivity: "2026-03-15", inactivityFlag: null         as InactivityFlag, notes: "Klient gotowy do negocjacji cenowych." },
  { id: "op-002", name: "Licencja roczna — Retail",  clientId: "cl-002", stageId: "stage-002", ownerId: "u2", value: 12000, probability: 40,  expectedClose: "2026-05-01", lastActivity: "2026-03-10", inactivityFlag: "amber"      as InactivityFlag, notes: "Czekamy na decyzję zarządu." },
  { id: "op-003", name: "Moduł HR",                  clientId: "cl-004", stageId: "stage-001", ownerId: "u3", value: 22000, probability: 20,  expectedClose: "2026-06-30", lastActivity: "2026-02-20", inactivityFlag: "red"        as InactivityFlag, notes: "Brak kontaktu od 4 tygodni." },
  { id: "op-004", name: "Rozszerzenie licencji",     clientId: "cl-005", stageId: "stage-002", ownerId: "u2", value: 8000,  probability: 50,  expectedClose: "2026-04-30", lastActivity: "2026-03-17", inactivityFlag: null         as InactivityFlag, notes: "Doprecyzowanie zakresu." },
  { id: "op-005", name: "Pilot — EduSoft",           clientId: "cl-006", stageId: "stage-001", ownerId: "u1", value: 5000,  probability: 20,  expectedClose: "2026-07-01", lastActivity: "2026-03-12", inactivityFlag: null         as InactivityFlag, notes: "Propozycja pilotażu 3-miesięcznego." },
  { id: "op-006", name: "Enterprise deal",           clientId: "cl-001", stageId: "stage-004", ownerId: "u1", value: 95000, probability: 100, expectedClose: "2026-03-01", lastActivity: "2026-03-01", inactivityFlag: null         as InactivityFlag, notes: "Umowa podpisana." },
  { id: "op-007", name: "Pakiet logistyczny",        clientId: "cl-005", stageId: "stage-003", ownerId: "u2", value: 18000, probability: 65,  expectedClose: "2026-05-15", lastActivity: "2026-03-14", inactivityFlag: null         as InactivityFlag, notes: "Finalizacja specyfikacji technicznej." },
  { id: "op-008", name: "Migracja danych",           clientId: "cl-002", stageId: "stage-005", ownerId: "u2", value: 7000,  probability: 0,   expectedClose: "2026-02-28", lastActivity: "2026-02-28", inactivityFlag: null         as InactivityFlag, notes: "Klient wybrał konkurencję." },
  { id: "op-009", name: "Support Premium",           clientId: "cl-004", stageId: "stage-002", ownerId: "u3", value: 14400, probability: 40,  expectedClose: "2026-05-01", lastActivity: "2026-03-16", inactivityFlag: null         as InactivityFlag, notes: "Oferta wysłana, czekamy." },
  { id: "op-010", name: "Moduł BookIt",              clientId: "cl-008", stageId: "stage-001", ownerId: "u2", value: 9600,  probability: 20,  expectedClose: "2026-08-01", lastActivity: "2026-03-18", inactivityFlag: null         as InactivityFlag, notes: "Wstępna rozmowa." },
]
export const demoOpportunityProducts = [
  { opportunityId: "op-001", productId: "prod-004", quantity: 1, unitPrice: 48000, discountPercent: 0 },
  { opportunityId: "op-002", productId: "prod-001", quantity: 1, unitPrice: 9600,  discountPercent: 0 },
  { opportunityId: "op-002", productId: "prod-006", quantity: 1, unitPrice: 7200,  discountPercent: 0 },
  { opportunityId: "op-006", productId: "prod-004", quantity: 1, unitPrice: 48000, discountPercent: 0 },
  { opportunityId: "op-006", productId: "prod-005", quantity: 1, unitPrice: 15000, discountPercent: 0 },
  { opportunityId: "op-006", productId: "prod-006", quantity: 2, unitPrice: 7200,  discountPercent: 10 },
  { opportunityId: "op-007", productId: "prod-002", quantity: 1, unitPrice: 12000, discountPercent: 0 },
  { opportunityId: "op-007", productId: "prod-005", quantity: 1, unitPrice: 15000, discountPercent: 20 },
]
export const demoInteractions: DemoInteraction[] = [
  { id: "int-001", type: "meeting"  as InteractionType, title: "Prezentacja produktu",         clientId: "cl-001", opportunityId: "op-001", assignedTo: "u1", createdBy: "u1", scheduledAt: "2026-03-15T10:00:00", completedAt: "2026-03-15T11:30:00", priority: "high"   as InteractionPriority, status: "done" as InteractionStatus, description: "Spotkanie z Markiem Nowakiem — demo pełnej platformy.", emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-002", type: "call"     as InteractionType, title: "Rozmowa o warunkach umowy",    clientId: "cl-001", opportunityId: "op-001", assignedTo: "u1", createdBy: "u1", scheduledAt: "2026-03-18T14:00:00", completedAt: null,                  priority: "high"   as InteractionPriority, status: "todo" as InteractionStatus, description: "Ustalić warunki płatności i termin wdrożenia.",          emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-003", type: "email"    as InteractionType, title: "Oferta dla Retail Plus",       clientId: "cl-002", opportunityId: "op-002", assignedTo: "u2", createdBy: "u2", scheduledAt: "2026-03-10T09:00:00", completedAt: "2026-03-10T09:15:00", priority: "medium" as InteractionPriority, status: "done" as InteractionStatus, description: "Wysłano ofertę roczną.",                                  emailTo: "t.zajac@retailplus.pl", emailSubject: "Oferta roczna — Retail Plus", campaignId: null },
  { id: "int-004", type: "task"     as InteractionType, title: "Przygotować analizę ROI",      clientId: "cl-004", opportunityId: "op-003", assignedTo: "u3", createdBy: "u1", scheduledAt: "2026-03-20T12:00:00", completedAt: null,                  priority: "medium" as InteractionPriority, status: "todo" as InteractionStatus, description: "Dokument ROI dla MedGroup.",                              emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-005", type: "note"     as InteractionType, title: "Notatka po spotkaniu",         clientId: "cl-004", opportunityId: "op-003", assignedTo: "u3", createdBy: "u3", scheduledAt: "2026-02-20T16:00:00", completedAt: "2026-02-20T16:05:00", priority: "low"    as InteractionPriority, status: "done" as InteractionStatus, description: "Klient zainteresowany, ale czeka na wyniki Q1.",          emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-006", type: "call"     as InteractionType, title: "Follow-up LogiFlow",           clientId: "cl-005", opportunityId: "op-004", assignedTo: "u2", createdBy: "u2", scheduledAt: "2026-03-19T11:00:00", completedAt: null,                  priority: "medium" as InteractionPriority, status: "todo" as InteractionStatus, description: "Potwierdzić zakres rozszerzenia licencji.",               emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-007", type: "meeting"  as InteractionType, title: "Kick-off Enterprise deal",     clientId: "cl-001", opportunityId: "op-006", assignedTo: "u1", createdBy: "u1", scheduledAt: "2026-02-28T10:00:00", completedAt: "2026-02-28T12:00:00", priority: "high"   as InteractionPriority, status: "done" as InteractionStatus, description: "Spotkanie inauguracyjne po podpisaniu umowy.",            emailTo: null, emailSubject: null, campaignId: "camp-001" },
  { id: "int-008", type: "email"    as InteractionType, title: "Powitanie — EduSoft",          clientId: "cl-006", opportunityId: "op-005", assignedTo: "u1", createdBy: "u1", scheduledAt: "2026-03-12T08:00:00", completedAt: "2026-03-12T08:10:00", priority: "low"    as InteractionPriority, status: "done" as InteractionStatus, description: "Wysłano wiadomość powitalną.",                            emailTo: "m.kowalczyk@edusoft.pl", emailSubject: "Witamy — SMB 360 Pilot", campaignId: "camp-001" },
  { id: "int-009", type: "task"     as InteractionType, title: "Wysłać SLA dla AutoDealer",    clientId: "cl-008", opportunityId: "op-010", assignedTo: "u2", createdBy: "u2", scheduledAt: "2026-03-21T10:00:00", completedAt: null,                  priority: "medium" as InteractionPriority, status: "todo" as InteractionStatus, description: "Przygotować i wysłać dokument SLA.",                      emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-010", type: "call"     as InteractionType, title: "Negocjacje — LogiFlow pakiet", clientId: "cl-005", opportunityId: "op-007", assignedTo: "u2", createdBy: "u2", scheduledAt: "2026-03-14T13:00:00", completedAt: "2026-03-14T13:45:00", priority: "high"   as InteractionPriority, status: "done" as InteractionStatus, description: "Omówiono rabat 20% na usługi.",                           emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-011", type: "meeting"  as InteractionType, title: "Demo BuildCo",                 clientId: "cl-003", opportunityId: null,     assignedTo: "u1", createdBy: "u1", scheduledAt: "2026-03-22T14:00:00", completedAt: null,                  priority: "medium" as InteractionPriority, status: "todo" as InteractionStatus, description: "Prezentacja RequestFlow dla BuildCo.",                    emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-012", type: "note"     as InteractionType, title: "Notatka: MedGroup Q2",         clientId: "cl-004", opportunityId: "op-009", assignedTo: "u3", createdBy: "u3", scheduledAt: "2026-03-16T15:00:00", completedAt: "2026-03-16T15:05:00", priority: "low"    as InteractionPriority, status: "done" as InteractionStatus, description: "Klient potwierdza budżet na Q2.",                         emailTo: null, emailSubject: null, campaignId: "camp-002" },
  { id: "int-013", type: "email"    as InteractionType, title: "Oferta Support Premium",       clientId: "cl-004", opportunityId: "op-009", assignedTo: "u3", createdBy: "u3", scheduledAt: "2026-03-16T16:00:00", completedAt: "2026-03-16T16:10:00", priority: "medium" as InteractionPriority, status: "done" as InteractionStatus, description: "Wysłano ofertę support premium.",                         emailTo: "p.wrobel@medgroup.pl", emailSubject: "Oferta Support Premium — MedGroup", campaignId: "camp-002" },
  { id: "int-014", type: "task"     as InteractionType, title: "Zaktualizować prezentację",    clientId: "cl-002", opportunityId: "op-002", assignedTo: "u2", createdBy: "u1", scheduledAt: "2026-03-19T09:00:00", completedAt: null,                  priority: "low"    as InteractionPriority, status: "todo" as InteractionStatus, description: "Zaktualizować slajdy o nowe funkcje.",                    emailTo: null, emailSubject: null, campaignId: null },
  { id: "int-015", type: "call"     as InteractionType, title: "Rozmowa z Retail — decyzja",   clientId: "cl-002", opportunityId: "op-002", assignedTo: "u2", createdBy: "u2", scheduledAt: "2026-03-25T10:00:00", completedAt: null,                  priority: "high"   as InteractionPriority, status: "todo" as InteractionStatus, description: "Oczekujemy na finalną decyzję.",                          emailTo: null, emailSubject: null, campaignId: null },
]
export const demoContactSegments = [
  { id: "seg-001", name: "Klienci IT — Warszawa",    description: "Klienci z branży IT z siedzibą w Warszawie",    estimatedCount: 12, isShared: true,  createdBy: "u1" },
  { id: "seg-002", name: "Strategiczne kontakty",    description: "Wszyscy klienci strategiczni (typ: strategic)",  estimatedCount: 8,  isShared: true,  createdBy: "u1" },
  { id: "seg-003", name: "Aktywni leady bez szansy", description: "Leady bez otwartej szansy sprzedaży",            estimatedCount: 5,  isShared: false, createdBy: "u2" },
]
export const demoCampaigns = [
  {
    id: "camp-001",
    name: "Q1 2026 — Email Blast IT",
    type: "email_blast" as CampaignType,
    status: "completed" as CampaignStatus,
    ownerId: "u1",
    startDate: "2026-01-15",
    endDate: "2026-02-15",
    budget: 3000,
    currency: "PLN",
    goal: "Generowanie leadów z branży IT",
    description: "Kampania emailowa skierowana do klientów z sektora IT.",
    segmentIds: ["seg-001"],
    linkedOpportunityIds: ["op-001", "op-005"],
    metrics: { sent: 120, responded: 18, openRate: 42, clickRate: 15 },
  },
  {
    id: "camp-002",
    name: "Webinar — SMB 360 Features 2026",
    type: "webinar" as CampaignType,
    status: "active" as CampaignStatus,
    ownerId: "u1",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    budget: 5000,
    currency: "PLN",
    goal: "Edukacja klientów strategicznych i generowanie szans",
    description: "Seria webinarów pokazujących nowe funkcje platformy.",
    segmentIds: ["seg-002"],
    linkedOpportunityIds: ["op-001", "op-009"],
    metrics: { sent: 45, responded: 12, openRate: 0, clickRate: 0 },
  },
  {
    id: "camp-003",
    name: "Cold Outreach — Manufacturing Q2",
    type: "cold_outreach" as CampaignType,
    status: "draft" as CampaignStatus,
    ownerId: "u2",
    startDate: "2026-04-01",
    endDate: "2026-05-31",
    budget: 2500,
    currency: "PLN",
    goal: "Pozyskanie 5 nowych leadów z sektora produkcyjnego",
    description: "Kampania prospectingowa via LinkedIn + email.",
    segmentIds: ["seg-003"],
    linkedOpportunityIds: [],
    metrics: { sent: 0, responded: 0, openRate: 0, clickRate: 0 },
  },
]
export const OWNER_NAMES: Record<string, string> = {
  u1: "Anna Kowalska",
  u2: "Piotr Nowak",
  u3: "Marta Wiśniewska",
  u4: "Tomasz Kowalczyk",
  u5: "Ewa Dąbrowska",
  u6: "Jan Zieliński",
}
export const OWNER_INITIALS: Record<string, string> = {
  u1: "AK", u2: "PN", u3: "MW", u4: "TK", u5: "ED", u6: "JZ",
}
export const demoOwners = [
  { id: "u1", name: "Anna Kowalska" },
  { id: "u2", name: "Piotr Nowak" },
  { id: "u3", name: "Marta Wiśniewska" },
]
export const clientMap = Object.fromEntries(demoClients.map(c => [c.id, c]))
export const stageMap  = Object.fromEntries(demoPipelineStages.map(s => [s.id, s]))
export const productMap = Object.fromEntries(demoProducts.map(p => [p.id, p]))
