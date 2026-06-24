export type Orientation = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type Municipality = "Maó" | "Ciutadella" | "Alaior" | "Es Mercadal" | "Ferreries" | "Sant Lluís" | "Es Castell" | "Es Migjorn Gran";
export type BeachType = "Familiar" | "Virgen" | "Nudista" | "Kitesurf" | "Surf" | "Tranquila" | "Urbana";

export interface Beach {
  name: string;
  orientation: Orientation;
  municipality: Municipality;
  length: string;
  lengthM: number;
  type: BeachType;
  description: string;
  descriptionCa: string;
  descriptionEn: string;
  descriptionFr: string;
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
  N: "Tramuntana", NE: "Gregal", E: "Llevant", SE: "Xaloc",
  S: "Migjorn", SW: "Llebeig", W: "Ponent", NW: "Mestral",
};

export const MUNICIPALITIES: Municipality[] = [
  "Maó", "Ciutadella", "Alaior", "Es Mercadal", "Ferreries", "Sant Lluís", "Es Castell", "Es Migjorn Gran"
];

export const BEACH_TYPES: BeachType[] = [
  "Familiar", "Virgen", "Nudista", "Kitesurf", "Surf", "Tranquila", "Urbana"
];

export const ALL_SERVICES = ["Chiringuito", "Salvamento", "Parking", "Duchas", "Accesible", "Kayak", "Escuela kite"];

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const BEACHES: Beach[] = [
  {
    name: "Son Bou",
    orientation: "S", municipality: "Alaior",
    length: "2.5 km", lengthM: 2500, type: "Familiar",
    description: "La playa más larga de Menorca. Arena fina, aguas poco profundas y todos los servicios. Perfecta para familias con niños pequeños.",
    descriptionCa: "La platja més llarga de Menorca. Sorra fina, aigües poc fondes i tots els serveis. Perfecta per a famílies amb nens petits.",
    descriptionEn: "Menorca's longest beach. Fine sand, shallow waters and full services. Perfect for families with young children.",
    descriptionFr: "La plus longue plage de Minorque. Sable fin, eaux peu profondes et tous les services. Parfaite pour les familles.",
    parking: true, services: ["Chiringuito", "Salvamento", "Accesible", "Duchas", "Parking"],
    lat: 39.8724, lon: 3.9876,
  },
  {
    name: "Santo Tomàs",
    orientation: "S", municipality: "Es Migjorn Gran",
    length: "1.2 km", lengthM: 1200, type: "Familiar",
    description: "Playa tranquila de arena fina con urbanización discreta. Aguas limpias y poco oleaje. Muy cómoda y bien equipada.",
    descriptionCa: "Platja tranquil·la de sorra fina amb urbanització discreta. Aigües netes i poc onatge. Molt còmoda i ben equipada.",
    descriptionEn: "Quiet beach with fine sand and discreet development. Clean waters with little wave action. Very comfortable and well-equipped.",
    descriptionFr: "Plage tranquille au sable fin. Eaux propres et peu agitées. Très confortable et bien équipée.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 39.9003, lon: 4.0201,
  },
  {
    name: "Son Saura",
    orientation: "S", municipality: "Ciutadella",
    length: "800 m", lengthM: 800, type: "Virgen",
    description: "Doble cala virgen rodeada de pinos. Aguas cristalinas de color turquesa intenso. Acceso por pista de tierra, sin servicios pero de gran belleza.",
    descriptionCa: "Doble cala verge envoltada de pins. Aigües cristal·lines de color turquesa intens. Accés per pista de terra, sense serveis però de gran bellesa.",
    descriptionEn: "Double wild cove surrounded by pine trees. Crystal-clear, intensely turquoise waters. Accessed by dirt track, no services but stunning beauty.",
    descriptionFr: "Double crique sauvage entourée de pins. Eaux cristallines d'un turquoise intense. Accès par piste de terre, sans services mais d'une grande beauté.",
    parking: true, services: ["Parking"],
    lat: 39.9069, lon: 3.8364,
  },
  {
    name: "Macarella",
    orientation: "S", municipality: "Ciutadella",
    length: "500 m", lengthM: 500, type: "Virgen",
    description: "Una de las calas más espectaculares de Menorca. Acantilados blancos, pinos centenarios y un agua de color esmeralda que quita el aliento.",
    descriptionCa: "Una de les cales més espectaculars de Menorca. Penya-segats blancs, pins centenaris i una aigua de color esmeralda que impressiona.",
    descriptionEn: "One of Menorca's most spectacular coves. White cliffs, ancient pines and breathtaking emerald-coloured water.",
    descriptionFr: "L'une des criques les plus spectaculaires de Minorque. Falaises blanches, pins centenaires et eau couleur émeraude à couper le souffle.",
    parking: false, services: ["Chiringuito"],
    lat: 39.9014, lon: 3.8236,
  },
  {
    name: "Macarelleta",
    orientation: "SW", municipality: "Ciutadella",
    length: "200 m", lengthM: 200, type: "Nudista",
    description: "Pequeña cala nudista gemela de Macarella, a 10 minutos a pie. Muy recogida y tranquila, con el mismo color de agua espectacular.",
    descriptionCa: "Petita cala nudista bessona de Macarella, a 10 minuts a peu. Molt recollida i tranquil·la, amb el mateix color d'aigua espectacular.",
    descriptionEn: "Small nudist cove, twin of Macarella, 10 minutes on foot. Very sheltered and quiet, with the same spectacular water colour.",
    descriptionFr: "Petite crique nudiste jumelle de Macarella, à 10 minutes à pied. Très abritée et tranquille, avec les mêmes eaux spectaculaires.",
    parking: false, services: [],
    lat: 39.8997, lon: 3.8219,
  },
  {
    name: "Cala Galdana",
    orientation: "S", municipality: "Ferreries",
    length: "400 m", lengthM: 400, type: "Familiar",
    description: "Conocida como la 'reina de las calas'. Bahía perfectamente semicircular rodeada de acantilados y pinos. Aguas muy calmadas, ideal para niños.",
    descriptionCa: "Coneguda com la 'reina de les cales'. Badia perfectament semicircular envoltada de penya-segats i pins. Aigües molt calmades, ideal per a nens.",
    descriptionEn: "Known as the 'queen of the coves'. Perfectly semicircular bay surrounded by cliffs and pines. Very calm waters, ideal for children.",
    descriptionFr: "Connue comme la 'reine des criques'. Baie parfaitement semi-circulaire entourée de falaises et de pins. Eaux très calmes, idéale pour les enfants.",
    parking: true, services: ["Chiringuito", "Salvamento", "Kayak", "Duchas", "Parking"],
    lat: 39.9358, lon: 3.9567,
  },
  {
    name: "Cala en Turqueta",
    orientation: "SW", municipality: "Ciutadella",
    length: "300 m", lengthM: 300, type: "Virgen",
    description: "Cala virgen de aguas extraordinariamente transparentes en tonos azul y verde. Rodeada de pinos, con arena blanca y fina. Acceso a pie desde parking.",
    descriptionCa: "Cala verge d'aigües extraordinàriament transparents en tons blau i verd. Envoltada de pins, amb sorra blanca i fina. Accés a peu des del pàrquing.",
    descriptionEn: "Wild cove with extraordinarily clear blue-green waters. Surrounded by pines, with fine white sand. Walking access from parking area.",
    descriptionFr: "Crique sauvage aux eaux extraordinairement transparentes bleu-vert. Entourée de pins, sable blanc et fin. Accès à pied depuis le parking.",
    parking: true, services: ["Parking"],
    lat: 39.9028, lon: 3.8411,
  },
  {
    name: "Binigaus",
    orientation: "S", municipality: "Es Migjorn Gran",
    length: "700 m", lengthM: 700, type: "Nudista",
    description: "Playa nudista larga y salvaje, solo accesible a pie (20 min). Sin servicios pero con una soledad y naturaleza difícil de superar en verano.",
    descriptionCa: "Platja nudista llarga i salvatge, només accessible a peu (20 min). Sense serveis però amb una solitud i natura difícil de superar a l'estiu.",
    descriptionEn: "Long, wild nudist beach, only accessible on foot (20 min). No services but offering unbeatable solitude and nature in summer.",
    descriptionFr: "Longue plage nudiste sauvage, accessible uniquement à pied (20 min). Sans services mais offrant une solitude et une nature incomparables.",
    parking: false, services: [],
    lat: 39.9047, lon: 4.0394,
  },
  {
    name: "Cala Pregonda",
    orientation: "N", municipality: "Es Mercadal",
    length: "500 m", lengthM: 500, type: "Virgen",
    description: "Joya escondida con arena de color rojizo único en Menorca. Rodeada de islotes y dunas. Solo accesible a pie (40 min) o en barco. Paisaje lunar.",
    descriptionCa: "Joia amagada amb sorra de color vermellós únic a Menorca. Envoltada d'illots i dunes. Només accessible a peu (40 min) o en barca. Paisatge lunar.",
    descriptionEn: "Hidden gem with uniquely reddish sand. Surrounded by islets and dunes. Only accessible on foot (40 min) or by boat. Lunar landscape.",
    descriptionFr: "Joyau caché au sable rougeâtre unique à Minorque. Entourée d'îlots et de dunes. Accessible uniquement à pied (40 min) ou en bateau.",
    parking: false, services: [],
    lat: 40.0633, lon: 3.9736,
  },
  {
    name: "Cala Tirant",
    orientation: "N", municipality: "Es Mercadal",
    length: "600 m", lengthM: 600, type: "Kitesurf",
    description: "Playa favorita de los amantes del kitesurf y windsurf gracias a sus vientos constantes. Arena clara y aguas poco profundas. Ambiente deportivo.",
    descriptionCa: "Platja favorita dels amants del kitesurf i windsurf gràcies als seus vents constants. Sorra clara i aigües poc fondes. Ambient esportiu.",
    descriptionEn: "Favourite beach for kitesurf and windsurf lovers thanks to its constant winds. Light sand and shallow waters. Sporty atmosphere.",
    descriptionFr: "Plage préférée des amateurs de kitesurf et windsurf grâce à ses vents constants. Sable clair et eaux peu profondes. Ambiance sportive.",
    parking: true, services: ["Escuela kite", "Parking"],
    lat: 40.0519, lon: 4.0092,
  },
  {
    name: "Arenal d'en Castell",
    orientation: "N", municipality: "Es Mercadal",
    length: "500 m", lengthM: 500, type: "Familiar",
    description: "Bahía en herradura perfectamente cerrada que la hace muy segura. Aguas calmadas y poco profundas. Bien equipada con todos los servicios.",
    descriptionCa: "Badia en ferradura perfectament tancada que la fa molt segura. Aigües calmades i poc fondes. Ben equipada amb tots els serveis.",
    descriptionEn: "Perfectly enclosed horseshoe bay, making it very safe. Calm, shallow waters. Well equipped with all services.",
    descriptionFr: "Baie en fer à cheval parfaitement fermée, très sécurisante. Eaux calmes et peu profondes. Bien équipée avec tous les services.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 40.0506, lon: 4.0789,
  },
  {
    name: "Cala Mesquida",
    orientation: "NE", municipality: "Maó",
    length: "400 m", lengthM: 400, type: "Surf",
    description: "Playa abierta con oleaje frecuente, favorita de surfistas y bodyboarders. Arena dorada, dunes y un entorno natural bien conservado.",
    descriptionCa: "Platja oberta amb onatge freqüent, favorita de surfistes i bodyboarders. Sorra daurada, dunes i un entorn natural ben conservat.",
    descriptionEn: "Open beach with frequent waves, favourite of surfers and bodyboarders. Golden sand, dunes and a well-preserved natural setting.",
    descriptionFr: "Plage ouverte avec des vagues fréquentes, préférée des surfeurs. Sable doré, dunes et un cadre naturel bien préservé.",
    parking: true, services: ["Parking"],
    lat: 39.9997, lon: 4.2725,
  },
  {
    name: "Punta Prima",
    orientation: "SE", municipality: "Sant Lluís",
    length: "300 m", lengthM: 300, type: "Familiar",
    description: "Playa con vistas privilegiadas al islote de l'Aire y su faro. Aguas cristalinas y arena fina. Muy bien equipada y fácil de acceder.",
    descriptionCa: "Platja amb vistes privilegiades a l'illot de l'Aire i el seu far. Aigües cristal·lines i sorra fina. Molt ben equipada i fàcil d'accedir.",
    descriptionEn: "Beach with privileged views of the Aire islet and its lighthouse. Crystal-clear waters and fine sand. Very well equipped and easy to reach.",
    descriptionFr: "Plage avec vue privilégiée sur l'îlot de l'Aire et son phare. Eaux cristallines et sable fin. Très bien équipée et facile d'accès.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 39.8258, lon: 4.2742,
  },
  {
    name: "Binidalí",
    orientation: "E", municipality: "Maó",
    length: "200 m", lengthM: 200, type: "Tranquila",
    description: "Pequeña cala tranquila y poco frecuentada. Muy local y auténtica. Aguas limpias y ambiente relajado, sin las aglomeraciones del verano.",
    descriptionCa: "Petita cala tranquil·la i poc freqüentada. Molt local i autèntica. Aigües netes i ambient relaxat, sense les aglomeracions de l'estiu.",
    descriptionEn: "Small, quiet and rarely crowded cove. Very local and authentic. Clean waters and relaxed atmosphere, without summer crowds.",
    descriptionFr: "Petite crique tranquille et peu fréquentée. Très locale et authentique. Eaux propres et ambiance détendue, sans les foules estivales.",
    parking: true, services: ["Parking"],
    lat: 39.8775, lon: 4.2886,
  },
  {
    name: "Cala Blanca",
    orientation: "W", municipality: "Ciutadella",
    length: "300 m", lengthM: 300, type: "Familiar",
    description: "Arena blanca y aguas de color azul intenso, cerca de Ciutadella. Muy popular entre los locales por las tardes. Atardeceres espectaculares.",
    descriptionCa: "Sorra blanca i aigües de color blau intens, prop de Ciutadella. Molt popular entre els locals per les tardes. Capvespres espectaculars.",
    descriptionEn: "White sand and intensely blue water, close to Ciutadella. Very popular with locals in the evenings. Spectacular sunsets.",
    descriptionFr: "Sable blanc et eau d'un bleu intense, près de Ciutadella. Très populaire parmi les locaux le soir. Couchers de soleil spectaculaires.",
    parking: true, services: ["Chiringuito", "Duchas", "Parking"],
    lat: 39.9811, lon: 3.7986,
  },
  {
    name: "Cala en Blanes",
    orientation: "W", municipality: "Ciutadella",
    length: "400 m", lengthM: 400, type: "Urbana",
    description: "Cala urbana bien equipada con todos los servicios a pie de playa. Muy práctica, con paseo marítimo y restaurantes. Perfecta para tarde-noche.",
    descriptionCa: "Cala urbana ben equipada amb tots els serveis a peu de platja. Molt pràctica, amb passeig marítim i restaurants. Perfecta per a tarda-nit.",
    descriptionEn: "Well-equipped urban cove with all services at the beach. Very practical, with promenade and restaurants. Perfect for evening visits.",
    descriptionFr: "Crique urbaine bien équipée avec tous les services sur la plage. Très pratique, avec promenade et restaurants. Parfaite en soirée.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 40.0022, lon: 3.8111,
  },
  {
    name: "Cala Morell",
    orientation: "NW", municipality: "Ciutadella",
    length: "200 m", lengthM: 200, type: "Tranquila",
    description: "Cala escondida de roca calcárea blanca con agua de color turquesa. Ambiente muy tranquilo y local. Junto a un yacimiento prehistórico.",
    descriptionCa: "Cala amagada de roca calcària blanca amb aigua de color turquesa. Ambient molt tranquil i local. Al costat d'un jaciment prehistòric.",
    descriptionEn: "Hidden cove with white limestone rock and turquoise water. Very quiet and local atmosphere. Next to a prehistoric site.",
    descriptionFr: "Crique cachée avec roches calcaires blanches et eau turquoise. Ambiance très tranquille et locale. À côté d'un site préhistorique.",
    parking: true, services: ["Parking"],
    lat: 40.0597, lon: 3.8481,
  },
  {
    name: "Sa Mesquida",
    orientation: "NE", municipality: "Maó",
    length: "300 m", lengthM: 300, type: "Familiar",
    description: "Playa cercana al puerto de Maó, con aguas tranquilas y arena dorada. Bien valorada por los residentes locales. Fácil acceso y aparcamiento.",
    descriptionCa: "Platja propera al port de Maó, amb aigües tranquil·les i sorra daurada. Ben valorada pels residents locals. Fàcil accés i aparcament.",
    descriptionEn: "Beach near the port of Maó, with calm waters and golden sand. Highly rated by local residents. Easy access and parking.",
    descriptionFr: "Plage près du port de Maó, avec des eaux calmes et du sable doré. Très appréciée des résidents locaux. Accès et stationnement faciles.",
    parking: true, services: ["Parking"],
    lat: 39.9953, lon: 4.2650,
  },
  {
    name: "Cala Carbó",
    orientation: "SW", municipality: "Ciutadella",
    length: "150 m", lengthM: 150, type: "Tranquila",
    description: "Mini cala de aguas extraordinariamente calmadas, ideal para snorkel. Muy recogida entre acantilados. Poca gente incluso en verano.",
    descriptionCa: "Mini cala d'aigües extraordinàriament calmades, ideal per fer snorkel. Molt recollida entre penya-segats. Poca gent fins i tot a l'estiu.",
    descriptionEn: "Mini cove with extraordinarily calm waters, ideal for snorkelling. Very sheltered between cliffs. Few people even in summer.",
    descriptionFr: "Mini crique aux eaux extraordinairement calmes, idéale pour le snorkeling. Très abritée entre les falaises. Peu de monde même en été.",
    parking: false, services: [],
    lat: 39.9075, lon: 3.8469,
  },
  {
    name: "Son Parc",
    orientation: "N", municipality: "Es Mercadal",
    length: "600 m", lengthM: 600, type: "Familiar",
    description: "Amplia playa en bahía natural con aguas calmadas. Rodeada de pinos y con dunas. Muy tranquila, ideal para familias que buscan espacio.",
    descriptionCa: "Àmplia platja en badia natural amb aigües calmades. Envoltada de pins i amb dunes. Molt tranquil·la, ideal per a famílies que busquen espai.",
    descriptionEn: "Wide beach in a natural bay with calm waters. Surrounded by pines and with dunes. Very quiet, ideal for families looking for space.",
    descriptionFr: "Large plage dans une baie naturelle aux eaux calmes. Entourée de pins et de dunes. Très tranquille, idéale pour les familles.",
    parking: true, services: ["Chiringuito", "Salvamento", "Parking"],
    lat: 40.0453, lon: 4.1092,
  },
  {
    name: "Cala en Porter",
    orientation: "S", municipality: "Alaior",
    length: "350 m", lengthM: 350, type: "Familiar",
    description: "Espectacular cala entre acantilados de 40 metros de altura. Arena fina y aguas de colores increíbles. Urbanización encima del acantilado con vistas únicas.",
    descriptionCa: "Espectacular cala entre penya-segats de 40 metres d'alçada. Sorra fina i aigües de colors increïbles. Urbanització a sobre del penya-segat amb vistes úniques.",
    descriptionEn: "Spectacular cove between 40-metre-high cliffs. Fine sand and incredible water colours. Development above the cliff with unique views.",
    descriptionFr: "Crique spectaculaire entre des falaises de 40 mètres. Sable fin et couleurs d'eau incroyables. Urbanisation au-dessus de la falaise avec des vues uniques.",
    parking: true, services: ["Chiringuito", "Salvamento", "Duchas", "Parking"],
    lat: 39.8675, lon: 4.1253,
  },
  {
    name: "Es Grau",
    orientation: "NE", municipality: "Maó",
    length: "600 m", lengthM: 600, type: "Familiar",
    description: "Playa dentro del Parc Natural de s'Albufera des Grau. Aguas muy poco profundas y calmadas, perfectas para niños. Entorno natural protegido único.",
    descriptionCa: "Platja dins del Parc Natural de s'Albufera des Grau. Aigües molt poc fondes i calmades, perfectes per a nens. Entorn natural protegit únic.",
    descriptionEn: "Beach within the s'Albufera des Grau Natural Park. Very shallow, calm waters, perfect for children. Unique protected natural setting.",
    descriptionFr: "Plage dans le Parc Naturel de s'Albufera des Grau. Eaux très peu profondes et calmes, parfaites pour les enfants. Cadre naturel protégé unique.",
    parking: true, services: ["Chiringuito", "Parking"],
    lat: 40.0011, lon: 4.2300,
  },
  {
    name: "Platja de Cavalleria",
    orientation: "N", municipality: "Es Mercadal",
    length: "400 m", lengthM: 400, type: "Virgen",
    description: "Playa salvaje en el extremo norte de Menorca, junto al faro de Cavalleria. Paisaje espectacular con oleaje cuando hay viento sur. Arena dorada.",
    descriptionCa: "Platja salvatge a l'extrem nord de Menorca, al costat del far de Cavalleria. Paisatge espectacular amb onatge quan hi ha vent del sud. Sorra daurada.",
    descriptionEn: "Wild beach at the northern tip of Menorca, next to the Cavalleria lighthouse. Spectacular landscape with waves when south wind blows. Golden sand.",
    descriptionFr: "Plage sauvage à la pointe nord de Minorque, près du phare de Cavalleria. Paysage spectaculaire avec des vagues par vent du sud. Sable doré.",
    parking: true, services: ["Parking"],
    lat: 40.0839, lon: 3.9900,
  },
  {
    name: "Cala Fonts",
    orientation: "SW", municipality: "Es Castell",
    length: "100 m", lengthM: 100, type: "Urbana",
    description: "Pequeña cala urbana en el puerto de Es Castell. Rodeada de restaurantes y bares con terraza. Perfecta para combinar baño y gastronomía.",
    descriptionCa: "Petita cala urbana al port d'Es Castell. Envoltada de restaurants i bars amb terrassa. Perfecta per combinar bany i gastronomia.",
    descriptionEn: "Small urban cove in Es Castell harbour. Surrounded by restaurants and bars with terraces. Perfect for combining swimming and dining.",
    descriptionFr: "Petite crique urbaine dans le port d'Es Castell. Entourée de restaurants et de bars en terrasse. Parfaite pour combiner baignade et gastronomie.",
    parking: true, services: ["Chiringuito", "Parking"],
    lat: 39.8669, lon: 4.2647,
  },
];
