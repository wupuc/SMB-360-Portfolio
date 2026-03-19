export type Status = "POC Gotowy" | "W Trakcie" | "Ocena" | "Analiza"

export interface Project {
  id: number
  section: string
  icon: string
  title: string
  subtitle: string
  status: Status
  tech: string[]
  short: string
  purpose: string
  features: string[]
}

export const STATUS_CLASSES: Record<Status, string> = {
  "POC Gotowy": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  "W Trakcie":  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  "Ocena":      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  "Analiza":    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
}

export const STATUS_DOT: Record<Status, string> = {
  "POC Gotowy": "bg-emerald-500",
  "W Trakcie":  "bg-amber-500",
  "Ocena":      "bg-violet-500",
  "Analiza":    "bg-sky-500",
}

export const SECTION_ORDER = [
  "Aplikacje Platformowe",
  "Agenci AI — Portfolio Copilot Studio",
  "Inicjatywy Strategiczne i Współpraca",
]

export const SECTION_ICONS: Record<string, string> = {
  "Aplikacje Platformowe": "🏗️",
  "Agenci AI — Portfolio Copilot Studio": "🤖",
  "Inicjatywy Strategiczne i Współpraca": "🤝",
}

export const ALL_STATUSES = ["Wszystkie", "POC Gotowy", "W Trakcie", "Ocena", "Analiza"] as const

export const projects: Project[] = [
  {
    id: 1,
    section: "Aplikacje Platformowe",
    icon: "⚙️",
    title: "Power Factory",
    subtitle: "Centralne zarządzanie projektami i hub współpracy z krajami",
    status: "W Trakcie",
    tech: ["Power Apps", "Dataverse", "Power BI"],
    short: "Jedno miejsce do zarządzania wszystkimi projektami, klientami, zadaniami, pomysłami i POC-ami działu na rynkach CEE.",
    purpose: "Jedno źródło prawdy dla pracy działu — śledzenie wkładu man-days na poszczególne rynki, wskaźnika wygranych projektów oraz tego, czy dział czerpie korzyści z dostarczonych projektów. Umożliwia współpracę i wymianę informacji z zespołami krajowymi.",
    features: [
      "Zarządzanie klientami, projektami, zadaniami i pomysłami",
      "Śledzenie man-days i raportowanie wkładu per kraj",
      "Analityka wygranych/przegranych projektów",
      "Dashboard ROI działu",
      "Śledzenie pipeline'u POC-ów",
    ],
  },
  {
    id: 2,
    section: "Agenci AI — Portfolio Copilot Studio",
    icon: "🎧",
    title: "Magenta Helpdesk Agent",
    subtitle: "Tworzenie i śledzenie zgłoszeń przez rozmowę",
    status: "POC Gotowy",
    tech: ["Copilot Studio", "Power Automate", "Dataverse"],
    short: "Agent umożliwiający użytkownikom tworzenie i śledzenie zgłoszeń helpdesk przez rozmowę, z pełnymi szczegółami zwracanymi po utworzeniu.",
    purpose: "Skrócenie czasu obsługi helpdesku, eliminacja ręcznego sprawdzania statusów, uproszczenie zgłaszania problemów dla użytkowników końcowych.",
    features: [
      "Tworzenie zgłoszeń helpdesk przez rozmowę",
      "Sprawdzanie statusu istniejących zgłoszeń",
      "Generowanie i udostępnianie linków do zgłoszeń",
      "Odpowiadanie na pytania z bazy wiedzy Helpdesku",
    ],
  },
  {
    id: 3,
    section: "Agenci AI — Portfolio Copilot Studio",
    icon: "📧",
    title: "Productivity Agent",
    subtitle: "Klasyfikator e-maili i podsumowania priorytetów",
    status: "POC Gotowy",
    tech: ["Copilot Studio", "Microsoft 365", "Exchange"],
    short: "Klasyfikuje e-maile jako Wysoki/Średni/Niski priorytet i generuje zwięzłe podsumowania. Dostarcza codzienny briefing krytycznych wiadomości.",
    purpose: "Zwiększenie produktywności użytkowników poprzez wyróżnienie tego, co najważniejsze, i redukcję czasu spędzanego na sortowaniu skrzynki.",
    features: [
      "Klasyfikacja priorytetów e-maili (Wysoki / Średni / Niski)",
      "Krótkie podsumowania do szybkiego działania",
      "Codzienny digest e-maili wysokiego priorytetu (EOD)",
      "Tryb skupienia — odfiltrowanie szumu w skrzynce",
    ],
  },
  {
    id: 4,
    section: "Agenci AI — Portfolio Copilot Studio",
    icon: "💰",
    title: "Offer Price Creator Agent",
    subtitle: "Automatyczna wycena projektów z workflow zatwierdzania",
    status: "POC Gotowy",
    tech: ["Copilot Studio", "Power Automate", "SharePoint"],
    short: "Przyjmuje wymagania biznesowe i generuje ustrukturyzowaną wycenę projektu z technologiami, rozbiciem man-days i przepływem zatwierdzania przez managera.",
    purpose: "Skrócenie czasu tworzenia ofert, standaryzacja estymacji i eliminacja ręcznej pracy przy powtarzalnych zadaniach wyceny.",
    features: [
      "Zbieranie i analiza wymagań biznesowych",
      "Streszczenie projektu z historycznych ofert (baza wiedzy)",
      "Tabele estymacji technologii i man-days",
      "Workflow zatwierdzania przez managera",
      "Automatycznie generowany dokument końcowej oferty",
    ],
  },
  {
    id: 5,
    section: "Agenci AI — Portfolio Copilot Studio",
    icon: "🔬",
    title: "AI Foundry & Ocena Multi-Platform",
    subtitle: "Eksploracja AI poza ekosystemem Microsoft",
    status: "Ocena",
    tech: ["Azure AI Foundry", "Gemini Enterprise", "n8n"],
    short: "Ocena Gemini Enterprise i n8n jako alternatyw dla Copilot Studio do budowania produktów AI niezależnych od Microsoft.",
    purpose: "Rozszerzenie oferty działu o narzędzia AI niezależne od dostawcy. Ocena n8n jako platformy automatyzacji AI dla projektów komercyjnych.",
    features: [
      "Ocena możliwości Gemini Enterprise",
      "Ewaluacja n8n jako platformy automatyzacji AI",
      "Porównanie z Copilot Studio",
      "Cel: oferta produktów AI poza Microsoftem",
    ],
  },
  {
    id: 6,
    section: "Agenci AI — Portfolio Copilot Studio",
    icon: "🗓️",
    title: "Copilot Studio — Portfolio POC",
    subtitle: "Wewnętrzne inicjatywy POC budujące kompetencje Copilot",
    status: "W Trakcie",
    tech: ["Copilot Studio", "Microsoft 365", "SharePoint"],
    short: "Zestaw wewnętrznych agentów POC, w tym planowanie urlopów i Q&A z dokumentów — budowanie kompetencji działu przed wdrożeniami komercyjnymi.",
    purpose: "Rozwijanie praktycznych kompetencji Copilot Studio w zespole poprzez realne przypadki użycia. Fundament dla szerszej strategii portfolio Copilot z Grecją.",
    features: [
      "Agent planowania urlopów (POC)",
      "Agent Q&A z dokumentów (POC)",
      "Agenci wewnętrznej bazy wiedzy",
      "Baza doświadczeń dla współpracy z Grecją",
    ],
  },
  {
    id: 7,
    section: "Inicjatywy Strategiczne i Współpraca",
    icon: "🇬🇷",
    title: "DoRE — Współpraca z Grecją",
    subtitle: "Produktyzacja rozwiązania DoRE z rynkiem greckim",
    status: "W Trakcie",
    tech: ["Copilot Studio", "Power Pages", "Azure AI Foundry"],
    short: "Wspólna inicjatywa z Grecją mająca na celu przekształcenie DoRE w skalowalny produkt.",
    purpose: "Produktyzacja i standaryzacja rozwiązania DoRE, budowa portfolio Copilot na wielu rynkach oraz skalowanie najlepszych praktyk między zespołami krajowymi.",
    features: [
      "LightWeight DoRE zbudowany na Copilot Studio",
      "Integracja AI Foundry do przetwarzania dokumentów",
      "Wymiana wiedzy i doświadczeń między rynkami",
      "Rozwój portfolio Copilot z Grecją",
    ],
  },
  {
    id: 8,
    section: "Inicjatywy Strategiczne i Współpraca",
    icon: "🤖",
    title: "AI Recruitment HUB",
    subtitle: "Aplikacja HR + Portal Kandydatów + Screening CV przez AI",
    status: "W Trakcie",
    tech: ["Code Apps", "Power Pages", "n8n + AI", "Dataverse"],
    short: "Trzywarstwowe rozwiązanie rekrutacyjne: aplikacja HR, portal kandydatów i pipeline AI n8n oceniający CV względem wymagań.",
    purpose: "POC dla trzech nowych technologii (Code Apps, n8n, Power Pages) w realnym scenariuszu. Prezentacja pełnej automatyzacji rekrutacji end-to-end ze screeningiem kandydatów przez AI.",
    features: [
      "Aplikacja HR: ogłoszenia, przegląd kandydatów, planowanie, scoring",
      "Portal kandydatów (Power Pages): przeglądanie ofert, aplikowanie z CV",
      "Pipeline AI n8n: parsowanie CV → dopasowanie wymagań → scoring",
      "Wsparcie decyzji HR: odrzuć / zaproś na podstawie wyniku AI",
      "Prezentacja Code Apps (Canvas) jako nowego podejścia do tworzenia",
    ],
  },
  {
    id: 9,
    section: "Inicjatywy Strategiczne i Współpraca",
    icon: "🌐",
    title: "Portal CRM — SMB",
    subtitle: "Portal klientów SMB — Polska i Chorwacja",
    status: "Analiza",
    tech: ["Power Pages", "Code Apps", "Dataverse"],
    short: "Portal skierowany do klientów segmentu SMB, opracowany we współpracy z rynkami polskim i chorwackim.",
    purpose: "Umożliwienie klientom SMB dostępu do ofert, śledzenia statusów i komunikacji z firmą przez dedykowany portal samoobsługowy.",
    features: [
      "Samoobsługowy portal klientów",
      "Przeglądanie ofert i śledzenie statusów",
      "Implementacja Code Apps (Canvas)",
      "Wdrożenie na wielu rynkach (PL + HR)",
    ],
  },
]
