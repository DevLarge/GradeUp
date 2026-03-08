import { supabase } from '@/integrations/supabase/client';

export class AIServiceBackend {
  static async analyzeDocument(text: string, subject: string): Promise<string> {
    try {
      console.log('📤 Calling Anthropic edge function for document analysis...');
      
      const { data, error } = await supabase.functions.invoke('anthropic-ai', {
        body: { text, subject },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('✅ Received response from edge function');
      return data.result;
    } catch (error: any) {
      console.error('❌ Error calling AI function:', error);
      throw new Error(error.message || 'Failed to analyze document with AI');
    }
  }

  static async generateQuizzes(content: string, subject: string, count: number = 20): Promise<any[]> {
    try {
      console.log('📤 Calling Quizzes generation edge function...');
      
      const { data, error } = await supabase.functions.invoke('generate-quizzes', {
        body: { content, subject, count },
      });

      if (error) throw error;
      console.log('✅ Received quizzes');
      return data.quizzes || [];
    } catch (error: any) {
      console.error('❌ Error generating quizzes:', error);
      return [];
    }
  }

  static async generateTests(content: string, subject: string): Promise<any[]> {
    try {
      console.log('📤 Calling Tests generation edge function...');
      
      const { data, error } = await supabase.functions.invoke('generate-tests', {
        body: { content, subject },
      });

      if (error) throw error;
      console.log('✅ Received tests');
      return data.tests || [];
    } catch (error: any) {
      console.error('❌ Error generating tests:', error);
      return [];
    }
  }

  static async generateFlashcards(content: string, subject: string): Promise<any[]> {
    try {
      console.log('📤 Calling Flashcards generation edge function...');
      
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { content, subject },
      });

      if (error) throw error;
      console.log('✅ Received flashcards');
      return data.flashcards || [];
    } catch (error: any) {
      console.error('❌ Error generating flashcards:', error);
      return [];
    }
  }

  static async generateReadingTexts(content: string, subject: string, count: number = 8): Promise<any[]> {
    try {
      console.log('📤 Calling Reading texts generation edge function...');
      
      const { data, error } = await supabase.functions.invoke('generate-reading-texts', {
        body: { content, subject, count },
      });

      if (error) throw error;
      console.log('✅ Received reading texts');
      return data.texts || [];
    } catch (error: any) {
      console.error('❌ Error generating reading texts:', error);
      return [];
    }
  }

  static async generateStudyPlan(content: string, subject: string, testDate: Date, readingTexts: any[]): Promise<string> {
    try {
      console.log('📤 Calling Study plan generation edge function...');
      
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: { 
          content, 
          subject, 
          testDate: testDate.toISOString().split('T')[0],
          readingTexts
        },
      });

      if (error) throw error;
      console.log('✅ Received study plan');
      return JSON.stringify(data.plan);
    } catch (error: any) {
      console.error('❌ Error generating study plan:', error);
      return '';
    }
  }
}
