// data/emergencyContacts.js (FILL THIS WITH REAL NUMBERS)
export const LGAData = {
  Shiroro: {
    center: { lat: 10.0, lng: 6.8 }, // Approximate center – update with real if needed
    subAreas: {
      Kuta: ['+2348012345678', '+2348023456789'], // 2 police
      General: ['+2348034567890', '+2348045678901', '+2348056789012'], // 3 vigilantes
    },
  },
  Rafi: {
    center: { lat: 10.2, lng: 6.0 },
    subAreas: {
      General: ['+2348067890123', '+2348078901234'],
    },
  },
  Munya: {
    center: { lat: 10.1, lng: 6.5 },
    subAreas: {
      General: ['+2348089012345'],
    },
  },
  Kontagora: {
    center: { lat: 10.4, lng: 5.47 },
    subAreas: {
      General: ['+2348090123456', '+2348011122233', '+2348022233344', '+2348033344455', '+2348044455566'],
    },
  },
  // Add all 25 LGAs here (Agaie, Agwara, Bida, etc.) with their approx centers (look up on Google Maps)
  // Example: Agaie: { center: { lat: 9.0, lng: 5.75 }, subAreas: { ... } }
  // You can add up to 300+ – just nest under subAreas
};

export function findNearestLGA(lat, lng) {
  let nearest = { lga: 'default', dist: Infinity };
  Object.keys(LGAData).forEach(lga => {
    const center = LGAData[lga].center;
    const dist = Math.sqrt((lat - center.lat)**2 + (lng - center.lng)**2);
    if (dist < nearest.dist) nearest = { lga, dist };
  });
  return nearest.lga;
}

export function getContactsForLGA(lga) {
  const areas = LGAData[lga] ? Object.values(LGAData[lga].subAreas).flat() : [];
  return areas.length ? areas : LGAData.default || ['112'];
}