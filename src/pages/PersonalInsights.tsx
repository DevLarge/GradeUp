import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Brain, TrendingUp, Target, Lightbulb, Clock, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LearningPatterns {
  preferredLearningMethods: Record<string, number>;
  subjectStrengths: Record<string, number>;
  subjectWeaknesses: Record<string, number>;
  learningStyle: string;
  consistencyScore: number;
  recommendations: string[];
  insights: {
    strongestSubject: string;
    needsImprovement: string[];
    preferredMethod: string;
    studyPattern: string;
  };
}

export default function PersonalInsights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patterns, setPatterns] = useState<LearningPatterns | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadPatterns();
    
    // Subscribe to learning_patterns updates for real-time UI refresh
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      
      const channel = supabase
        .channel('learning_patterns_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'learning_patterns',
            filter: `user_id=eq.${data.user.id}`
          },
          () => {
            console.log('Learning patterns updated, refreshing...');
            loadPatterns();
            toast({
              title: "🎯 Analyse oppdatert!",
              description: "Dine læringsmønstre er automatisk oppdatert.",
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, []);

  const loadPatterns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('learning_patterns')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading patterns:', error);
      }

      if (data) {
        setPatterns({
          preferredLearningMethods: data.preferred_learning_methods as Record<string, number>,
          subjectStrengths: data.subject_strengths as Record<string, number>,
          subjectWeaknesses: data.subject_weaknesses as Record<string, number>,
          learningStyle: data.learning_style,
          consistencyScore: data.consistency_score,
          recommendations: [],
          insights: {
            strongestSubject: '',
            needsImprovement: [],
            preferredMethod: '',
            studyPattern: '',
          },
        });
        setTotalStudyTime(data.total_study_time || 0);
      }
    } catch (error) {
      console.error('Error in loadPatterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePatterns = async () => {
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('analyze-learning-patterns', {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data.patterns) {
        setPatterns(data.patterns);
        setTotalStudyTime(data.totalStudyTime || 0);
        toast({
          title: "Analyse fullført!",
          description: "Dine læringsmønstre er oppdatert.",
        });
      } else {
        toast({
          title: "Ikke nok data ennå",
          description: "Fortsett å bruke appen for å få personlige innsikter.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      toast({
        title: "Kunne ikke analysere",
        description: "Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                Personlige Innsikter
              </h1>
              <p className="text-muted-foreground">Din AI-studiekompis lærer hvordan du lærer best</p>
            </div>
          </div>
          <Button onClick={analyzePatterns} disabled={analyzing}>
            {analyzing ? 'Analyserer...' : 'Oppdater Analyse'}
          </Button>
        </div>

        {!patterns ? (
          <Card className="p-8 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Start din læringsreise</h2>
            <p className="text-muted-foreground mb-4">
              Vi trenger litt data for å lære deg å kjenne. Begynn med quizer, tester eller notater!
            </p>
            <Button onClick={analyzePatterns} disabled={analyzing}>
              {analyzing ? 'Analyserer...' : 'Analyser nå'}
            </Button>
          </Card>
        ) : (
          <>
            {/* Study Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total studietid</p>
                    <p className="text-2xl font-bold">{totalStudyTime} min</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Konsistens</p>
                    <p className="text-2xl font-bold">{patterns.consistencyScore}%</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Læringsstil</p>
                    <p className="text-2xl font-bold capitalize">{patterns.learningStyle}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Learning Methods */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Foretrukne læringsmetoder
              </h2>
              <div className="space-y-3">
                {Object.entries(patterns.preferredLearningMethods)
                  .sort(([, a], [, b]) => b - a)
                  .map(([method, percentage]) => (
                    <div key={method}>
                      <div className="flex justify-between mb-1">
                        <span className="capitalize">{method}</span>
                        <span className="font-semibold">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
              </div>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">
                  💪 Styrker
                </h2>
                <div className="space-y-3">
                  {Object.entries(patterns.subjectStrengths)
                    .sort(([, a], [, b]) => b - a)
                    .map(([subject, score]) => (
                      <div key={subject} className="flex justify-between items-center">
                        <span>{subject}</span>
                        <Badge variant="default" className="bg-green-600">
                          {score}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-orange-600 dark:text-orange-400">
                  🎯 Forbedringspotensial
                </h2>
                <div className="space-y-3">
                  {Object.entries(patterns.subjectWeaknesses)
                    .sort(([, a], [, b]) => a - b)
                    .map(([subject, score]) => (
                      <div key={subject} className="flex justify-between items-center">
                        <span>{subject}</span>
                        <Badge variant="secondary" className="bg-orange-600 text-white">
                          {score}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            {/* Recommendations */}
            {patterns.recommendations && patterns.recommendations.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI-anbefalinger
                </h2>
                <ul className="space-y-2">
                  {patterns.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
