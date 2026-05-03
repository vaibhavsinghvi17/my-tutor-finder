// Country → State → City data (curated; users can also type their own).
// Focused on India + a few common countries.

export interface Country { code: string; name: string; }

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SG", name: "Singapore" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

// state -> cities
export const STATES_BY_COUNTRY: Record<string, Record<string, string[]>> = {
  India: {
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
    "Delhi": ["New Delhi", "Delhi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
    "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
    "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Kanpur", "Varanasi", "Agra"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat"],
    "Punjab": ["Chandigarh", "Ludhiana", "Amritsar"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur"],
    "Goa": ["Panaji", "Margao"],
  },
  "United States": {
    "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose"],
    "New York": ["New York City", "Buffalo", "Albany"],
    "Texas": ["Austin", "Houston", "Dallas", "San Antonio"],
    "Washington": ["Seattle", "Bellevue", "Spokane"],
    "Illinois": ["Chicago", "Naperville"],
    "Florida": ["Miami", "Orlando", "Tampa"],
  },
  "United Kingdom": {
    "England": ["London", "Manchester", "Birmingham", "Bristol", "Leeds"],
    "Scotland": ["Edinburgh", "Glasgow"],
    "Wales": ["Cardiff", "Swansea"],
  },
  "United Arab Emirates": {
    "Dubai": ["Dubai"],
    "Abu Dhabi": ["Abu Dhabi", "Al Ain"],
    "Sharjah": ["Sharjah"],
  },
  "Singapore": { "Singapore": ["Singapore"] },
  "Canada": {
    "Ontario": ["Toronto", "Ottawa", "Mississauga"],
    "British Columbia": ["Vancouver", "Victoria"],
    "Quebec": ["Montreal", "Quebec City"],
  },
  "Australia": {
    "New South Wales": ["Sydney", "Newcastle"],
    "Victoria": ["Melbourne", "Geelong"],
    "Queensland": ["Brisbane", "Gold Coast"],
  },
};

// Sample localities for popular cities (autocomplete; user can add their own)
export const LOCALITIES_BY_CITY: Record<string, string[]> = {
  "Bengaluru": ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar", "JP Nagar", "BTM Layout", "Marathahalli", "Hebbal", "Electronic City", "Malleshwaram", "Banashankari"],
  "Mumbai": ["Bandra", "Andheri", "Powai", "Worli", "Juhu", "Lower Parel", "Dadar", "Thane West", "Borivali", "Goregaon"],
  "New Delhi": ["Saket", "Hauz Khas", "Vasant Kunj", "Connaught Place", "Lajpat Nagar", "Karol Bagh", "Greater Kailash", "Dwarka"],
  "Delhi": ["Saket", "Hauz Khas", "Vasant Kunj", "Connaught Place", "Lajpat Nagar", "Karol Bagh", "Greater Kailash", "Dwarka"],
  "Hyderabad": ["Gachibowli", "Hitech City", "Madhapur", "Banjara Hills", "Jubilee Hills", "Kondapur", "Kukatpally"],
  "Chennai": ["Adyar", "Anna Nagar", "T. Nagar", "Velachery", "OMR", "Nungambakkam", "Mylapore"],
  "Pune": ["Kothrud", "Koregaon Park", "Viman Nagar", "Hinjewadi", "Aundh", "Baner", "Hadapsar"],
  "Kolkata": ["Salt Lake", "New Town", "Park Street", "Ballygunge", "Howrah"],
  "Ahmedabad": ["Satellite", "Bodakdev", "Navrangpura", "SG Highway"],
  "Jaipur": ["C-Scheme", "Malviya Nagar", "Vaishali Nagar", "Mansarovar"],
  "Gurugram": ["Cyber City", "Sector 14", "Sector 56", "Golf Course Road", "MG Road"],
  "Noida": ["Sector 18", "Sector 62", "Sector 137", "Greater Noida"],
};

export function getStates(country: string): string[] {
  const states = STATES_BY_COUNTRY[country];
  return states ? Object.keys(states).sort() : [];
}

export function getCities(country: string, state: string): string[] {
  return STATES_BY_COUNTRY[country]?.[state] ?? [];
}

export function getLocalities(city: string): string[] {
  return LOCALITIES_BY_CITY[city] ?? [];
}

export function allKnownCities(): string[] {
  const set = new Set<string>();
  Object.values(STATES_BY_COUNTRY).forEach((states) => {
    Object.values(states).forEach((cities) => cities.forEach((c) => set.add(c)));
  });
  return Array.from(set).sort();
}
