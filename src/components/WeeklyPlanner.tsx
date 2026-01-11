import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Target,
  CheckCircle,
  Clock,
  CircleDot
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "practice": return <BookOpen className="h-4 w-4" />;
    case "quiz": return <Target className="h-4 w-4" />;
    case "reading": return <BookOpen className="h-4 w-4" />;
    case "flashcards": return <Target className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "practice": return "bg-success/10 text-success";
    case "quiz": return "bg-warning/10 text-warning";
    case "reading": return "bg-blue-500/10 text-blue-500";
    case "flashcards": return "bg-purple-500/10 text-purple-500";
    default: return "bg-secondary/10 text-secondary-foreground";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "border-l-destructive";
    case "medium": return "border-l-warning";
    case "low": return "border-l-success";
    default: return "border-l-secondary";
  }
};

const WeeklyPlanner = () => {
  const { tests } = useTestContext();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completedTasks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const upcomingTests = tests
    .filter(test => differenceInDays(test.date, new Date()) >= 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  useEffect(() => {
    localStorage.setItem('completedTasks', JSON.stringify(Array.from(completedTasks)));
  }, [completedTasks]);

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Studieplan</h1>
            <p className="text-muted-foreground">Din personlige plan for å lykkes</p>
          </div>
        </div>

        {upcomingTests.length > 0 ? (
          <div className="space-y-8">
            {upcomingTests.map((test) => {
              const daysUntil = differenceInDays(test.date, new Date());
              const studyPlanData = test.generatedContent?.studyPlan;
              const hasStudyPlan = Array.isArray(studyPlanData) && studyPlanData.length > 0;
              
              if (!hasStudyPlan) {
                return (
                  <Card key={test.id} className="p-6 shadow-lg">
                    <div className="mb-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold">{test.title}</h2>
                          <p className="text-muted-foreground">{test.subject}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-warning mb-1">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-2xl font-bold">{daysUntil}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {daysUntil === 0 ? 'I dag' : daysUntil === 1 ? 'dag igjen' : 'dager igjen'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 text-center bg-secondary/10 rounded-lg">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Ingen studieplan generert for denne prøven ennå.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last opp filer når du legger til en prøve for å få en personlig studieplan.
                      </p>
                    </div>
                  </Card>
                );
              }

              const studyPlan = test.generatedContent!.studyPlan as any[];
              const totalTasks = Array.isArray(studyPlan) ? studyPlan.reduce((sum, day) => sum + day.tasks.length, 0) : 0;
              const completed = Array.isArray(studyPlan) ? studyPlan.reduce((sum, day) => 
                sum + day.tasks.filter(task => completedTasks.has(task.id)).length, 0
              ) : 0;
              const progressPercent = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
              
              return (
                <div key={test.id} className="space-y-6">
                  {/* Test Header */}
                  <Card className="p-6 shadow-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold">{test.title}</h2>
                            <p className="text-muted-foreground">{test.subject}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-warning mb-1">
                              <AlertCircle className="h-5 w-5" />
                              <span className="text-2xl font-bold">{daysUntil}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {daysUntil === 0 ? 'I dag' : daysUntil === 1 ? 'dag igjen' : 'dager igjen'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(test.date, 'EEEE d. MMMM yyyy', { locale: nb })}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">Fremdrift</span>
                            <span className="font-medium">{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-3" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {completed} av {totalTasks} oppgaver fullført
                          </p>
                        </div>

                        {test.generatedContent && (
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 bg-primary/5 rounded">
                              <div className="text-lg font-bold text-primary">
                                {test.generatedContent.quizzes?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Temaer</div>
                            </div>
                            <div className="p-2 bg-primary/5 rounded">
                              <div className="text-lg font-bold text-primary">
                                {test.generatedContent.tests?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Tester</div>
                            </div>
                            <div className="p-2 bg-primary/5 rounded">
                              <div className="text-lg font-bold text-primary">
                                {test.generatedContent.flashcards?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Kort</div>
                            </div>
                            <div className="p-2 bg-primary/5 rounded">
                              <div className="text-lg font-bold text-primary">
                                {test.generatedContent.readingTexts?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Tekster</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Today's Learning Goals Card */}
                  {studyPlan.length > 0 && (() => {
                    const today = new Date();
                    const todayPlan = studyPlan.find(day => {
                      const dayDate = new Date(day.date);
                      return dayDate.toDateString() === today.toDateString();
                    }) || studyPlan[0];
                    
                    const totalMinutes = todayPlan.tasks.reduce((sum, task) => sum + parseInt(task.duration), 0);
                    
                    return (
                      <Card className="p-6 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-full bg-primary/20">
                            <CircleDot className="h-6 w-6 text-primary" />
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div>
                              <h2 className="text-2xl font-bold mb-2">
                                Etter denne økten skal du kunne...
                              </h2>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>{totalMinutes}-{totalMinutes + 10} minutter</span>
                                </div>
                                <Badge variant="secondary">Nybegynner</Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {todayPlan.tasks.slice(0, 3).map((task, idx) => (
                                <div key={task.id} className="flex items-start gap-2">
                                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                                  <p className="text-sm">
                                    Etter denne økten skal du kunne mestre <span className="font-medium">{task.skill}</span>
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="pt-4 border-t">
                              <h3 className="font-semibold mb-3">Øktens struktur:</h3>
                              <div className="space-y-2">
                                {todayPlan.tasks.map((task, idx) => (
                                  <div key={task.id} className="flex items-center gap-3 p-3 bg-background/60 rounded-lg">
                                    <div className={`p-2 rounded ${getTypeColor(task.type)}`}>
                                      {getTypeIcon(task.type)}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm capitalize">
                                        {task.type === "reading" ? "Forklaring" : 
                                         task.type === "practice" ? "Øving" :
                                         task.type === "quiz" ? "Quiz" :
                                         "Flashkort"}: {task.skill}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{task.duration} min</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Daily Schedule */}
                  <Card className="p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <Clock className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-semibold">Daglig plan</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {studyPlan.map((dayPlan) => {
                        const dayCompleted = dayPlan.tasks.filter(t => completedTasks.has(t.id)).length;
                        const dayTotal = dayPlan.tasks.length;
                        
                        return (
                          <Card key={dayPlan.id} className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{dayPlan.day}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(dayPlan.date), 'd. MMM', { locale: nb })}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {dayCompleted}/{dayTotal} fullført
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {dayPlan.tasks.map((task) => {
                                const isCompleted = completedTasks.has(task.id);
                                
                                return (
                                  <div 
                                    key={task.id} 
                                    className={`p-3 rounded-lg border-l-4 ${getPriorityColor(task.priority)} ${
                                      isCompleted ? 'bg-success/5' : 'bg-secondary/30'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${getTypeColor(task.type)}`}>
                                        {getTypeIcon(task.type)}
                                      </div>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.skill}
                                          </span>
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {task.type === "reading" ? "lesing" : 
                                             task.type === "practice" ? "øving" :
                                             task.type === "quiz" ? "quiz" :
                                             "flashkort"}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {task.duration} min • {
                                            task.priority === "high" ? "høy" :
                                            task.priority === "medium" ? "middels" : "lav"
                                          } prioritet
                                        </p>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <Link 
                                          to={
                                            task.type === "quiz" ? `/quiz/${test.id}` :
                                            task.type === "flashcards" ? `/flashcards/${test.id}` :
                                            task.type === "reading" ? "/reading" :
                                            task.type === "practice" ? "/reading" :
                                            `/test/${test.id}`
                                          }
                                        >
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                          >
                                            Start
                                          </Button>
                                        </Link>
                                        {isCompleted ? (
                                          <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => toggleTaskCompletion(task.id)}
                                          >
                                            <CheckCircle className="h-5 w-5 text-success" />
                                          </Button>
                                        ) : (
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => toggleTaskCompletion(task.id)}
                                          >
                                            Fullfør
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Link to={`/quiz/${test.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Start Quiz
                        </Button>
                      </Link>
                      <Link to={`/flashcards/${test.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Flashkort
                        </Button>
                      </Link>
                      <Link to={`/test/${test.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Ta test
                        </Button>
                      </Link>
                      <Link to="/practice">
                        <Button variant="outline" size="sm" className="w-full">
                          Lesing
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Ingen kommende prøver</h3>
            <p className="text-muted-foreground mb-4">
              Legg til en prøve i "Tester"-fanen for å få en studieplan
            </p>
            <Link to="/tests-tab">
              <Button>Legg til prøve</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WeeklyPlanner;
