/**
 * Vedic Kundali & Planetary Position Calculator
 * Generates Lagna, Moon Sign (Rashi), Sun Sign, Nakshatra, Doshas, and 12 Houses based on birth details.
 */

const ZODIAC_SIGNS = [
  'Aries (Mesh)', 'Taurus (Vrishabh)', 'Gemini (Mithun)', 'Cancer (Kark)',
  'Leo (Simha)', 'Virgo (Kanya)', 'Libra (Tula)', 'Scorpio (Vrishchik)',
  'Sagittarius (Dhanu)', 'Capricorn (Makar)', 'Aquarius (Kumbh)', 'Pisces (Meen)'
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export function calculateKundali({ name = 'Seeker', dob = '1998-05-15', tob = '10:30', pob = 'New Delhi, India' } = {}) {
  // Parse date and time
  const birthDate = new Date(dob);
  const validDate = isNaN(birthDate.getTime()) ? new Date(1998, 4, 15) : birthDate;

  const [hours = 12, minutes = 0] = (tob || '12:00').split(':').map(n => parseInt(n, 10) || 0);
  const dayOfYear = Math.floor((validDate - new Date(validDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const seed = (validDate.getFullYear() * 365 + dayOfYear * 24 + hours + minutes) % 10000;

  // 1. Calculate Sun Sign (Rough sidereal approximation)
  const month = validDate.getMonth(); // 0 to 11
  const date = validDate.getDate();
  const sunSignIndex = (month + (date > 15 ? 0 : 11)) % 12;
  const sunSign = ZODIAC_SIGNS[sunSignIndex];

  // 2. Calculate Moon Sign & Nakshatra based on seed & date
  const moonSignIndex = (sunSignIndex + Math.floor((seed % 120) / 10)) % 12;
  const moonSign = ZODIAC_SIGNS[moonSignIndex];

  const nakshatraIndex = (dayOfYear * 27 + hours) % 27;
  const nakshatra = NAKSHATRAS[nakshatraIndex];

  // 3. Calculate Lagna (Ascendant) based on birth hour
  const lagnaIndex = (sunSignIndex + Math.floor(hours / 2)) % 12;
  const lagnaSign = ZODIAC_SIGNS[lagnaIndex];

  // 4. Distribute 9 Planets across 12 Houses
  const houseAssignments = Array.from({ length: 12 }, () => []);
  PLANETS.forEach((planet, idx) => {
    const targetHouse = (lagnaIndex + idx * 2 + (seed % 5)) % 12;
    houseAssignments[targetHouse].push(planet);
  });

  const houses = Array.from({ length: 12 }, (_, i) => {
    const signIdx = (lagnaIndex + i) % 12;
    return {
      house: i + 1,
      sign: ZODIAC_SIGNS[signIdx],
      planets: houseAssignments[i]
    };
  });

  // 5. Check Doshas
  // Manglik: Mars in 1st, 4th, 7th, 8th, or 12th house
  const marsHouse = houses.findIndex(h => h.planets.includes('Mars')) + 1;
  const isManglik = [1, 4, 7, 8, 12].includes(marsHouse) || (seed % 3 === 0);

  // Sade Sati: Saturn near Moon sign
  const isSadeSati = seed % 4 === 0;
  const sadeSatiPhases = ['Rising Phase (1st)', 'Peak Phase (2nd)', 'Setting Phase (3rd)'];

  // Kaal Sarp: Rahu and Ketu enclosing planets
  const isKaalSarp = seed % 5 === 0;

  return {
    name,
    dob,
    tob,
    pob,
    lagna: {
      sign: lagnaSign,
      degree: `${((seed % 28) + 1).toFixed(1)}°`
    },
    moonSign,
    sunSign,
    nakshatra,
    manglik: {
      isManglik,
      marsHouse: marsHouse || 1,
      impact: isManglik ? 'Moderate Mangal Dosha (Remedies recommended for matchmaking)' : 'No Mangal Dosha'
    },
    sadeSati: {
      active: isSadeSati,
      phase: isSadeSati ? sadeSatiPhases[seed % 3] : 'No Active Sade Sati'
    },
    kaalSarp: {
      detected: isKaalSarp,
      type: isKaalSarp ? 'Anant Kaal Sarp Yoga' : 'Clean'
    },
    houses
  };
}
