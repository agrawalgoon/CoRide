// Comprehensive high-precision Landmark & Hotspot Dataset for Chhatrapati Sambhajinagar (Aurangabad)
// Used for instant, zero-latency local search and map pinning across CoRide.

export const AURANGABAD_LANDMARKS = [
  // --- Core Colleges & Universities ---
  {
    id: 'mgm-university',
    name: 'MGM University / JNEC',
    category: 'College',
    address: 'MGM Campus, N-6, CIDCO, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra 431003',
    latitude: 19.8735,
    longitude: 75.3621,
    keywords: ['mgm', 'jnec', 'cidco', 'n-6', 'university', 'college', 'engineering']
  },
  {
    id: 'deogiri-college',
    name: 'Deogiri College / DIEMS',
    category: 'College',
    address: 'Station Road, Near Railway Station, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra 431005',
    latitude: 19.8710,
    longitude: 75.3195,
    keywords: ['deogiri', 'diems', 'station road', 'college', 'engineering', 'dietms']
  },
  {
    id: 'geca-college',
    name: 'Government College of Engineering, Aurangabad (GECA)',
    category: 'College',
    address: 'Station Road, Osmanpura, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra 431005',
    latitude: 19.8659,
    longitude: 75.3238,
    keywords: ['geca', 'government engineering', 'osmanpura', 'station road', 'college']
  },
  {
    id: 'mit-college',
    name: 'MIT College (Maharashtra Institute of Technology)',
    category: 'College',
    address: 'Beed Bypass Road, Satara Parisar, Chhatrapati Sambhajinagar, Maharashtra 431010',
    latitude: 19.8375,
    longitude: 75.3242,
    keywords: ['mit', 'beed bypass', 'satara parisar', 'engineering', 'college']
  },
  {
    id: 'bamu-university',
    name: 'Dr. Babasaheb Ambedkar Marathwada University (BAMU)',
    category: 'University',
    address: 'University Campus, Near Soneri Mahal, Chhatrapati Sambhajinagar, Maharashtra 431004',
    latitude: 19.9015,
    longitude: 75.3090,
    keywords: ['bamu', 'dr bamu', 'university', 'soneri mahal', 'campus']
  },
  {
    id: 'pes-college',
    name: 'PES College of Engineering',
    category: 'College',
    address: 'Nagsenvan, Near Panchakki, Chhatrapati Sambhajinagar, Maharashtra 431002',
    latitude: 19.8972,
    longitude: 75.3168,
    keywords: ['pes', 'pescoe', 'nagsenvan', 'panchakki', 'college']
  },
  {
    id: 'csmss-college',
    name: 'CSMSS Chh. Shahu College of Engineering',
    category: 'College',
    address: 'Kanchanwadi, Paithan Road, Chhatrapati Sambhajinagar, Maharashtra 431011',
    latitude: 19.8290,
    longitude: 75.2975,
    keywords: ['csmss', 'shahu', 'kanchanwadi', 'paithan road', 'engineering']
  },
  {
    id: 'govt-polytechnic',
    name: 'Government Polytechnic Aurangabad',
    category: 'College',
    address: 'Samarth Nagar, Chhatrapati Sambhajinagar, Maharashtra 431001',
    latitude: 19.8778,
    longitude: 75.3292,
    keywords: ['govt polytechnic', 'samarth nagar', 'polytechnic']
  },

  // --- Major Transit Points & Chowks ---
  {
    id: 'railway-station',
    name: 'Aurangabad Railway Station',
    category: 'Transit',
    address: 'Station Road, Rachanakar Colony, Chhatrapati Sambhajinagar, Maharashtra 431005',
    latitude: 19.8665,
    longitude: 75.3142,
    keywords: ['railway', 'station', 'train', 'station road']
  },
  {
    id: 'cbs-bus-stand',
    name: 'Central Bus Stand (CBS)',
    category: 'Transit',
    address: 'Nirala Bazar Road, Mill Corner, Chhatrapati Sambhajinagar, Maharashtra 431001',
    latitude: 19.8828,
    longitude: 75.3275,
    keywords: ['cbs', 'bus stand', 'central bus stand', 'st bus']
  },
  {
    id: 'cidco-bus-stand',
    name: 'CIDCO Bus Stand',
    category: 'Transit',
    address: 'Jalna Road, CIDCO, Chhatrapati Sambhajinagar, Maharashtra 431003',
    latitude: 19.8772,
    longitude: 75.3685,
    keywords: ['cidco bus stand', 'cidco', 'jalna road', 'bus stand']
  },
  {
    id: 'kranti-chowk',
    name: 'Kranti Chowk',
    category: 'Chowk',
    address: 'Kranti Chowk, Jalna Road / Station Road, Chhatrapati Sambhajinagar 431001',
    latitude: 19.8732,
    longitude: 75.3271,
    keywords: ['kranti chowk', 'kranti', 'chowk', 'station road', 'jalna road']
  },
  {
    id: 'baba-petrol-pump',
    name: 'Baba Petrol Pump Chowk',
    category: 'Chowk',
    address: 'Jalna Road, Near Mahaveer Chowk, Chhatrapati Sambhajinagar 431005',
    latitude: 19.8722,
    longitude: 75.3182,
    keywords: ['baba petrol pump', 'jalna road', 'chowk', 'petrol pump']
  },
  {
    id: 'seven-hills',
    name: 'Seven Hills Chowk',
    category: 'Chowk',
    address: 'Jalna Road, CIDCO, Chhatrapati Sambhajinagar 431003',
    latitude: 19.8748,
    longitude: 75.3536,
    keywords: ['seven hills', '7 hills', 'jalna road', 'cidco']
  },
  {
    id: 'akashwani-chowk',
    name: 'Akashwani Chowk',
    category: 'Chowk',
    address: 'Jalna Road, Near All India Radio, Chhatrapati Sambhajinagar 431005',
    latitude: 19.8740,
    longitude: 75.3425,
    keywords: ['akashwani', 'all india radio', 'jalna road', 'chowk']
  },
  {
    id: 'tv-center-chowk',
    name: 'TV Center Chowk',
    category: 'Chowk',
    address: 'HUDCO, N-9 / N-11, Chhatrapati Sambhajinagar, Maharashtra 431003',
    latitude: 19.9075,
    longitude: 75.3556,
    keywords: ['tv center', 'hudco', 'n-9', 'n-11', 'chowk']
  },
  {
    id: 'airport-aurangabad',
    name: 'Chhatrapati Sambhajinagar Airport (Chikkalthana)',
    category: 'Transit',
    address: 'Jalna Road, Chikkalthana, Chhatrapati Sambhajinagar 431006',
    latitude: 19.8631,
    longitude: 75.3981,
    keywords: ['airport', 'flight', 'chikkalthana', 'jalna road', 'aerodrome']
  },

  // --- Shopping & Commercial Hotspots ---
  {
    id: 'prozone-mall',
    name: 'Prozone Mall',
    category: 'Mall',
    address: 'API Corner, MIDC Industrial Area, Chikkalthana, Chhatrapati Sambhajinagar 431006',
    latitude: 19.8725,
    longitude: 75.3789,
    keywords: ['prozone', 'prozone mall', 'api corner', 'mall', 'cinema', 'shopping']
  },
  {
    id: 'cannaught-place',
    name: 'Cannaught Place (CIDCO)',
    category: 'Commercial',
    address: 'CIDCO Cannaught, N-5, Chhatrapati Sambhajinagar, Maharashtra 431003',
    latitude: 19.8805,
    longitude: 75.3562,
    keywords: ['cannaught', 'cannaught place', 'cidco', 'n-5', 'market']
  },
  {
    id: 'nirala-bazar',
    name: 'Nirala Bazar',
    category: 'Commercial',
    address: 'Samarth Nagar, Chhatrapati Sambhajinagar, Maharashtra 431001',
    latitude: 19.8821,
    longitude: 75.3242,
    keywords: ['nirala bazar', 'samarth nagar', 'shopping', 'market']
  },
  {
    id: 'osmanpura-market',
    name: 'Osmanpura Circle / Market',
    category: 'Commercial',
    address: 'Osmanpura, Near GECA, Chhatrapati Sambhajinagar 431005',
    latitude: 19.8682,
    longitude: 75.3268,
    keywords: ['osmanpura', 'market', 'circle', 'osmanpura chowk']
  },
  {
    id: 'garkheda-mandir',
    name: 'Gajanan Maharaj Mandir (Garkheda)',
    category: 'Landmark',
    address: 'Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra 431009',
    latitude: 19.8592,
    longitude: 75.3524,
    keywords: ['gajanan maharaj mandir', 'garkheda', 'temple', 'parisar']
  },
  {
    id: 'waluj-midc',
    name: 'Waluj MIDC / Kamgar Chowk',
    category: 'Industrial',
    address: 'Waluj Industrial Area, Chhatrapati Sambhajinagar, Maharashtra 431136',
    latitude: 19.8450,
    longitude: 75.2340,
    keywords: ['waluj', 'midc', 'kamgar chowk', 'industrial area', 'bajaj']
  },
  {
    id: 'shendra-auric',
    name: 'Shendra MIDC / AURIC City',
    category: 'Industrial',
    address: 'Shendra DMIC, Jalna Road, Chhatrapati Sambhajinagar 431154',
    latitude: 19.8850,
    longitude: 75.4850,
    keywords: ['shendra', 'auric', 'dmic', 'industrial', 'jalna road']
  }
];

/**
 * Fast search helper that filters landmarks based on user query.
 */
export function searchLocalLandmarks(query, limit = 6) {
  if (!query || !query.trim()) return [];
  const clean = query.trim().toLowerCase();

  return AURANGABAD_LANDMARKS.filter((item) => {
    if (item.name.toLowerCase().includes(clean)) return true;
    if (item.address.toLowerCase().includes(clean)) return true;
    if (item.category.toLowerCase().includes(clean)) return true;
    return item.keywords.some((k) => k.includes(clean) || clean.includes(k));
  }).slice(0, limit);
}
