// Alle studiespesialiserende fag i Norge

// Fellesfag
export const COMMON_SUBJECTS = [
  'Norsk',
  'Matematikk',
  'Engelsk',
  'Naturfag',
  'Samfunnsfag',
  'Kroppsøving',
];

// Programfag (Studiespesialisering)
export const PROGRAM_SUBJECTS = [
  'Historie',
  'Geografi',
  'Religion og etikk',
  'Sosiologi og sosialantropologi',
  'Samfunnsøkonomi',
  'Biologi',
  'Fysikk',
  'Kjemi',
  'Geofag',
  'Teknologi og forskningslære',
  'Informasjonsteknologi',
  'Økonomi',
];

// Fremmedspråk
export const FOREIGN_LANGUAGES = [
  'Tysk',
  'Fransk',
  'Spansk',
  'Italiensk',
  'Kinesisk',
  'Japansk',
  'Russisk',
  'Arabisk',
  'Latin',
  'Samisk',
];

// Kunst og kultur
export const ARTS_AND_CULTURE = [
  'Musikk',
  'Kunst og håndverk',
  'Drama og teater',
  'Dans',
  'Film og TV-produksjon',
  'Mediesamfunnsfag',
];

// Alle fag samlet (alfabetisk sortert)
export const ALL_SUBJECTS = [
  ...COMMON_SUBJECTS,
  ...PROGRAM_SUBJECTS,
  ...FOREIGN_LANGUAGES,
  ...ARTS_AND_CULTURE,
].sort();

// Hjelpefunksjon for å sjekke om et fag er et fremmedspråk
export const isLanguageSubject = (subject: string): boolean => {
  const normalizedSubject = subject.toLowerCase().trim();
  
  // Sjekk om fagnavnet inneholder noen av fremmedspråkene
  return FOREIGN_LANGUAGES.some(lang => 
    normalizedSubject.includes(lang.toLowerCase())
  ) || normalizedSubject === 'engelsk'; // Engelsk regnes også som språkfag
};

// Liste over fremmedspråk for enkel referanse (lowercase)
export const LANGUAGE_SUBJECTS_LOWERCASE = [
  ...FOREIGN_LANGUAGES.map(lang => lang.toLowerCase()),
  'engelsk',
];
