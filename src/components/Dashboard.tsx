import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, TrendingUp, Clock, Play, Calendar, Brain, Zap, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { differenceInDays, format, isPast } from "date-fns";
import SettingsDialog from "./SettingsDialog";
import SkillsBreakdownDialog from "./SkillsBreakdownDialog";
import { supabase } from "@/integrations/supabase/client";
import TestReflectionDialog from "./TestReflectionDialog";

const getMasteryColor = (mastery: number) => {
  if (mastery >= 80) return "success";
  if (mastery >= 50) return "warning";
  return "destructive";
};

const getMasteryBadge = (mastery: number) => {
  if (mastery >= 80) return { variant: "default" as const, text: "Mestret", className: "bg-success text-success-foreground" };
  if (mastery >= 50) return { variant: "secondary" as const, text: "Arbeider med", className: "bg-warning text-warning-foreground" };
  return { variant: "destructive" as const, text: "Trenger øving", className: "bg-destructive text-destructive-foreground" };
};

const Dashboard = () => {
  const { tests, assessments, getNextTest, getUpcomingTests, getSubjectProgress } = useTestContext();
  const [reflectionTest, setReflectionTest] = useState<any>(null);
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);
  
  // Check for tests needing reflection
  useEffect(() => {
    const checkForReflections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find past tests
      const pastTests = tests.filter(t => isPast(t.date));
      
      if (pastTests.length === 0) return;

      // Check if we have reflections for these tests
      const { data: existingReflections } = await supabase
        .from('test_reflections')
        .select('test_id')
        .eq('user_id', user.id);

      const reflectedTestIds = new Set(existingReflections?.map(r => r.test_id) || []);
      
      // Find first test without reflection
      const testNeedingReflection = pastTests.find(t => !reflectedTestIds.has(t.id));
      
      if (testNeedingReflection) {
        setReflectionTest(testNeedingReflection);
        setShowReflectionDialog(true);
      }
    };
    
    checkForReflections();
  }, [tests]);
  
  // Show auto-analysis indicator
  useEffect(() => {
    const checkRecentAnalysis = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patterns } = await supabase
        .from('learning_patterns')
        .select('last_analyzed_at')
        .eq('user_id', user.id)
        .single();

      if (patterns?.last_analyzed_at) {
        const lastAnalyzed = new Date(patterns.last_analyzed_at);
        const hoursSince = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
        
        // Show notification if analyzed within last hour
        if (hoursSince < 1) {
          console.log('Recent analysis detected');
        }
      }
    };
    
    checkRecentAnalysis();
  }, []);
  
  const nextTest = getNextTest();
  const upcomingTests = getUpcomingTests();
  
  // Generate dynamic skills based on actual subjects from tests and assessments
  const allSubjects = Array.from(new Set([
    ...tests.map(t => t.subject),
    ...assessments.map(a => a.subject)
  ]));
  
  const dynamicSkills = allSubjects.map(subject => {
    const progress = getSubjectProgress(subject);
    const subjectTests = tests.filter(t => t.subject === subject);
    const hasGeneratedContent = subjectTests.some(t => t.generatedContent);
    
    return {
      id: subject.toLowerCase(),
      name: subject,
      subject: subject,
      mastery: progress,
      lastPracticed: hasGeneratedContent ? "AI-innhold tilgjengelig" : "Ingen aktivitet",
      hasContent: hasGeneratedContent
    };
  });
  
  const allSkills = dynamicSkills;
  const overallReadiness = allSkills.length > 0 ? Math.round(allSkills.reduce((sum, skill) => sum + skill.mastery, 0) / allSkills.length) : 0;
  const topPriorities = allSkills
    .filter(skill => skill.mastery < 80)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-200/30 p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1 space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-welcome-green to-welcome-green-glow bg-clip-text text-transparent">
              Velkommen tilbake til GradeUp
            </h1>
            <p className="text-muted-foreground text-lg">Følg din fremgang og mestre dine ferdigheter</p>
          </div>
          <SettingsDialog />
        </div>

        {/* Overall Progress */}
        <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">
                  {nextTest ? "Prøveklarhet" : "Generell fremgang"}
                </h2>
                <p className="text-muted-foreground">
                  {nextTest 
                    ? (() => {
                        const daysUntil = differenceInDays(nextTest.date, new Date());
                        return (
                          <span className={daysUntil <= 3 ? 'font-semibold text-destructive' : ''}>
                            {daysUntil === 0 ? '🔴 Prøve i dag!' : 
                             daysUntil === 1 ? '⚠️ Prøve i morgen!' : 
                             daysUntil <= 3 ? `⏰ ${nextTest.subject} ${nextTest.title} om ${daysUntil} dager!` :
                             daysUntil <= 7 ? `📅 ${nextTest.subject} ${nextTest.title} om ${daysUntil} dager` :
                             `${nextTest.subject} ${nextTest.title} om ${daysUntil} dager`}
                          </span>
                        );
                      })()
                    : "Ingen kommende prøver registrert"
                  }
                </p>
              </div>
            </div>
            <SkillsBreakdownDialog skills={allSkills} overallReadiness={overallReadiness}>
              <Badge variant="outline" className="text-lg px-4 py-2 cursor-pointer hover:bg-primary/10 transition-colors">
                {overallReadiness}% klar
              </Badge>
            </SkillsBreakdownDialog>
          </div>
          <Progress value={overallReadiness} className="h-3" />
        </Card>

        {/* Top Priorities */}
        {topPriorities.length > 0 && (
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-destructive" />
            <h2 className="text-2xl font-semibold">Viktigste prioriteringer</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {topPriorities.map((skill) => {
              const badge = getMasteryBadge(skill.mastery);
              return (
                <Card key={skill.id} className="p-4 border-l-4 border-l-destructive hover:shadow-lg transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{skill.name}</h3>
                      <Badge className={badge.className}>{skill.mastery}%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{skill.subject}</p>
                    <Link to="/practice">
                      <Button size="sm" className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Øv nå
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
        )}

        {/* Upcoming Tests */}
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Kommende prøver</h2>
          </div>
          
          {upcomingTests.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingTests.slice(0, 4).map((test) => {
                  const daysUntil = differenceInDays(test.date, new Date());
                  const isUrgent = daysUntil <= 7;
                  
                  return (
                    <Card key={test.id} className={`p-4 hover:shadow-lg transition-all ${isUrgent ? 'border-l-4 border-l-destructive' : ''}`}>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{test.title}</h3>
                            <Badge variant="secondary" className="mt-1">{test.subject}</Badge>
                          </div>
                          {isUrgent && (
                            <Badge variant="destructive" className="ml-2">
                              {daysUntil} dager!
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(test.date, 'dd.MM.yyyy')}</span>
                          <span className="mx-1">•</span>
                          <Clock className="h-4 w-4" />
                          <span className={daysUntil <= 3 ? 'font-semibold text-destructive' : ''}>
                            {daysUntil === 0 ? '🔴 I dag!' : 
                             daysUntil === 1 ? '⚠️ I morgen!' : 
                             daysUntil <= 3 ? `⏰ ${daysUntil} dager!` :
                             daysUntil <= 7 ? `📅 ${daysUntil} dager` :
                             `${daysUntil} dager`}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              
              {upcomingTests.length > 4 && (
                <div className="mt-4 text-center">
                  <Link to="/tests">
                    <Button variant="outline" size="sm">
                      Vis alle {upcomingTests.length} kommende prøver
                    </Button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Ingen kommende prøver</h3>
              <p className="text-muted-foreground mb-4">
                Legg til dine kommende prøver for å holde oversikt og få hjelp til å forberede deg
              </p>
              <Link to="/tests">
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Legg til prøve
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/dagens-plan">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer h-full border-2 border-primary/20">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-primary/20">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Dagens plan</h3>
                  <p className="text-sm text-muted-foreground">Hva skal du gjøre i dag?</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to="/insights">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Personlige Innsikter</h3>
                  <p className="text-sm text-muted-foreground">AI lærer hvordan du lærer</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to="/notes">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-success/10">
                  <Brain className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Mine Notater</h3>
                  <p className="text-sm text-muted-foreground">Se alle notater</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to="/ai-chat">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Kompis</h3>
                  <p className="text-sm text-muted-foreground">Chat med AI</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* All Skills */}
        {allSkills.length > 0 && (
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Alle ferdigheter</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allSkills.map((skill) => {
              const badge = getMasteryBadge(skill.mastery);
              const color = getMasteryColor(skill.mastery);
              
              return (
                <Card key={skill.id} className="p-4 hover:shadow-lg transition-all cursor-pointer group">
                  <Link to={skill.hasContent ? `/quiz/${skill.subject.toLowerCase()}` : `/skill/${skill.id}`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {skill.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{skill.subject}</p>
                        </div>
                        <Badge className={badge.className}>{badge.text}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Mestring</span>
                          <span className="font-medium">{skill.mastery}%</span>
                        </div>
                        <Progress 
                          value={skill.mastery} 
                          className={`h-2 ${
                            color === 'success' ? '[&>div]:bg-success' :
                            color === 'warning' ? '[&>div]:bg-warning' :
                            '[&>div]:bg-destructive'
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {skill.lastPracticed}
                      </div>
                      
                      {skill.hasContent && (
                        <div className="flex items-center text-xs text-primary">
                          <Brain className="h-3 w-3 mr-1" />
                          AI-generert innhold tilgjengelig
                        </div>
                      )}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        </Card>
        )}

        {/* Reflection Dialog */}
        {reflectionTest && (
          <TestReflectionDialog
            open={showReflectionDialog}
            onOpenChange={setShowReflectionDialog}
            test={reflectionTest}
          />
        )}

      </div>
    </div>
  );
};

export default Dashboard;