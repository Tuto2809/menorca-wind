export type Lang = "ca" | "es" | "en" | "fr";

export const LANG_FLAGS: Record<Lang, string> = {
  ca: "🏴󠁥󠁳󠁣󠁴󠁿",
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
};

export const LANG_LABELS: Record<Lang, string> = {
  ca: "Català",
  es: "Castellano",
  en: "English",
  fr: "Français",
};

export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "ca";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("ca")) return "ca";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("es")) return "es";
  return "ca"; // default Català
}

export type T = {
  appSub: string; chooseDay: string; today: string; forecast: string;
  goodWeather: string; strongWind: string; rainLikely: string;
  rainPlanTitle: string; loadingAgenda: string; fullAgenda: string;
  beachesTitle: string; beachesRainy: string; results: string; resultsPlural: string;
  filters: string; clearFilters: string; noResults: string; clearFiltersBtn: string;
  openMaps: string; orientation: string; parking: string;
  jellyTitle: string; jellySub: string; windExplain: string;
  sortRecommended: string; sortDistance: string; sortLength: string;
  enableLocation: string; municipality: string; beachType: string;
  services: string; loading: string; admin: string;
  beachTypes: Record<string, string>;
  windNames: Record<string, string>;
  days: readonly string[];
  months: readonly string[];
};

export const TRANSLATIONS = {
  ca: {
    appSub: "Platges segons el vent",
    chooseDay: "Tria un dia",
    today: "Avui",
    forecast: "Previsió del temps",
    goodWeather: "Bon temps",
    strongWind: "Vent fort",
    rainLikely: "Pluja probable",
    rainPlanTitle: "Dia de pluja — pla B: pobles i agenda cultural",
    loadingAgenda: "Carregant agenda de Menorca...",
    fullAgenda: "Veure agenda completa →",
    beachesTitle: "Platges recomanades",
    beachesRainy: "Platges (consultar abans d'anar)",
    results: "resultat",
    resultsPlural: "resultats",
    filters: "Filtres",
    clearFilters: "Netejar tots els filtres ✕",
    noResults: "No hi ha platges amb aquests filtres per avui.",
    clearFiltersBtn: "Netejar filtres",
    openMaps: "Obrir a Google Maps",
    orientation: "Cara",
    parking: "Pàrquing",
    jellyTitle: "Avís de meduses",
    jellySub: "Pròximament: estat en temps real per a les platges recomanades",
    windExplain: "Vent {name} ({dir}) → platges protegides orientades al {opp}",
    sortRecommended: "Recomanades",
    sortDistance: "Més properes",
    sortLength: "Més grans",
    enableLocation: "Activar ubicació",
    municipality: "Municipi",
    beachType: "Tipus de platja",
    services: "Serveis",
    loading: "Carregant previsió...",
    admin: "Admin →",
    beachTypes: { Familiar: "Familiar", Virgen: "Verge", Nudista: "Nudista", Kitesurf: "Kitesurf", Surf: "Surf", Tranquila: "Tranquil·la", Urbana: "Urbana" },
    windNames: { N: "Tramuntana", NE: "Gregal", E: "Llevant", SE: "Xaloc", S: "Migjorn", SW: "Llebeig", W: "Ponent", NW: "Mestral" },
    days: ["Diu", "Dil", "Dim", "Dim", "Dij", "Div", "Dis"],
    months: ["gen", "feb", "mar", "abr", "mai", "jun", "jul", "ago", "set", "oct", "nov", "des"],
  },
  es: {
    appSub: "Playas según el viento",
    chooseDay: "Elige un día",
    today: "Hoy",
    forecast: "Previsión del tiempo",
    goodWeather: "Buen tiempo",
    strongWind: "Viento fuerte",
    rainLikely: "Lluvia probable",
    rainPlanTitle: "Día de lluvia — plan B: pueblos y agenda cultural",
    loadingAgenda: "Cargando agenda de Menorca...",
    fullAgenda: "Ver agenda completa →",
    beachesTitle: "Playas recomendadas",
    beachesRainy: "Playas (consultar antes de ir)",
    results: "resultado",
    resultsPlural: "resultados",
    filters: "Filtros",
    clearFilters: "Limpiar todos los filtros ✕",
    noResults: "No hay playas con esos filtros para hoy.",
    clearFiltersBtn: "Limpiar filtros",
    openMaps: "Abrir en Google Maps",
    orientation: "Cara",
    parking: "Parking",
    jellyTitle: "Aviso de medusas",
    jellySub: "Próximamente: estado en tiempo real para las playas recomendadas",
    windExplain: "Viento {name} ({dir}) → playas protegidas orientadas al {opp}",
    sortRecommended: "Recomendadas",
    sortDistance: "Más cercanas",
    sortLength: "Más grandes",
    enableLocation: "Activar ubicación",
    municipality: "Municipio",
    beachType: "Tipo de playa",
    services: "Servicios",
    loading: "Cargando previsión...",
    admin: "Admin →",
    beachTypes: { Familiar: "Familiar", Virgen: "Virgen", Nudista: "Nudista", Kitesurf: "Kitesurf", Surf: "Surf", Tranquila: "Tranquila", Urbana: "Urbana" },
    windNames: { N: "Tramuntana", NE: "Gregal", E: "Llevant", SE: "Xaloc", S: "Migjorn", SW: "Llebeig", W: "Ponent", NW: "Mestral" },
    days: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  },
  en: {
    appSub: "Beaches by wind direction",
    chooseDay: "Choose a day",
    today: "Today",
    forecast: "Weather forecast",
    goodWeather: "Good weather",
    strongWind: "Strong wind",
    rainLikely: "Rain likely",
    rainPlanTitle: "Rainy day — plan B: towns & cultural agenda",
    loadingAgenda: "Loading Menorca agenda...",
    fullAgenda: "View full agenda →",
    beachesTitle: "Recommended beaches",
    beachesRainy: "Beaches (check before going)",
    results: "result",
    resultsPlural: "results",
    filters: "Filters",
    clearFilters: "Clear all filters ✕",
    noResults: "No beaches match these filters for today.",
    clearFiltersBtn: "Clear filters",
    openMaps: "Open in Google Maps",
    orientation: "Facing",
    parking: "Parking",
    jellyTitle: "Jellyfish alert",
    jellySub: "Coming soon: real-time status for recommended beaches",
    windExplain: "{name} wind ({dir}) → sheltered beaches facing {opp}",
    sortRecommended: "Recommended",
    sortDistance: "Nearest",
    sortLength: "Largest",
    enableLocation: "Enable location",
    municipality: "Municipality",
    beachType: "Beach type",
    services: "Services",
    loading: "Loading forecast...",
    admin: "Admin →",
    beachTypes: { Familiar: "Family", Virgen: "Wild", Nudista: "Nudist", Kitesurf: "Kitesurf", Surf: "Surf", Tranquila: "Quiet", Urbana: "Urban" },
    windNames: { N: "Tramuntana", NE: "Gregal", E: "Llevant", SE: "Xaloc", S: "Migjorn", SW: "Llebeig", W: "Ponent", NW: "Mestral" },
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  fr: {
    appSub: "Plages selon le vent",
    chooseDay: "Choisissez un jour",
    today: "Aujourd'hui",
    forecast: "Prévisions météo",
    goodWeather: "Beau temps",
    strongWind: "Vent fort",
    rainLikely: "Pluie probable",
    rainPlanTitle: "Jour de pluie — plan B: villages et agenda culturel",
    loadingAgenda: "Chargement de l'agenda de Minorque...",
    fullAgenda: "Voir l'agenda complet →",
    beachesTitle: "Plages recommandées",
    beachesRainy: "Plages (vérifier avant d'y aller)",
    results: "résultat",
    resultsPlural: "résultats",
    filters: "Filtres",
    clearFilters: "Effacer tous les filtres ✕",
    noResults: "Aucune plage ne correspond à ces filtres aujourd'hui.",
    clearFiltersBtn: "Effacer les filtres",
    openMaps: "Ouvrir dans Google Maps",
    orientation: "Face",
    parking: "Parking",
    jellyTitle: "Alerte méduses",
    jellySub: "Bientôt : état en temps réel pour les plages recommandées",
    windExplain: "Vent {name} ({dir}) → plages abritées face au {opp}",
    sortRecommended: "Recommandées",
    sortDistance: "Les plus proches",
    sortLength: "Les plus grandes",
    enableLocation: "Activer la localisation",
    municipality: "Municipalité",
    beachType: "Type de plage",
    services: "Services",
    loading: "Chargement des prévisions...",
    admin: "Admin →",
    beachTypes: { Familiar: "Famille", Virgen: "Sauvage", Nudista: "Nudiste", Kitesurf: "Kitesurf", Surf: "Surf", Tranquila: "Tranquille", Urbana: "Urbaine" },
    windNames: { N: "Tramuntana", NE: "Gregal", E: "Llevant", SE: "Xaloc", S: "Migjorn", SW: "Llebeig", W: "Ponent", NW: "Mestral" },
    days: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    months: ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"],
  },
} as const;
