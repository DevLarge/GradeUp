import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";

const TestTest = () => {
  const { testId } = useParams<{ testId: string }>();
  const { tests } = useTestContext();
  
  const test = tests.find(t => t.id === testId);
  const questions = test?.generatedContent?.tests || [];
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const totalTime = questions.length * 15; // 15 minutes per question

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/test-modes">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Ingen test tilgjengelig</h1>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Denne prøven har ingen genererte testspørsmål. Last opp dokumenter i Tester-fanen for å generere innhold.
            </p>
            <Link to="/tests-tab">
              <Button>Gå til Tester</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = () => {
    setTestCompleted(true);
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setTimeLeft(totalTime * 60); // Convert to seconds
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTestCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/test-modes">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{test.title}</h1>
          </div>

          <Card className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Testinformasjon</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Antall spørsmål:</p>
                  <p>{questions.length}</p>
                </div>
                <div>
                  <p className="font-medium">Total poeng:</p>
                  <p>{totalPoints}</p>
                </div>
                <div>
                  <p className="font-medium">Estimert tid:</p>
                  <p>{totalTime} minutter</p>
                </div>
                <div>
                  <p className="font-medium">Testtype:</p>
                  <p>Øvingsprøve</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Instruksjoner:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Les alle spørsmål nøye før du svarer</li>
                <li>• Du kan navigere mellom spørsmålene</li>
                <li>• Husk å lagre svarene dine</li>
                <li>• Bruk hele tiden som er tilgjengelig</li>
              </ul>
            </div>

            <Button onClick={handleStartTest} className="w-full" size="lg">
              Start test
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/test-modes">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Test fullført!</h1>
          </div>

          <Card className="p-8 text-center space-y-6">
            <div className="text-6xl">📝</div>
            <h2 className="text-2xl font-bold">Test innlevert!</h2>
            <p className="text-muted-foreground">
              Din test har blitt lagret. Her er fasitene:
            </p>
            <div className="space-y-4 text-left">
              {questions.map((q, idx) => (
                <Card key={q.id} className="p-4">
                  <h3 className="font-semibold mb-2">Spørsmål {idx + 1}: {q.question}</h3>
                  <div className="space-y-2">
                    <div className="bg-secondary/50 p-3 rounded">
                      <p className="text-sm font-medium mb-1">Ditt svar:</p>
                      <p className="text-sm">{answers[q.id] || "Ikke besvart"}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium mb-1">Fasit:</p>
                      <p className="text-sm">{q.answer}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <Link to="/test-modes">
                <Button>Tilbake til tester</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with timer */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/test-modes">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{test.title}</h1>
              <p className="text-muted-foreground">
                Spørsmål {currentQuestion + 1} av {questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress */}
        <Progress value={((currentQuestion + 1) / questions.length) * 100} />

        {/* Question */}
        <Card className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold flex-1">
              {questions[currentQuestion].question}
            </h2>
            <div className="text-sm text-muted-foreground ml-4">
              {questions[currentQuestion].points} poeng
            </div>
          </div>

          <Textarea
            value={answers[questions[currentQuestion].id] || ''}
            onChange={(e) => handleAnswerChange(questions[currentQuestion].id, e.target.value)}
            placeholder="Skriv ditt svar her..."
            className="min-h-[200px]"
          />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              Forrige
            </Button>

            <div className="flex gap-2">
              {currentQuestion < questions.length - 1 ? (
                <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                  Neste
                </Button>
              ) : (
                <Button onClick={handleSubmitTest} variant="default">
                  Lever test
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Question navigation */}
        <Card className="p-4">
          <div className="flex gap-2 flex-wrap">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestion === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                className="w-12 h-12"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestTest;
