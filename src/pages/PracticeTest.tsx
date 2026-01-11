import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, ChevronLeft, ChevronRight, Send, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLearningTracking } from '@/hooks/useLearningTracking';

export default function PracticeTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackActivity } = useLearningTracking();
  
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, timeLeft]);

  const fetchTest = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_tests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data.completed_at) {
        // Test already completed
        setTest(data);
        const savedAnswers = typeof data.answers === 'object' && data.answers !== null 
          ? data.answers as Record<string, string>
          : {};
        setAnswers(savedAnswers);
      } else {
        setTest(data);
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke laste øveprøve.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setStarted(true);
    setTimeLeft(test.time_limit_minutes * 60);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate score
      let score = 0;
      const wrongAnswers = [];
      
      test.questions.forEach((q: any) => {
        const userAnswer = answers[q.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
        
        if (isCorrect) {
          score += q.points;
        } else if (userAnswer) {
          wrongAnswers.push({
            question: q.question,
            userAnswer,
            correctAnswer: q.correctAnswer,
          });
        }
      });

      // Update test
      const { error: updateError } = await supabase
        .from('practice_tests')
        .update({
          completed_at: new Date().toISOString(),
          score,
          answers,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Track activity
      await trackActivity({
        activityType: 'test',
        subject: test.subject,
        score,
        totalQuestions: test.total_questions,
        difficultyLevel: test.difficulty_level,
        metadata: { testType: 'practice_test' },
      });

      // Generate explanations for wrong answers
      if (wrongAnswers.length > 0) {
        await supabase.functions.invoke('analyze-answers', {
          body: {
            userId: user.id,
            activityId: id,
            activityType: 'practice_test',
            subject: test.subject,
            wrongAnswers,
          }
        });
      }

      toast({
        title: 'Øveprøve levert!',
        description: 'Din besvarelse er analysert.',
      });

      navigate('/explanations');
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke levere øveprøve.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold">Øveprøve ikke funnet</h1>
        <Button onClick={() => navigate('/practice-tests')} className="mt-4">
          Tilbake til øveprøver
        </Button>
      </div>
    );
  }

  if (test.completed_at) {
    const percentage = (test.score / test.questions.reduce((sum: number, q: any) => sum + q.points, 0)) * 100;
    
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Øveprøve fullført!</h1>
          <div className="text-6xl font-bold mb-4">
            {Math.round(percentage)}%
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            {test.score} av {test.questions.reduce((sum: number, q: any) => sum + q.points, 0)} poeng
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/explanations')}>
              Se forklaringer
            </Button>
            <Button variant="outline" onClick={() => navigate('/practice-tests')}>
              Tilbake
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/practice-tests')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til øveprøver
        </Button>
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">{test.title}</h1>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Fag:</span>
              <span className="font-semibold">{test.subject}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Antall spørsmål:</span>
              <span className="font-semibold">{test.total_questions}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Tidsbegrensning:</span>
              <span className="font-semibold">{test.time_limit_minutes} minutter</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Vanskelighetsgrad:</span>
              <span className="font-semibold">
                {test.difficulty_level === 'easy' ? 'Lett' : test.difficulty_level === 'medium' ? 'Medium' : 'Vanskelig'}
              </span>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg mb-8">
            <h3 className="font-semibold mb-2">Viktig informasjon:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Du får ikke tilbakemelding før prøven er levert</li>
              <li>Timeren starter når du klikker "Start prøve"</li>
              <li>Prøven leveres automatisk når tiden er ute</li>
              <li>Du får detaljerte forklaringer på feil svar etterpå</li>
            </ul>
          </div>

          <Button onClick={startTest} className="w-full" size="lg">
            <Clock className="mr-2 h-5 w-5" />
            Start prøve
          </Button>
        </Card>
      </div>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.total_questions) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (confirm('Er du sikker på at du vil forlate øveprøven? Fremgangen din vil ikke bli lagret.')) {
            navigate('/practice-tests');
          }
        }}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Avbryt øveprøve
      </Button>
      <Card className="p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{test.title}</h2>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5" />
            <span className={timeLeft < 300 ? 'text-destructive' : ''}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground">
          Spørsmål {currentQuestion + 1} av {test.total_questions}
        </p>
      </Card>

      <Card className="p-8 mb-4">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold flex-1">{question.question}</h3>
            <span className="text-sm font-medium text-muted-foreground ml-4">
              {question.points} poeng
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Emne: {question.topic}
          </p>
        </div>

        {question.type === 'multiple_choice' ? (
          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value={option} id={`q${question.id}-${idx}`} />
                <Label htmlFor={`q${question.id}-${idx}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Skriv ditt svar her..."
            className="min-h-[200px]"
          />
        )}
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Forrige
        </Button>

        <div className="flex gap-2">
          {test.questions.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-8 h-8 rounded ${
                idx === currentQuestion
                  ? 'bg-primary text-primary-foreground'
                  : answers[test.questions[idx].id]
                  ? 'bg-success/20 text-success'
                  : 'bg-muted'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestion === test.total_questions - 1 ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Leverer...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Lever prøve
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(prev => Math.min(test.total_questions - 1, prev + 1))}
          >
            Neste
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}