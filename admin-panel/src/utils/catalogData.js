import { adminApi } from '../services/api';

export const DEFAULT_PRODUCTS = [
  {
    id: 'gem-1',
    name: 'Natural Ceylon Yellow Sapphire (Pukhraj)',
    category: 'Gemstones',
    price: 8500,
    originalPrice: 12500,
    rating: 4.9,
    reviews: 142,
    planet: 'Jupiter (Guru)',
    weight: '4.25 Carats',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80',
    description: '100% untreated Ceylon Yellow Sapphire, energized by Vedic Brahmins for prosperity, wisdom, and marriage harmony.'
  },
  {
    id: 'gem-2',
    name: 'Certified Burmese Ruby (Manikya)',
    category: 'Gemstones',
    price: 6800,
    originalPrice: 9500,
    rating: 4.8,
    reviews: 98,
    planet: 'Sun (Surya)',
    weight: '3.5 Carats',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    description: 'Vibrant Pigeon Blood Red Ruby for leadership, vitality, government career success, and royal confidence.'
  },
  {
    id: 'gem-3',
    name: 'Italian Red Coral (Moonga)',
    category: 'Gemstones',
    price: 4200,
    originalPrice: 6000,
    rating: 4.9,
    reviews: 187,
    planet: 'Mars (Mangal)',
    weight: '6.15 Carats',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    description: 'Authentic triangular Italian Moonga for pacifying Manglik Dosha, building physical vitality and courage.'
  },
  {
    id: 'rud-1',
    name: 'Original 5-Mukhi Nepali Rudraksha Mala (108+1)',
    category: 'Rudraksha',
    price: 1499,
    originalPrice: 2499,
    rating: 5.0,
    reviews: 320,
    planet: 'Lord Shiva',
    weight: 'Selected 8mm Beads',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    description: 'Siddha energized Nepali 5-Mukhi beads strung in holy silk thread. Ideal for daily japa, peace of mind, and BP balance.'
  },
  {
    id: 'rud-2',
    name: 'Rare 1-Mukhi Half-Moon (Kaju) Rudraksha',
    category: 'Rudraksha',
    price: 5999,
    originalPrice: 8999,
    rating: 4.9,
    reviews: 76,
    planet: 'Supreme Consciousness',
    weight: 'Certified Collector Grade',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    description: 'The most sacred bead ruled by Lord Shiva Himself. Grants heightened intuition, super-consciousness, and liberation.'
  },
  {
    id: 'yan-1',
    name: '24K Gold-Plated Meru Shree Yantra (Solid Brass)',
    category: 'Yantras',
    price: 3499,
    originalPrice: 5200,
    rating: 5.0,
    reviews: 215,
    planet: 'Sri Vidya / Tripura Sundari',
    weight: '850 grams',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    description: '3D geometrical pyramid casting of ancient Sri Chakra according to Agamic scriptures. Bestows Vastu dosha correction.'
  }
];

export const DEFAULT_PUJAS = [
  {
    id: 'puja-1',
    title: 'Mahakaleshwar Kaal Sarp & Shani Shanti Mahapuja',
    temple: 'Shri Mahakaleshwar Jyotirlinga, Ujjain (M.P.)',
    benefits: 'Nullifies malefic effects of Rahu-Ketu, Kaal Sarp Dosha, and delays in career or marriage.',
    price: 3100,
    originalPrice: 5100,
    duration: '2 Hours Live Ritual',
    pandits: '5 Vedic Acharyas',
    date: 'Next Auspicious Amavasya / Somwar',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    tags: ['Kaal Sarp Dosha', 'Shani Sade Sati', 'Jyotirlinga']
  },
  {
    id: 'puja-2',
    title: 'Maa Baglamukhi Shatru Vinashak & Vijay Havan',
    temple: 'Maa Baglamukhi Temple, Nalkheda (M.P.)',
    benefits: 'Overcomes legal court disputes, hidden adversaries, political hurdles, and financial blockages.',
    price: 4500,
    originalPrice: 7500,
    duration: '3.5 Hours Tantrik & Vedic Havan',
    pandits: '7 Siddh Brahamans',
    date: 'Next Shukla Paksha Ashtami / Chaturdashi',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    tags: ['Legal & Court Victory', 'Shatru Shanti', 'Protection']
  },
  {
    id: 'puja-3',
    title: 'Mangalnath Bhaat Puja for Manglik Dosha Nivaran',
    temple: 'Shri Mangalnath Mandir, Ujjain (Birthplace of Mars)',
    benefits: 'Removes delays and obstacles in marriage, cleanses extreme Angarak & Mangal Doshas in kundali.',
    price: 2700,
    originalPrice: 4200,
    duration: '1.5 Hours Rice Abhishek',
    pandits: '3 Vedic Acharyas',
    date: 'Every Tuesday (Mangalwar)',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    tags: ['Manglik Dosha', 'Marriage Delays', 'Relationship Harmony']
  }
];

// Fetch live products catalog
export const loadProductsFromDb = async () => {
  try {
    const res = await adminApi.getCmsPage('astro-shop-products');
    if (res?.data?.content) {
      const parsed = typeof res.data.content === 'string' ? JSON.parse(res.data.content) : res.data.content;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load products CMS page, returning defaults', err.message);
  }
  return DEFAULT_PRODUCTS;
};

// Save products catalog
export const saveProductsToDb = async (productsList) => {
  return await adminApi.upsertCmsPage({
    slug: 'astro-shop-products',
    title: 'Astro Shop Products Catalog',
    metaDescription: 'Dynamic catalog of energized gemstones, rudraksha, and yantras.',
    content: JSON.stringify(productsList)
  });
};

// Fetch live pujas catalog
export const loadPujasFromDb = async () => {
  try {
    const res = await adminApi.getCmsPage('temple-pujas');
    if (res?.data?.content) {
      const parsed = typeof res.data.content === 'string' ? JSON.parse(res.data.content) : res.data.content;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load pujas CMS page, returning defaults', err.message);
  }
  return DEFAULT_PUJAS;
};

// Save pujas catalog
export const savePujasToDb = async (pujasList) => {
  return await adminApi.upsertCmsPage({
    slug: 'temple-pujas',
    title: 'Temple Pujas Catalog',
    metaDescription: 'Dynamic catalog of consecrated Jyotirlinga & Shakti Peeth temple pujas.',
    content: JSON.stringify(pujasList)
  });
};
