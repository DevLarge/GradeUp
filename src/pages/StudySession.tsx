import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Brain, CheckCircle2, Lightbulb, Target, Clock, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTestContext } from '@/contexts/TestContext';

interface StudySession {
  learningGoals: string[];
  estimatedDuration: string;
  difficulty: string;
  phases: Phase[];
  nextSteps: string[];
}

interface Phase {
  phase: string;
  title: string;
  duration: string;
  content: ContentItem[];
}

interface ContentItem {
  type: string;
  title?: string;
  content?: string;
  points?: string[];
  question?: string;
  hint?: string;
  answer?: string;
  difficulty?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

export default function StudySession() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tests } = useTestContext();
  
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const test = tests.find(t => t.id === testId);

  useEffect(() => {
    if (!test) {
      navigate('/tests');
      return;
    }
    generateSession();
  }, [test, testId]);

  const generateSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Du må være logget inn",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-study-session', {
        body: {
          userId: user.id,
          testId: test?.id,
          subject: test?.subject,
          topics: []
        }
      });

      if (error) throw error;

      setSession(data.session);
    } catch (error) {
      console.error('Error generating session:', error);
      toast({
        title: "Kunne ikke lage økten",
        description: "Prøv igjen senere",
        variant: "destructive"
      });
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const phase = session?.phases[currentPhase];
    if (!phase) return;

    if (currentItem < phase.content.length - 1) {
      setCurrentItem(currentItem + 1);
      setShowHint(false);
      setShowAnswer(false);
      setUserAnswer('');
      setSelectedOption(null);
    } else if (currentPhase < (session?.phases.length || 0) - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentItem(0);
      setShowHint(false);
      setShowAnswer(false);
      setUserAnswer('');
      setSelectedOption(null);
    }
  };

  const handlePrevious = () => {
    if (currentItem > 0) {
      setCurrentItem(currentItem - 1);
      setShowHint(false);
      setShowAnswer(false);
      setUserAnswer('');
      setSelectedOption(null);
    } else if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
      const prevPhase = session?.phases[currentPhase - 1];
      setCurrentItem((prevPhase?.content.length || 1) - 1);
      setShowHint(false);
      setShowAnswer(false);
      setUserAnswer('');
      setSelectedOption(null);
    }
  };

  const getTotalItems = () => {
    return session?.phases.reduce((sum, phase) => sum + phase.content.length, 0) || 0;
  };

  const getCurrentItemIndex = () => {
    let index = 0;
    for (let i = 0; i < currentPhase; i++) {
      index += session?.phases[i].content.length || 0;
    }
    return index + currentItem;
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'forklaring': return <BookOpen className="h-5 w-5" />;
      case 'øving': return <Target className="h-5 w-5" />;
      case 'test': return <CheckCircle2 className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24 flex items-center justify-center">
        <Card className="p-8 text-center space-y-4">
          <Brain className="h-16 w-16 mx-auto animate-pulse text-primary" />
          <h2 className="text-2xl font-bold">Lager din personlige økt...</h2>
          <p className="text-muted-foreground">AI tilpasser innholdet til deg</p>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
        <Card className="p-8 text-center">
          <p>Kunne ikke laste økten</p>
          <Button onClick={() => navigate('/tests')} className="mt-4">
            Tilbake til tester
          </Button>
        </Card>
      </div>
    );
  }

  const totalItems = getTotalItems();
  const currentItemIndex = getCurrentItemIndex();
  const progress = ((currentItemIndex + 1) / totalItems) * 100;
  const currentPhaseData = session.phases[currentPhase];
  const currentContent = currentPhaseData.content[currentItem];
  const isLastItem = currentPhase === session.phases.length - 1 && currentItem === currentPhaseData.content.length - 1;

  // Show introduction
  if (currentPhase === 0 && currentItem === 0 && !showAnswer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tests')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{test?.title}</h1>
              <p className="text-muted-foreground">{test?.subject}</p>
            </div>
          </div>

          <Card className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Etter denne økten skal du kunne...</h2>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {session.estimatedDuration}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {session.difficulty === 'beginner' ? 'Nybegynner' : 
                     session.difficulty === 'intermediate' ? 'Middels' : 'Avansert'}
                  </Badge>
                </div>
              </div>
            </div>

            <ul className="space-y-3">
              {session.learningGoals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-3 text-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-3">Øktens struktur:</h3>
              <div className="grid gap-3">
                {session.phases.map((phase, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                    {getPhaseIcon(phase.phase)}
                    <div className="flex-1">
                      <p className="font-medium capitalize">{phase.phase}: {phase.title}</p>
                      <p className="text-sm text-muted-foreground">{phase.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => setShowAnswer(true)} className="w-full" size="lg">
              Start økten
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tests')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold capitalize">{currentPhaseData.phase}</h1>
              <p className="text-muted-foreground">{currentPhaseData.title}</p>
            </div>
          </div>
          <Badge variant="outline">
            {currentItemIndex + 1} / {totalItems}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fremdrift</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Phase indicators */}
        <div className="flex gap-2">
          {session.phases.map((phase, idx) => (
            <div
              key={idx}
              className={`flex-1 p-2 rounded-lg text-center text-sm ${
                idx === currentPhase
                  ? 'bg-primary text-primary-foreground'
                  : idx < currentPhase
                  ? 'bg-green-600 text-white'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {phase.phase}
            </div>
          ))}
        </div>

        {/* Content */}
        <Card className="p-8 space-y-6">
          {currentContent.type === 'text' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{currentContent.title}</h2>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{currentContent.content}</p>
            </div>
          )}

          {currentContent.type === 'example' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-bold">{currentContent.title}</h2>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-l-4 border-yellow-500">
                <p className="leading-relaxed whitespace-pre-wrap">{currentContent.content}</p>
              </div>
            </div>
          )}

          {currentContent.type === 'key_points' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Viktige punkter</h2>
              <ul className="space-y-2">
                {currentContent.points?.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentContent.type === 'practice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Øvingsoppgave</h2>
                <Badge className={
                  currentContent.difficulty === 'easy' ? 'bg-green-600' :
                  currentContent.difficulty === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                }>
                  {currentContent.difficulty === 'easy' ? 'Lett' :
                   currentContent.difficulty === 'medium' ? 'Middels' : 'Vanskelig'}
                </Badge>
              </div>
              <p className="text-lg">{currentContent.question}</p>
              
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Skriv ditt svar her..."
                className="min-h-[150px]"
              />

              {!showHint && !showAnswer && (
                <Button variant="outline" onClick={() => setShowHint(true)}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Vis hint
                </Button>
              )}

              {showHint && !showAnswer && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium mb-1">💡 Hint:</p>
                  <p>{currentContent.hint}</p>
                </div>
              )}

              {!showAnswer && (
                <Button onClick={() => setShowAnswer(true)} className="w-full">
                  Vis fasit
                </Button>
              )}

              {showAnswer && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <p className="font-medium mb-2">✓ Fasit:</p>
                  <p className="whitespace-pre-wrap">{currentContent.answer}</p>
                </div>
              )}
            </div>
          )}

          {currentContent.type === 'quiz' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Testspørsmål</h2>
              <p className="text-lg">{currentContent.question}</p>

              <div className="space-y-2">
                {currentContent.options?.map((option, idx) => (
                  <Button
                    key={idx}
                    variant={selectedOption === idx ? 'default' : 'outline'}
                    className={`w-full justify-start text-left h-auto p-4 ${
                      showAnswer
                        ? idx === currentContent.correctAnswer
                          ? 'bg-green-100 dark:bg-green-950/20 border-green-500'
                          : selectedOption === idx
                          ? 'bg-red-100 dark:bg-red-950/20 border-red-500'
                          : ''
                        : ''
                    }`}
                    onClick={() => !showAnswer && setSelectedOption(idx)}
                    disabled={showAnswer}
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </Button>
                ))}
              </div>

              {!showAnswer && selectedOption !== null && (
                <Button onClick={() => setShowAnswer(true)} className="w-full">
                  Sjekk svar
                </Button>
              )}

              {showAnswer && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium mb-2">Forklaring:</p>
                  <p>{currentContent.explanation}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPhase === 0 && currentItem === 0}
          >
            Forrige
          </Button>
          <Button onClick={handleNext}>
            {isLastItem ? 'Fullfør' : 'Neste'}
          </Button>
        </div>
      </div>
    </div>
  );
}
