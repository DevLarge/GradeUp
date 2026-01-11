import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Explanations() {
  const { toast } = useToast();
  const [explanations, setExplanations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'understood' | 'unclear'>('all');

  useEffect(() => {
    fetchExplanations();
  }, []);

  const fetchExplanations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('explanations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExplanations(data || []);
    } catch (error) {
      console.error('Error fetching explanations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnderstood = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('explanations')
        .update({ understood: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setExplanations(prev =>
        prev.map(exp => (exp.id === id ? { ...exp, understood: !currentStatus } : exp))
      );

      toast({
        title: !currentStatus ? 'Markert som forstått' : 'Markert som uklart',
      });
    } catch (error) {
      console.error('Error updating explanation:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere status.',
        variant: 'destructive',
      });
    }
  };

  const filteredExplanations = explanations.filter(exp => {
    if (filter === 'understood') return exp.understood;
    if (filter === 'unclear') return !exp.understood;
    return true;
  });

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'practice_test': return 'Øveprøve';
      case 'quiz': return 'Quiz';
      case 'test': return 'Test';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Forklaringer</h1>
        <p className="text-muted-foreground">
          Se detaljerte forklaringer på oppgaver du har gjort feil
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Alle ({explanations.length})
        </Button>
        <Button
          variant={filter === 'unclear' ? 'default' : 'outline'}
          onClick={() => setFilter('unclear')}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Fortsatt uklart ({explanations.filter(e => !e.understood).length})
        </Button>
        <Button
          variant={filter === 'understood' ? 'default' : 'outline'}
          onClick={() => setFilter('understood')}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Forstått ({explanations.filter(e => e.understood).length})
        </Button>
      </div>

      <div className="space-y-4">
        {filteredExplanations.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Ingen forklaringer ennå</h3>
            <p className="text-muted-foreground">
              Gjør en quiz eller øveprøve for å få AI-genererte forklaringer på feil svar
            </p>
          </Card>
        ) : (
          filteredExplanations.map((exp) => (
            <Card key={exp.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <Badge variant="outline">{exp.subject}</Badge>
                  <Badge variant="secondary">{getActivityTypeLabel(exp.activity_type)}</Badge>
                </div>
                <Button
                  variant={exp.understood ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleUnderstood(exp.id, exp.understood)}
                >
                  {exp.understood ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Forstått
                    </>
                  ) : (
                    <>
                      <Circle className="mr-2 h-4 w-4" />
                      Marker som forstått
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Spørsmål:</h3>
                  <p className="text-muted-foreground">{exp.question_text}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1 text-destructive">Ditt svar:</h4>
                    <p className="text-sm">{exp.user_answer}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-success">Riktig svar:</h4>
                    <p className="text-sm">{exp.correct_answer}</p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Forklaring:</h4>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {exp.explanation}
                  </div>
                </div>

                {exp.examples && (
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">Tips til neste gang:</h4>
                    <p className="text-sm text-muted-foreground">{exp.examples}</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                {new Date(exp.created_at).toLocaleDateString('nb-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}