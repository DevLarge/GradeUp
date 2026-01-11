import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';

// Real AI service for document analysis and content generation
export class AIService {
  private static getApiKey(): string | null {
    return localStorage.getItem('anthropic_api_key');
  }

  private static getAnthropic() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('⚠️ Anthropic API-nøkkel ikke funnet i localStorage');
      return null;
    }

    console.log('✓ API-nøkkel funnet, initialiserer Anthropic client');
    return new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  static async analyzeDocument(file: File, subject: string): Promise<string> {
    try {
      console.log(`📄 Starter dokumentanalyse av: ${file.name}`);
      
      const anthropic = this.getAnthropic();
      if (!anthropic) {
        console.warn('⚠️ Ingen API-nøkkel funnet - bruker fallback analyse');
        return this.getFallbackAnalysis(file.name, subject);
      }

      console.log(`📖 Leser innhold fra ${file.name}...`);
      // Read file content
      const text = await this.readFileContent(file);
      
      if (!text.trim()) {
        console.error(`❌ Tomt dokument: ${file.name}`);
        return `Kunne ikke lese innhold fra ${file.name}. Kontroller at filen inneholder tekst.`;
      }

      console.log(`✓ Leste ${text.length} tegn fra ${file.name}`);
      console.log(`🤖 Kaller Claude API for dokumentanalyse...`);

      // Use Claude to analyze the document
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyser dette dokumentet for faget ${subject} og gi en detaljert analyse:

${text}

Gi en analyse som inkluderer:
- Hovedtemaer og konsepter
- Viktige formler eller definisjoner
- Praktiske anvendelser
- Typiske oppgavetyper
- Anbefalte fokusområder for studiet

Skriv på norsk.`
        }]
      });

      console.log(`✓ Mottok svar fra Claude API`);
      const result = response.content[0].type === 'text' ? response.content[0].text : 'Kunne ikke analysere dokumentet.';
      console.log(`✓ Dokumentanalyse fullført for ${file.name}`);
      return result;
    } catch (error: any) {
      console.error(`❌ FEIL ved dokumentanalyse av ${file.name}:`, error);
      console.error('Feildetaljer:', {
        message: error?.message,
        status: error?.status,
        type: error?.error?.type
      });
      return this.getFallbackAnalysis(file.name, subject);
    }
  }

  private static getFallbackAnalysis(fileName: string, subject: string): string {
    return `Analysert innhold fra ${fileName} (demo-modus):
      
Hovedtemaer i ${subject}:
- Grunnleggende konsepter og teorier
- Praktiske anvendelser og eksempler
- Viktige formler og beregninger
- Typiske oppgavetyper fra pensum

Anbefalte fokusområder:
- Repetisjon av grunnleggende prinsipper
- Øving på lignende oppgaver
- Forståelse av sammenhenger

Merk: For full AI-analyse, sett opp API-nøkkel i innstillinger.`;
  }

  private static async readFileContent(file: File): Promise<string> {
    // Handle DOCX files with mammoth
    if (file.name.toLowerCase().endsWith('.docx')) {
      console.log('📄 Parsing DOCX file with mammoth...');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log(`✓ Extracted ${result.value.length} characters from DOCX`);
      return result.value;
    }
    
    // For other files, read as text
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  static async generateQuizzes(content: string, subject: string, count: number = 20): Promise<{
    id: string;
    title: string;
    description: string;
    questions: {
      id: string;
      question: string;
      options: string[];
      correct: number;
    }[];
  }[]> {
    try {
      console.log(`🎯 Starter generering av tema-baserte quizer for ${subject}`);
      
      const anthropic = this.getAnthropic();
      if (!anthropic) {
        console.warn('⚠️ Ingen API-nøkkel funnet - bruker fallback quizzer');
        return this.getFallbackQuizzes(subject, count);
      }

      console.log(`📝 Innhold lengde: ${content.length} tegn`);
      console.log(`🤖 Kaller Claude API for quiz-generering...`);
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: `Basert på dette SPESIFIKKE innholdet for faget ${subject}, analyser innholdet nøye og identifiser 3-5 hovedtemaer fra det faktiske innholdet.

${content}

For hvert hovedtema fra innholdet:
- Lag en SPESIFIKK tittel basert på innholdet (ikke generiske titler)
- Skriv en kort beskrivelse (1-2 setninger) som viser hva dette temaet handler om
- Generer 10-15 SPESIFIKKE flervalgsspørsmål basert på faktisk informasjon fra innholdet
- Hvert spørsmål skal teste kunnskap om konkrete fakta, konsepter eller sammenhenger fra teksten
- Hvert spørsmål skal ha 4 svaralternativer hvor kun ett er riktig
- Indiker hvilket alternativ som er riktig (0-3)

KRITISK VIKTIG:
- Spørsmålene MÅ være basert på KONKRET innhold fra teksten
- IKKE lag generiske spørsmål som "Hva er viktig for..."
- LAG spørsmål som "Hva skjedde i 1789?" eller "Hvilken filosof mente at...?" eller "Hva var konsekvensen av...?"
- Bruk navn, datoer, hendelser og konsepter fra det faktiske innholdet

Format som JSON (kun JSON, ingen annen tekst):
[
  {
    "title": "Spesifikk tema tittel fra innholdet",
    "description": "Beskrivelse av dette spesifikke temaet",
    "questions": [
      {
        "question": "Konkret spørsmål basert på innholdet",
        "options": ["Riktig svar fra innholdet", "Feil alternativ", "Feil alternativ", "Feil alternativ"],
        "correct": 0
      }
    ]
  }
]

Skriv alt på norsk. Svar KUN med JSON, ingen annen tekst.`
        }]
      });

      console.log(`✓ Mottok svar fra Claude API`);
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      console.log('Respons lengde:', responseText.length, 'tegn');
      
      // Extract and repair JSON
      let jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ Fant ikke JSON i responsen');
        console.log('Respons innhold:', responseText.substring(0, 500));
        return this.getFallbackQuizzes(subject, count);
      }

      console.log(`✓ Fant JSON i responsen`);
      
      let themes;
      try {
        themes = JSON.parse(jsonMatch[0]);
        console.log(`✓ Parsede ${themes.length} temaer fra JSON`);
          
          const result = themes.map((theme: any, themeIndex: number) => ({
            id: `theme_${Date.now()}_${themeIndex}`,
            title: theme.title,
            description: theme.description,
            questions: theme.questions.map((q: any, qIndex: number) => ({
              id: `quiz_${Date.now()}_${themeIndex}_${qIndex}`,
              question: q.question,
              options: q.options,
              correct: q.correct
            }))
          }));
          
          const totalQuestions = result.reduce((sum, theme) => sum + theme.questions.length, 0);
          console.log(`✅ Genererte ${result.length} temaer med totalt ${totalQuestions} spørsmål`);
          return result;
      } catch (parseError: any) {
        console.error('❌ JSON parsing feilet, prøver å reparere...', parseError);
        
        // Try to repair JSON
        let repairedJson = jsonMatch[0];
        const openBraces = (repairedJson.match(/\{/g) || []).length;
        const closeBraces = (repairedJson.match(/\}/g) || []).length;
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/\]/g) || []).length;
        
        for (let i = 0; i < openBrackets - closeBrackets; i++) repairedJson += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) repairedJson += '}';
        
        try {
          themes = JSON.parse(repairedJson);
          console.log('✅ Reparering vellykket!');
          
          const result = themes.map((theme: any, themeIndex: number) => ({
            id: `theme_${Date.now()}_${themeIndex}`,
            title: theme.title,
            description: theme.description,
            questions: theme.questions.map((q: any, qIndex: number) => ({
              id: `quiz_${Date.now()}_${themeIndex}_${qIndex}`,
              question: q.question,
              options: q.options,
              correct: q.correct
            }))
          }));
          
          const totalQuestions = result.reduce((sum, theme) => sum + theme.questions.length, 0);
          console.log(`✅ Genererte ${result.length} temaer med totalt ${totalQuestions} spørsmål`);
          return result;
        } catch (repairError) {
          console.error('❌ Kunne ikke reparere JSON');
        }
      }
    } catch (error: any) {
      console.error('❌ FEIL ved generering av quizzer:', error);
      console.error('Feildetaljer:', {
        message: error?.message,
        status: error?.status,
        type: error?.error?.type
      });
    }

    console.warn('⚠️ Falt tilbake til generiske quizzer');
    return this.getFallbackQuizzes(subject, count);
  }

  private static getFallbackQuizzes(subject: string, count: number) {
    const themes = [
      { title: 'Grunnleggende konsepter', desc: 'Fundamentale prinsipper og definisjoner' },
      { title: 'Anvendelser', desc: 'Praktiske anvendelser og eksempler' },
      { title: 'Teorier', desc: 'Viktige teorier og modeller' }
    ];
    
    return themes.map((theme, themeIndex) => ({
      id: `theme_${themeIndex + 1}`,
      title: theme.title,
      description: theme.desc,
      questions: Array.from({ length: Math.ceil(count / themes.length) }, (_, i) => ({
        id: `quiz_${themeIndex}_${i + 1}`,
        question: `Hvilket av følgende er riktig angående ${theme.title.toLowerCase()} i ${subject}?`,
        options: [
          `Riktig svar om ${theme.title.toLowerCase()}`,
          `Feil alternativ A`,
          `Feil alternativ B`,
          `Feil alternativ C`
        ],
        correct: 0
      }))
    }));
  }

  static async generateTests(content: string, subject: string, count: number = 30): Promise<{
    id: string;
    question: string;
    answer: string;
    points: number;
  }[]> {
    try {
      console.log(`📝 Starter generering av ${count} tester for ${subject}`);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          content,
          subject,
          type: 'tests',
          count
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const tests = data.result;
      
      const result = tests.map((test: any, index: number) => ({
        id: `test_${Date.now()}_${index}`,
        question: test.question,
        answer: test.answer,
        points: test.points
      }));
      
      console.log(`✅ Genererte ${result.length} tester vellykket`);
      return result;
    } catch (error: any) {
      console.error('❌ FEIL ved generering av tester:', error);
      return this.getFallbackTests(subject, count);
    }
  }

  private static getFallbackTests(subject: string, count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `test_${i + 1}`,
      question: `Forklar hvordan ${subject.toLowerCase()}-prinsippene kan anvendes i praktiske situasjoner. (${10 + i * 5} poeng)`,
      answer: `Detaljert svar som viser forståelse av ${subject}-konseptene og deres praktiske anvendelse.`,
      points: 10 + i * 5
    }));
  }

  static async generateFlashcards(content: string, subject: string, count: number = 60): Promise<{
    id: string;
    front: string;
    back: string;
    category?: string;
  }[]> {
    try {
      console.log(`🃏 Starter generering av ${count} flashkort for ${subject}`);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          content,
          subject,
          type: 'flashcards',
          count
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const flashcards = data.result;
      
      const result = flashcards.map((card: any, index: number) => ({
        id: `card_${Date.now()}_${index}`,
        front: card.front,
        back: card.back,
        category: card.category || 'Generelt'
      }));
      
      console.log(`✅ Genererte ${result.length} flashkort vellykket`);
      return result;
    } catch (error: any) {
      console.error('❌ FEIL ved generering av flashkort:', error);
      return this.getFallbackFlashcards(subject, count);
    }
  }

  private static getFallbackFlashcards(subject: string, count: number) {
    const concepts = ['Definisjon', 'Formel', 'Anvendelse', 'Eksempel', 'Sammenheng', 'Metode', 'Prinsipp', 'Teori'];
    return Array.from({ length: count }, (_, i) => ({
      id: `card_${i + 1}`,
      front: `${concepts[i % concepts.length]} innen ${subject}`,
      back: `Detaljert forklaring av ${concepts[i % concepts.length].toLowerCase()} basert på pensumet`,
      category: 'Generelt'
    }));
  }

  static async generateReadingTexts(content: string, subject: string, count: number = 3): Promise<{
    id: string;
    title: string;
    content: string;
  }[]> {
    try {
      console.log(`📖 Starter generering av ${count} lesetekster for ${subject}`);
      
      const anthropic = this.getAnthropic();
      if (!anthropic) {
        console.warn('⚠️ Ingen API-nøkkel funnet - bruker fallback lesetekster');
        return this.getFallbackReadingTexts(subject, count);
      }

      console.log(`🤖 Kaller Claude API for lesetekst-generering...`);
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: `Basert på dette innholdet for faget ${subject}, lag ${count} FORSKJELLIGE og OMFATTENDE lesetekster som eleven kan lese for å lære stoffet:

${content}

For hver lesetekst:
- Lag en SPESIFIKK og INFORMATIV tittel som tydelig beskriver hva teksten handler om
- Skriv en pedagogisk tekst på 400-600 ord som forklarer et viktig tema fra innholdet
- Dekk ulike temaer og aspekter av stoffet i hver tekst
- Bruk tydelige eksempler og forklaringer
- Inkluder viktige konsepter og definisjoner
- Skriv på et nivå som er lett å forstå for elever
- Fokuser på KONKRETE temaer fra innholdet (f.eks. "Opplysningstiden", "Fotosyntese", "Pytagoras' læresetning")

Returner svaret som JSON i følgende format (INGEN annen tekst):
{
  "texts": [
    {
      "id": "rt-1",
      "title": "Spesifikk og beskrivende tittel",
      "content": "Innholdet i leseteksten..."
    }
  ]
}

VIKTIG: 
- Kun JSON, ingen forklaringer før eller etter!
- Titler må være KONKRETE og SPESIFIKKE (f.eks. "Kontrasten mellom før og etter opplysningstiden" i stedet for bare "Opplysningstiden")`
        }]
      });

      console.log(`✓ Mottok svar fra Claude API`);
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      console.log(`Respons lengde: ${responseText.length} tegn`);
      
      // Extract JSON from response - try to find the outermost JSON object
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ Fant ikke JSON i responsen');
        console.log('Respons innhold:', responseText.substring(0, 500));
        return this.getFallbackReadingTexts(subject, count);
      }

      console.log(`✓ Fant JSON i responsen`);
      console.log('JSON lengde:', jsonMatch[0].length);
      
      // Validate JSON before parsing
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError: any) {
        console.error('❌ JSON parsing feilet, prøver å reparere...');
        console.log('Første 200 tegn:', jsonMatch[0].substring(0, 200));
        console.log('Siste 200 tegn:', jsonMatch[0].substring(jsonMatch[0].length - 200));
        
        // Try to fix incomplete JSON by closing arrays/objects
        let repairedJson = jsonMatch[0];
        const openBraces = (repairedJson.match(/\{/g) || []).length;
        const closeBraces = (repairedJson.match(/\}/g) || []).length;
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/\]/g) || []).length;
        
        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          repairedJson += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          repairedJson += '}';
        }
        
        console.log('Forsøker reparert JSON...');
        try {
          parsed = JSON.parse(repairedJson);
          console.log('✅ Reparering vellykket!');
        } catch (repairError) {
          console.error('❌ Kunne ikke reparere JSON');
          return this.getFallbackReadingTexts(subject, count);
        }
      }
      
      const texts = parsed.texts || [];
      
      console.log(`✓ Parsede ${texts.length} lesetekster fra JSON`);
      console.log(`✅ Genererte ${texts.length} lesetekster vellykket`);
      
      return texts;
    } catch (error: any) {
      console.error('❌ FEIL ved generering av lesetekster:', error);
      console.error('Feildetaljer:', {
        message: error?.message,
        status: error?.status
      });
      return this.getFallbackReadingTexts(subject, count);
    }
  }

  private static getFallbackReadingTexts(subject: string, count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `fallback-rt-${i}`,
      title: `${subject} - Lesetekst ${i + 1}`,
      content: `Dette er en demo-lesetekst for ${subject}. Aktiver API-nøkkel for å generere ekte læretekster basert på ditt studiemateriale.

Leseteksten vil inneholde:
- Detaljerte forklaringer av viktige konsepter
- Praktiske eksempler som gjør stoffet lettere å forstå
- Sammenhenger mellom ulike temaer
- Tips for hvordan du best kan lære dette stoffet

For å få tilgang til skreddersydde lesetekster, gå til innstillinger og legg til en Anthropic API-nøkkel.`
    }));
  }

  static async generateStudyPlan(
    content: string, 
    subject: string, 
    testDate: Date,
    readingTexts: { id: string; title: string; content: string; }[] = []
  ): Promise<{
    id: string;
    day: string;
    date: string;
    tasks: {
      id: string;
      skill: string;
      type: "video" | "practice" | "quiz" | "reading" | "flashcards";
      duration: number;
      completed: boolean;
      priority: "high" | "medium" | "low";
    }[];
  }[]> {
    try {
      console.log(`📅 Starter generering av studieplan for ${subject}`);
      
      const today = new Date();
      const daysUntilTest = Math.ceil((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`⏰ Dager til prøve: ${daysUntilTest}`);

      const anthropic = this.getAnthropic();
      if (!anthropic) {
        console.warn('⚠️ Ingen API-nøkkel funnet - bruker fallback studieplan');
        return this.getFallbackStudyPlan(subject, daysUntilTest);
      }

      // Create a list of available reading texts
      const readingTextsList = readingTexts.length > 0 
        ? `\n\nTILGJENGELIGE LESETEKSTER:\n${readingTexts.map((text, i) => `${i + 1}. "${text.title}"`).join('\n')}`
        : '';

      console.log(`🤖 Kaller Claude API for studieplan-generering...`);
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Basert på dette innholdet for faget ${subject}, lag en detaljert studieplan frem til prøven om ${daysUntilTest} dager.

${content}${readingTextsList}

Lag en dag-for-dag plan med konkrete oppgaver for hver dag. For hver dag:
- Identifiser 2-4 oppgaver basert på innholdet
- Velg passende oppgavetyper: "video", "practice", "quiz", "reading", eller "flashcards"
- Sett realistisk varighet i minutter (15-45 min per oppgave)
- Prioriter oppgaver: "high", "medium", eller "low"
- For "reading"-oppgaver: BRUK EKSAKT TITTEL fra listen over tilgjengelige lesetekster
- For andre oppgaver: Bruk konkrete emner fra innholdet som "skill"

Returner svaret som JSON i følgende format (INGEN annen tekst):
{
  "days": [
    {
      "id": "day-1",
      "day": "Dag 1",
      "date": "2025-10-07",
      "tasks": [
        {
          "id": "task-1-1",
          "skill": "Konkret emne fra innholdet eller EKSAKT tittel på lesetekst",
          "type": "video",
          "duration": 20,
          "completed": false,
          "priority": "high"
        }
      ]
    }
  ]
}

VIKTIG: 
- Kun JSON, ingen forklaringer før eller etter!
- For reading-oppgaver: Bruk EKSAKT samme tittel som i listen over tilgjengelige lesetekster!`
        }]
      });

      console.log(`✓ Mottok svar fra Claude API`);
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      console.log(`Respons lengde: ${responseText.length} tegn`);
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ Fant ikke JSON i responsen');
        return this.getFallbackStudyPlan(subject, daysUntilTest);
      }

      console.log(`✓ Fant JSON i responsen`);
      const parsed = JSON.parse(jsonMatch[0]);
      const days = parsed.days || [];
      
      console.log(`✓ Parsede ${days.length} dager fra JSON`);
      console.log(`✅ Genererte studieplan med ${days.length} dager vellykket`);
      
      return days;
    } catch (error: any) {
      console.error('❌ FEIL ved generering av studieplan:', error);
      console.error('Feildetaljer:', {
        message: error?.message,
        status: error?.status,
        type: error?.error?.type
      });
      const today = new Date();
      const daysUntilTest = Math.ceil((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return this.getFallbackStudyPlan(subject, daysUntilTest);
    }
  }

  private static getFallbackStudyPlan(subject: string, daysUntilTest: number) {
    const today = new Date();
    const numDays = Math.min(daysUntilTest, 7); // Max 7 days for demo
    
    return Array.from({ length: numDays }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      return {
        id: `day-${i + 1}`,
        day: `Dag ${i + 1}`,
        date: date.toISOString().split('T')[0],
        tasks: [
          {
            id: `task-${i + 1}-1`,
            skill: `${subject} - Grunnleggende konsepter`,
            type: i % 3 === 0 ? "reading" : i % 3 === 1 ? "practice" : "quiz" as "reading" | "practice" | "quiz",
            duration: 20 + (i % 3) * 10,
            completed: false,
            priority: i < 2 ? "high" : i < 5 ? "medium" : "low" as "high" | "medium" | "low"
          },
          {
            id: `task-${i + 1}-2`,
            skill: `${subject} - Praktiske oppgaver`,
            type: "flashcards" as "flashcards",
            duration: 15,
            completed: false,
            priority: "medium" as "medium"
          }
        ]
      };
    });
  }
}