import { supabase } from '@/integrations/supabase/client';

export class AIServiceBackend {
  static async analyzeDocument(text: string, subject: string): Promise<string> {
    try {
      console.log('📤 Calling Anthropic edge function...');
      
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
}
