import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CheckCircle2, Lock, Play, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface StudyPlan {
  id: string;
  test_id: string;
  subject: string;
  test_date: string;
  phases: any;
  current_phase: string;
  completed_phases: any;
  adapted_count: number;
  metadata: any;
}

interface Phase {
  id: string;
  name: string;
  description: string;
  daysAllocated: number;
  activities: Activity[];
  unlockRequirements: {
    minActivities?: number;
    minAverageScore?: number;
    previousPhaseComplete?: boolean;
  };
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  topic: string;
  completed?: boolean;
}

export default function StudyPlan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [adaptability, setAdaptability] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('test_date', { ascending: true });

      if (error) throw error;
      
      // Transform data to match interface
      const transformedPlans = (data || []).map(plan => ({
        ...plan,
        phases: Array.isArray(plan.phases) ? plan.phases : [],
        completed_phases: Array.isArray(plan.completed_phases) ? plan.completed_phases : []
      }));
      
      setPlans(transformedPlans);
      
      // Calculate adaptability score
      if (transformedPlans && transformedPlans.length > 0) {
        const { data: activities, count } = await supabase
          .from('learning_activities')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        const activityCount = count || 0;
        const avgAdapted = transformedPlans.reduce((sum, p) => sum + p.adapted_count, 0) / transformedPlans.length;
        setAdaptability(Math.min(100, (activityCount * 2) + (avgAdapted * 10)));
      }
    } catch (error: any) {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPhaseProgress = (plan: StudyPlan, phase: Phase) => {
    const completedActivities = phase.activities.filter(a => a.completed).length;
    return (completedActivities / phase.activities.length) * 100;
  };

  const isPhaseUnlocked = (plan: StudyPlan, phase: Phase) => {
    if (phase.id === 'learn') return true;
    
    const phaseIndex = plan.phases.findIndex(p => p.id === phase.id);
    if (phaseIndex === 0) return true;
    
    const previousPhase = plan.phases[phaseIndex - 1];
    return plan.completed_phases.includes(previousPhase.id);
  };

  const getPhaseIcon = (phaseId: string, isUnlocked: boolean, isComplete: boolean) => {
    if (isComplete) return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (!isUnlocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
    return <Play className="h-5 w-5 text-primary" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster studieplaner...</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ingen studieplaner ennå</h2>
            <p className="text-muted-foreground mb-6">
              Legg til en prøve for å få en personlig studieplan
            </p>
            <Button onClick={() => navigate('/tests')}>
              Planlegg prøve
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            GradeUp kjenner deg {adaptability.toFixed(0)}%
          </Badge>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Mine studieplaner
          </h1>
          <p className="text-muted-foreground">
            Personlige planer som tilpasser seg hvordan du lærer
          </p>
        </div>

        <div className="grid gap-6">
          {plans.map((plan) => {
            const daysUntil = differenceInDays(new Date(plan.test_date), new Date());
            const overallProgress = plan.completed_phases.length / plan.phases.length * 100;
            const currentPhase = plan.phases.find(p => p.id === plan.current_phase);

            return (
              <Card key={plan.id} className="p-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">{plan.subject}</h3>
                      <p className="text-muted-foreground">
                        {format(new Date(plan.test_date), 'dd.MM.yyyy')} • {daysUntil} dager igjen
                      </p>
                    </div>
                    <Badge variant={daysUntil <= 7 ? 'destructive' : 'secondary'}>
                      {Math.round(overallProgress)}% fullført
                    </Badge>
                  </div>

                  {/* Overall Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Totalt fremgang</span>
                      <span className="font-medium">{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  {/* Phases */}
                  <div className="space-y-4">
                    {plan.phases.map((phase, index) => {
                      const isUnlocked = isPhaseUnlocked(plan, phase);
                      const isComplete = plan.completed_phases.includes(phase.id);
                      const isCurrent = phase.id === plan.current_phase;
                      const progress = getPhaseProgress(plan, phase);

                      return (
                        <Card 
                          key={phase.id} 
                          className={`p-4 ${isCurrent ? 'border-2 border-primary' : ''} ${!isUnlocked ? 'opacity-50' : ''}`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getPhaseIcon(phase.id, isUnlocked, isComplete)}
                                <div>
                                  <h4 className="font-semibold">{phase.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {phase.description}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={isComplete ? 'default' : 'outline'}>
                                {phase.activities.length} aktiviteter
                              </Badge>
                            </div>

                            {isUnlocked && (
                              <>
                                <Progress value={progress} className="h-1" />
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {phase.daysAllocated} dager • {phase.activities.reduce((sum, a) => sum + a.estimatedMinutes, 0)} min totalt
                                  </span>
                                  {isCurrent && !isComplete && (
                                    <Button size="sm" variant="default">
                                      <Play className="h-3 w-3 mr-1" />
                                      Fortsett
                                    </Button>
                                  )}
                                </div>
                              </>
                            )}

                            {!isUnlocked && (
                              <p className="text-sm text-muted-foreground">
                                🔒 Fullfør forrige fase for å låse opp
                              </p>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Adaptation info */}
                  {plan.adapted_count > 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Planen er tilpasset {plan.adapted_count} {plan.adapted_count === 1 ? 'gang' : 'ganger'} basert på din fremgang
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}