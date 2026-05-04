// Categories & subcategories used by the interest picker.
// Keep concise; users can also add their own custom values.

export interface CategoryGroup {
  name: string;
  subcategories: string[];
}

export const INTEREST_CATALOG: CategoryGroup[] = [
  {
    name: "Academics",
    subcategories: [
      "Maths", "Physics", "Chemistry", "Biology", "English", "Hindi",
      "History", "Geography", "Economics", "Accounts", "Computer Science",
      "Test Prep (JEE/NEET)", "SAT / GRE", "IELTS / TOEFL",
    ],
  },
  {
    name: "Music",
    subcategories: [
      "Vocals (Hindustani)", "Vocals (Carnatic)", "Vocals (Western)",
      "Guitar", "Piano / Keyboard", "Violin", "Drums", "Ukulele",
      "Tabla", "Flute", "Music Production",
    ],
  },
  {
    name: "Dance",
    subcategories: [
      "Bharatanatyam", "Kathak", "Kuchipudi", "Odissi",
      "Hip Hop", "Contemporary", "Bollywood", "Salsa", "Ballet", "Zumba",
    ],
  },
  {
    name: "Sports",
    subcategories: [
      "Cricket", "Football", "Badminton", "Tennis", "Table Tennis",
      "Swimming", "Basketball", "Skating", "Chess", "Athletics",
    ],
  },
  {
    name: "Art",
    subcategories: [
      "Sketching", "Painting (Acrylic)", "Painting (Watercolor)",
      "Calligraphy", "Pottery", "Craft", "Photography", "Animation",
    ],
  },
  {
    name: "Coding",
    subcategories: [
      "Scratch (Kids)", "Python", "Java", "JavaScript / Web",
      "Data Science", "AI / ML", "App Development", "Game Development",
      "Robotics",
    ],
  },
  {
    name: "Yoga & Wellness",
    subcategories: [
      "Hatha Yoga", "Ashtanga Yoga", "Power Yoga", "Meditation",
      "Pranayama", "Pilates", "Fitness / HIIT",
    ],
  },
  {
    name: "Languages",
    subcategories: [
      "English", "Spanish", "French", "German", "Japanese",
      "Mandarin", "Arabic", "Hindi", "Sanskrit", "Tamil",
    ],
  },
  {
    name: "Other",
    subcategories: [
      "Public Speaking", "Cooking", "Magic", "Theatre", "Storytelling",
    ],
  },
];
