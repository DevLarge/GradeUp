import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, BookOpen, CheckCircle2, Clock, Target, Zap } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useTestContext } from '@/contexts/TestContext';

interface DailyTask {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  topic: string;
  testSubject: string;
  testTitle: string;
  testDate: string;
}

export default function DailyPlan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tests } = useTestContext();
  const [todaysTasks, setTodaysTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTodaysPlan();
    
    // Load completed tasks from localStorage
    const saved = localStorage.getItem('completedTasks');
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
  }, []);

  const fetchTodaysPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all study plans
      const { data: plans, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('test_date', { ascending: true });

      if (error) throw error;

      const tasks: DailyTask[] = [];
      const today = new Date();

      // Extract today's tasks from all plans
      plans?.forEach(plan => {
        const phases = Array.isArray(plan.phases) ? plan.phases : [];
        
        phases.forEach((phase: any) => {
          const activities = Array.isArray(phase.activities) ? phase.activities : [];
          
          activities.forEach((activity: any) => {
            // Find the corresponding test
            const test = tests.find(t => t.id === plan.test_id);
            
            if (test) {
              tasks.push({
                id: `${plan.id}-${activity.id}`,
                type: activity.type,
                title: activity.title,
                description: activity.description,
                estimatedMinutes: activity.estimatedMinutes || 30,
                topic: activity.topic || phase.name,
                testSubject: test.subject,
                testTitle: test.title,
                testDate: plan.test_date
              });
            }
          });
        });
      });

      // For now, show first 5 tasks if available
      setTodaysTasks(tasks.slice(0, 5));
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

  const toggleTaskCompletion = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (completedTasks.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
    localStorage.setItem('completedTasks', JSON.stringify(Array.from(newCompleted)));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Zap className="h-4 w-4" />;
      case 'flashcards': return <BookOpen className="h-4 w-4" />;
      case 'test': return <Target className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'flashcards': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'test': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const totalMinutes = todaysTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const completedCount = todaysTasks.filter(t => completedTasks.has(t.id)).length;
  const progressPercent = todaysTasks.length > 0 ? (completedCount / todaysTasks.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster dagens plan...</p>
        </div>
      </div>
    );
  }

  if (todaysTasks.length === 0) {
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
            <h2 className="text-2xl font-bold mb-2">Ingen oppgaver for i dag</h2>
            <p className="text-muted-foreground mb-6">
              Legg til en prøve for å få en personlig studieplan med daglige oppgaver
            </p>
            <Button onClick={() => navigate('/tests')}>
              <Calendar className="h-4 w-4 mr-2" />
              Legg til prøve
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Dagens plan
          </h1>
          <p className="text-muted-foreground text-lg">
            {format(new Date(), 'EEEE d. MMMM yyyy', { locale: nb })}
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Din fremgang i dag</h3>
                <p className="text-muted-foreground text-sm">
                  {completedCount} av {todaysTasks.length} oppgaver fullført
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {Math.round(progressPercent)}%
              </Badge>
            </div>
            
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Ca. {totalMinutes} min totalt</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{todaysTasks.length} aktiviteter</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Tasks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Hva skal du lære i dag?</h2>
          
          {todaysTasks.map((task) => {
            const isCompleted = completedTasks.has(task.id);
            
            return (
              <Card 
                key={task.id} 
                className={`p-6 transition-all ${
                  isCompleted ? 'opacity-60 bg-muted/50' : 'hover:shadow-lg'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(task.type)}>
                          {getTypeIcon(task.type)}
                          <span className="ml-1 capitalize">{task.type}</span>
                        </Badge>
                        <Badge variant="outline">{task.topic}</Badge>
                      </div>
                      
                      <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      
                      <p className="text-muted-foreground">
                        {task.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{task.testSubject}: {task.testTitle}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Ca. {task.estimatedMinutes} min</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={isCompleted ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleTaskCompletion(task.id)}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Fullført
                        </>
                      ) : (
                        'Marker som fullført'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Link to Full Study Plan */}
        <Card className="p-6 text-center bg-gradient-to-br from-secondary/20 to-secondary/5">
          <h3 className="font-semibold mb-2">Se hele studieplanen</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Vil du se alle faser og aktiviteter for dine kommende prøver?
          </p>
          <Button variant="outline" onClick={() => navigate('/study-plans')}>
            <Calendar className="h-4 w-4 mr-2" />
            Gå til studieplaner
          </Button>
        </Card>
      </div>
    </div>
  );
}