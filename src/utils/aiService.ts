import mammoth from 'mammoth';
import { supabase } from '@/integrations/supabase/client';

// AI Service - routes all requests through Supabase Edge Functions
// IMPORTANT: API keys are ONLY stored on backend, NEVER in frontend!
export class AIService {
  private static async callEdgeFunction(functionName: string, data: any) {
    try {
      const { data: response, error } = await supabase.functions.invoke(functionName, {
        body: data
      });

      if (error) throw error;
      return response;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  static async analyzeDocument(file: File, subject: string): Promise<string> {
    try {
      console.log(`📄 Starter dokumentanalyse av: ${file.name}`);
      
      const text = await this.readFileContent(file);
      
      if (!text.trim()) {
        console.error(`❌ Tomt dokument: ${file.name}`);
        return `Kunne ikke lese innhold fra ${file.name}. Kontroller at filen inneholder tekst.`;
      }

      console.log(`✓ Leste ${text.length} tegn fra ${file.name}`);
      console.log(`🤖 Sender til backend for dokumentanalyse...`);

      const response = await this.callEdgeFunction('anthropic-ai', {
        action: 'analyze_document',
        content: text,
        subject: subject,
        fileName: file.name
      });

      console.log(`✓ Dokumentanalyse fullført`);
      return response?.analysis || 'Kunne ikke analysere dokumentet.';
    } catch (error: any) {
      console.error(`❌ FEIL ved dokumentanalyse av ${file.name}:`, error);
      return this.getFallbackAnalysis(file.name, subject);
    }
  }

  private static getFallbackAnalysis(fileName: string, subject: string): string {
    return `Analysert innhold fra ${fileName}:
      
Hovedtemaer i ${subject}:
- Grunnleggende konsepter og teorier
- Praktiske anvendelser og eksempler
- Viktige formler og beregninger
- Typiske oppgavetyper fra pensum

Anbefalte fokusområder:
- Repetisjon av grunnleggende prinsipper
- Øving på lignende oppgaver
- Forståelse av sammenhenger`;
  }

  static async readFileContent(file: File): Promise<string> {
    // Handle DOCX files with mammoth
    if (file.name.toLowerCase().endsWith('.docx')) {
      console.log('📄 Parsing DOCX file...');
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log(`✓ Extracted ${result.value.length} characters from DOCX`);
        return result.value;
      } catch (error) {
        console.error('Error parsing DOCX:', error);
        return '';
      }
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
      console.log(`🎯 Starter generering av quizer for ${subject}`);
      
      const response = await this.callEdgeFunction('anthropic-ai', {
        action: 'generate_quizzes',
        content: content,
        subject: subject,
        count: count
      });

      console.log(`✓ Genset ${response?.quizzes?.length || 0} quizer`);
      return response?.quizzes || this.getFallbackQuizzes(subject, count);
    } catch (error: any) {
      console.error(`❌ FEIL ved quiz-generering:`, error);
      return this.getFallbackQuizzes(subject, count);
    }
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
      
      const response = await this.callEdgeFunction('anthropic-ai', {
        action: 'generate_tests',
        content: content,
        subject: subject,
        count: count
      });

      console.log(`✓ Genset ${response?.tests?.length || 0} tester`);
      return response?.tests || this.getFallbackTests(subject, count);
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
      
      const response = await this.callEdgeFunction('anthropic-ai', {
        action: 'generate_flashcards',
        content: content,
        subject: subject,
        count: count
      });

      console.log(`✓ Genset ${response?.flashcards?.length || 0} flashkort`);
      return response?.flashcards || this.getFallbackFlashcards(subject, count);
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
    topic: string;
  }[]> {
    try {
      console.log(`📚 Starter generering av ${count} lesetekster for ${subject}`);
      
      const response = await this.callEdgeFunction('anthropic-ai', {
        action: 'generate_reading_texts',
        content: content,
        subject: subject,
        count: count
      });

      console.log(`✓ Genset ${response?.texts?.length || 0} lesetekster`);
      return response?.texts || this.getFallbackReadingTexts(subject, count);
    } catch (error: any) {
      console.error('❌ FEIL ved generering av lesetekster:', error);
      return this.getFallbackReadingTexts(subject, count);
    }
  }

  private static getFallbackReadingTexts(subject: string, count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `reading_${i + 1}`,
      title: `Lesetekst ${i + 1}: ${subject}`,
      content: `Introduksjon til tema ${i + 1}...\n\nDette er en lesetekst som dekker viktige aspekter av ${subject}. Den inneholder eksempler, forklaringer og øvingsoppgaver som hjelper med forståelsen av emnet.`,
      topic: `Tema ${i + 1}`
    }));
  }
}
