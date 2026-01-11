import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, BookOpen, Target, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PracticeTests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('practice_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching practice tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewTest = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user preferences to determine subject
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('preferred_subjects')
        .eq('user_id', user.id)
        .single();

      const subjects = prefs?.preferred_subjects || ['Matematikk'];
      const subject = subjects[0];

      const { data, error } = await supabase.functions.invoke('generate-practice-test', {
        body: { userId: user.id, subject, topics: [] }
      });

      if (error) throw error;

      toast({
        title: 'Øveprøve generert!',
        description: 'Din nye øveprøve er klar.',
      });

      fetchTests();
    } catch (error) {
      console.error('Error generating test:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke generere øveprøve.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (test: any) => {
    if (test.completed_at) {
      const percentage = (test.score / test.total_questions) * 100;
      return (
        <span className={`text-sm font-medium ${percentage >= 80 ? 'text-success' : percentage >= 60 ? 'text-warning' : 'text-destructive'}`}>
          {Math.round(percentage)}% bestått
        </span>
      );
    }
    return <span className="text-sm text-muted-foreground">Ikke fullført</span>;
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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tilbake
      </Button>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Øveprøver</h1>
          <p className="text-muted-foreground mt-2">
            Tren i en realistisk prøvesituasjon
          </p>
        </div>
        <Button onClick={generateNewTest} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Genererer...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ny øveprøve
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {tests.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Ingen øveprøver ennå</h3>
            <p className="text-muted-foreground mb-4">
              Klikk på "Ny øveprøve" for å generere din første prøve
            </p>
          </Card>
        ) : (
          tests.map((test) => (
            <Card
              key={test.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/practice-test/${test.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{test.title}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {test.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {test.time_limit_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {test.total_questions} spørsmål
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-sm font-medium ${getDifficultyColor(test.difficulty_level)}`}>
                      {test.difficulty_level === 'easy' ? 'Lett' : test.difficulty_level === 'medium' ? 'Medium' : 'Vanskelig'}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    {getStatusBadge(test)}
                  </div>
                </div>
                <Button variant="outline">
                  {test.completed_at ? 'Se resultat' : 'Start prøve'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}