export type Orientation = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type Municipality = "Maó" | "Ciutadella" | "Alaior" | "Es Mercadal" | "Ferreries" | "Sant Lluís" | "Es Castell" | "Es Migjorn Gran";
export type BeachType = "Familiar" | "Virgen" | "Nudista" | "Kitesurf" | "Surf" | "Tranquila" | "Urbana";

export interface Beach {
  name: string;
  orientation: Orientation;
  municipality: Municipality;
  length: string;          // descriptive
  lengthM: number;         // metres for sorting
  type: BeachType;
  description: string;
  parking: boolean;
  services: string[];
  lat: number;
  lon: number;
}

export const OPPOSITE_ORIENTATIONS: Record<Orientation, Orientation[]> = {
  N:  ["S", "SW", "SE"],
  NE: ["SW", "S",  "W"],
  E:  ["W",  "SW", "NW"],
  SE: ["NW", "N",  "W"],
  S:  ["N",  "NW", "NE"],
  SW: ["NE", "N",  "E"],
  W:  ["E",  "SE", "NE"],
  NW: ["SE", "S",  "E"],
};

export const WIND_NAMES: Record<Orientation, string> = {
  N:  "Tramuntana",
  NE: "Gregal",
  E:  "Llevant",
  SE: "Xaloc",
  S:  "Migjorn",
  SW: "Llebeig",
  W:  "Ponent",
  NW: "Mestral",
};

export const MUNICIPALITIES: Municipality[] = [
  "Maó", "Ciutadella", "Alaior", "Es Mercadal", "Ferreries", "Sant Lluís", "Es Castell", "Es Migjorn Gran"
];

export const BEACH_TYPES: BeachType[] = [
  "Familiar", "Virgen", "Nudista", "Kitesurf", "Surf", "Tranquila", "Urbana"
];

export const ALL_SERVICES = ["Chiringuito", "Salvamento", "Parking", "Duchas", "Accesible", "Kayak", "Escuela kite"];

// Haversine distance in km
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const BEACHES: Beach[] = [
  {
    name: "Son Bou",
    orientation: "S", municipality: "Alaior",
    length: "2.5 km", lengthM: 2500, type: "Familiar",
    description: "La playa más larga de Menorca, con acceso para todos los públicos.",
    parking: true, services: ["Chiringuito", "Salvamento", "Accesible", "Duchas"],
    lat: 39.8724, lon: 4.0587,
  },
  {
    name: "Santo Tomàs",
    orientation: "S", municipality: "Es Migjorn Gran",
    length: "1.2 km", lengthM: 1200, type: "Familiar",
    description: "Playa de arena fina ideal para familias, bien equipada.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas"],
    lat: 39.8999, lon: 4.0199,
  },
  {
    name: "Son Saura",
    orientation: "S", municipality: "Ciutadella",
    length: "800 m", lengthM: 800, type: "Virgen",
    description: "Playa virgen de aguas cristalinas. Acceso por camino de tierra.",
    parking: true, services: ["Parking"],
    lat: 39.9064, lon: 3.8386,
  },
  {
    name: "Macarella",
    orientation: "S", municipality: "Ciutadella",
    length: "500 m", lengthM: 500, type: "Virgen",
    description: "Una de las más fotogénicas de la isla. Aguas turquesas y acantilados blancos.",
    parking: false, services: ["Chiringuito"],
    lat: 39.9011, lon: 3.8239,
  },
  {
    name: "Macarelleta",
    orientation: "SW", municipality: "Ciutadella",
    length: "200 m", lengthM: 200, type: "Nudista",
    description: "Cala pequeña y recogida, gemela de Macarella.",
    parking: false, services: [],
    lat: 39.8991, lon: 3.8222,
  },
  {
    name: "Cala Galdana",
    orientation: "S", municipality: "Ferreries",
    length: "400 m", lengthM: 400, type: "Familiar",
    description: "La 'reina' de las calas, rodeada de pinares y acantilados.",
    parking: true, services: ["Chiringuito", "Salvamento", "Kayak", "Duchas", "Parking"],
    lat: 39.9361, lon: 3.9572,
  },
  {
    name: "Cala en Turqueta",
    orientation: "SW", municipality: "Ciutadella",
    length: "300 m", lengthM: 300, type: "Virgen",
    description: "Cala tranquila de aguas de color turquesa excepcional.",
    parking: false, services: [],
    lat: 39.9028, lon: 3.8414,
  },
  {
    name: "Binigaus",
    orientation: "S", municipality: "Es Migjorn Gran",
    length: "700 m", lengthM: 700, type: "Nudista",
    description: "Playa nudista de ambiente tranquilo, solo acceso a pie.",
    parking: false, services: [],
    lat: 39.9047, lon: 4.0414,
  },
  {
    name: "Cala Pregonda",
    orientation: "N", municipality: "Es Mercadal",
    length: "500 m", lengthM: 500, type: "Virgen",
    description: "Cala virgen de arena roja. Solo accesible a pie o en barco.",
    parking: false, services: [],
    lat: 40.0625, lon: 3.9736,
  },
  {
    name: "Cala Tirant",
    orientation: "N", municipality: "Es Mercadal",
    length: "600 m", lengthM: 600, type: "Kitesurf",
    description: "Perfecta para kitesurf y windsurf con vientos del sur.",
    parking: true, services: ["Escuela kite", "Parking"],
    lat: 40.0517, lon: 4.0094,
  },
  {
    name: "Arenal d'en Castell",
    orientation: "N", municipality: "Es Mercadal",
    length: "500 m", lengthM: 500, type: "Familiar",
    description: "Bahía en herradura muy protegida, ideal para niños.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 40.0503, lon: 4.0783,
  },
  {
    name: "Cala Mesquida",
    orientation: "NE", municipality: "Maó",
    length: "400 m", lengthM: 400, type: "Surf",
    description: "Playa de oleaje moderado, favorita de surfistas.",
    parking: true, services: ["Parking"],
    lat: 39.9994, lon: 4.2733,
  },
  {
    name: "Punta Prima",
    orientation: "SE", municipality: "Sant Lluís",
    length: "300 m", lengthM: 300, type: "Familiar",
    description: "Vistas al islote de l'Aire y su faro. Zona bien equipada.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 39.8264, lon: 4.2736,
  },
  {
    name: "Binidalí",
    orientation: "E", municipality: "Maó",
    length: "200 m", lengthM: 200, type: "Tranquila",
    description: "Cala tranquila y poco concurrida, muy local.",
    parking: true, services: ["Parking"],
    lat: 39.8772, lon: 4.2889,
  },
  {
    name: "Cala Blanca",
    orientation: "W", municipality: "Ciutadella",
    length: "300 m", lengthM: 300, type: "Familiar",
    description: "Arena blanca y aguas claras cerca de Ciutadella.",
    parking: true, services: ["Chiringuito", "Duchas", "Parking"],
    lat: 39.9811, lon: 3.7983,
  },
  {
    name: "Cala en Blanes",
    orientation: "W", municipality: "Ciutadella",
    length: "400 m", lengthM: 400, type: "Urbana",
    description: "Cala urbana con todos los servicios, perfecta para tardes.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 40.0022, lon: 3.8108,
  },
  {
    name: "Cala Morell",
    orientation: "NW", municipality: "Ciutadella",
    length: "200 m", lengthM: 200, type: "Tranquila",
    description: "Cala escondida de roca volcánica, ambiente muy local.",
    parking: true, services: ["Parking"],
    lat: 40.0594, lon: 3.8483,
  },
  {
    name: "Sa Mesquida",
    orientation: "NE", municipality: "Maó",
    length: "300 m", lengthM: 300, type: "Familiar",
    description: "Playa tranquila cerca del puerto de Maó.",
    parking: true, services: ["Parking"],
    lat: 39.9953, lon: 4.2647,
  },
  {
    name: "Cala Carbó",
    orientation: "SW", municipality: "Ciutadella",
    length: "150 m", lengthM: 150, type: "Tranquila",
    description: "Mini cala de aguas muy calmadas, ideal para snorkel.",
    parking: false, services: [],
    lat: 39.9069, lon: 3.8467,
  },
  {
    name: "Son Parc",
    orientation: "N", municipality: "Es Mercadal",
    length: "600 m", lengthM: 600, type: "Familiar",
    description: "Playa en bahía natural, aguas calmadas con vientos del sur.",
    parking: true, services: ["Chiringuito", "Salvamento", "Parking"],
    lat: 40.0450, lon: 4.1089,
  },
  {
    name: "Cala en Porter",
    orientation: "S", municipality: "Alaior",
    length: "350 m", lengthM: 350, type: "Familiar",
    description: "Espectacular cala entre acantilados con urbanización encima.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 39.8672, lon: 4.1247,
  },
  {
    name: "Es Grau",
    orientation: "NE", municipality: "Maó",
    length: "600 m", lengthM: 600, type: "Familiar",
    description: "Playa dentro del Parc Natural de s'Albufera, aguas poco profundas.",
    parking: true, services: ["Chiringuito", "Parking"],
    lat: 40.0008, lon: 4.2297,
  },
  {
    name: "Platja de Cavalleria",
    orientation: "N", municipality: "Es Mercadal",
    length: "400 m", lengthM: 400, type: "Virgen",
    description: "Playa salvaje en el cabo más septentrional de Menorca.",
    parking: true, services: ["Parking"],
    lat: 40.0833, lon: 3.9897,
  },
  {
    name: "Cala Fonts",
    orientation: "SW", municipality: "Es Castell",
    length: "100 m", lengthM: 100, type: "Urbana",
    description: "Pequeña cala urbana con paseo marítimo y restaurantes.",
    parking: true, services: ["Chiringuito", "Parking"],
    lat: 39.8672, lon: 4.2644,
  },
];
