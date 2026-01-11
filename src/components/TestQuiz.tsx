import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShuffledQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  category?: string;
  shuffledOptions: string[];
  shuffledCorrect: number;
}

// Function to shuffle questions
const shuffleQuestions = (questions: any[]): ShuffledQuestion[] => {
  return questions.map(q => {
    const indices = q.options.map((_: any, i: number) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return {
      ...q,
      shuffledOptions: indices.map(i => q.options[i]),
      shuffledCorrect: indices.indexOf(q.correct)
    };
  });
};

const TestQuiz = () => {
  const { testId, themeId } = useParams<{ testId: string; themeId: string }>();
  const navigate = useNavigate();
  const { tests } = useTestContext();
  
  const test = tests.find(t => t.id === testId);
  const theme = test?.generatedContent?.quizzes.find(q => q.id === themeId);
  const originalQuestions = theme?.questions || [];
  const questions = useMemo(() => shuffleQuestions(originalQuestions), [theme]);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [quizSessionId] = useState(crypto.randomUUID());
  const [wrongQuestions, setWrongQuestions] = useState<ShuffledQuestion[]>([]);
  const [isRetryPhase, setIsRetryPhase] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [retryAnswers, setRetryAnswers] = useState<number[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  if (!test || !theme || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to={`/quiz/${testId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Ingen quiz tilgjengelig</h1>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Denne quizen har ingen spørsmål.
            </p>
            <Link to={`/quiz/${testId}`}>
              <Button>Tilbake til temaer</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    setShowResult(true);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) return;

    const currentQ = (isRetryPhase ? wrongQuestions : questions)[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.shuffledCorrect;

    // Lagre svaret til databasen
    if (userId) {
      await supabase.from('question_attempts').insert({
        user_id: userId,
        question_text: currentQ.question,
        user_answer: currentQ.shuffledOptions[selectedAnswer],
        correct_answer: currentQ.shuffledOptions[currentQ.shuffledCorrect],
        is_correct: isCorrect,
        subject: test?.subject || 'Unknown',
        topic: currentQ.category,
        quiz_type: 'test_quiz',
        quiz_session_id: quizSessionId,
        attempt_count: isRetryPhase ? 2 : 1,
        mastered: isRetryPhase && isCorrect
      });
    }

    if (isCorrect) {
      setScore(score + 1);
    }

    // Store answers
    if (isRetryPhase) {
      setRetryAnswers([...retryAnswers, selectedAnswer]);
    } else {
      setUserAnswers([...userAnswers, selectedAnswer]);
      if (!isCorrect) {
        setWrongQuestions([...wrongQuestions, currentQ]);
      }
    }
    
    setShowResult(false);
    setSelectedAnswer(null);

    // Sjekk om vi er ferdig med første runde
    if (!isRetryPhase && currentQuestion + 1 >= questions.length) {
      if (wrongQuestions.length > 0) {
        // Start repetisjon
        setIsRetryPhase(true);
        setCurrentQuestion(0);
        toast.info(`La oss repetere ${wrongQuestions.length} spørsmål du fikk feil`);
        return;
      }
    }

    // Sjekk om vi er ferdig med retry-fase
    if (isRetryPhase && currentQuestion + 1 >= wrongQuestions.length) {
      const finalScore = selectedAnswer === currentQ.shuffledCorrect ? score + 1 : score;
      const scorePercentage = Math.round((finalScore / questions.length) * 100);
      
      // Save to database if user is logged in
      if (userId && test) {
        const { error } = await supabase.from('quiz_results').insert({
          user_id: userId,
          subject: test.subject,
          quiz_type: 'test_quiz',
          score: finalScore,
          total_questions: questions.length,
          percentage: scorePercentage,
          test_id: testId,
          theme_id: themeId
        });

        if (error) {
          console.error('Error saving quiz result:', error);
          toast.error('Kunne ikke lagre resultatet');
        } else {
          toast.success(`Quiz fullført! Din prøveklarhet er oppdatert.`);
        }

        // Generer forklaringer for feil svar
        const allWrongAnswers = [];
        
        questions.forEach((q, idx) => {
          if (userAnswers[idx] !== q.shuffledCorrect) {
            allWrongAnswers.push({
              question: q.question,
              userAnswer: q.shuffledOptions[userAnswers[idx]],
              correctAnswer: q.shuffledOptions[q.shuffledCorrect],
              topic: q.category || test.subject
            });
          }
        });

        if (isRetryPhase) {
          wrongQuestions.forEach((q, idx) => {
            if (retryAnswers[idx] !== q.shuffledCorrect) {
              allWrongAnswers.push({
                question: q.question,
                userAnswer: q.shuffledOptions[retryAnswers[idx]],
                correctAnswer: q.shuffledOptions[q.shuffledCorrect],
                topic: q.category || test.subject,
                isRetry: true
              });
            }
          });
        }

        if (allWrongAnswers.length > 0) {
          try {
            await supabase.functions.invoke('analyze-answers', {
              body: {
                userId,
                activityId: quizSessionId,
                activityType: 'test_quiz',
                subject: test.subject,
                wrongAnswers: allWrongAnswers
              }
            });
            toast.success(`${allWrongAnswers.length} forklaringer lagret`);
          } catch (error) {
            console.error('Error generating explanations:', error);
          }
        }
      }
      
      setQuizCompleted(true);
      return;
    }

    // Neste spørsmål
    if (isRetryPhase) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
    setWrongQuestions([]);
    setIsRetryPhase(false);
    setUserAnswers([]);
    setRetryAnswers([]);
  };

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to={`/quiz/${testId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Quiz fullført!</h1>
          </div>

          <Card className="p-8 text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold">Gratulerer!</h2>
            <p className="text-xl">Du fikk {score} av {questions.length} riktige svar</p>
            <div className="text-lg">
              Score: {Math.round((score / questions.length) * 100)}%
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={resetQuiz} variant="outline">
                Prøv igjen
              </Button>
              <Link to={`/quiz/${testId}`}>
                <Button>Tilbake til temaer</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/quiz/${testId}`}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {theme.title} {isRetryPhase && "- Repetisjon"}
            </h1>
            <p className="text-muted-foreground">
              Spørsmål {currentQuestion + 1} av {isRetryPhase ? wrongQuestions.length : questions.length}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{isRetryPhase ? "Repetisjon" : "Fremdrift"}</span>
            <span>{Math.round(((currentQuestion + 1) / (isRetryPhase ? wrongQuestions.length : questions.length)) * 100)}%</span>
          </div>
          <Progress value={((currentQuestion + 1) / (isRetryPhase ? wrongQuestions.length : questions.length)) * 100} />
        </div>

        {isRetryPhase && (
          <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-500">
            <p className="text-sm font-medium">
              💡 La oss repetere spørsmålene du fikk feil!
            </p>
          </Card>
        )}

        {/* Question Card */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">
            {(isRetryPhase ? wrongQuestions : questions)[currentQuestion].question}
          </h2>

          <div className="space-y-3">
            {(isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledOptions.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? "default" : "outline"}
                className={`w-full justify-start p-4 h-auto text-left ${
                  showResult ? 
                    index === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrect ? 
                      "bg-green-100 border-green-500 text-green-700 dark:bg-green-950/20" :
                      selectedAnswer === index ? 
                        "bg-red-100 border-red-500 text-red-700 dark:bg-red-950/20" : 
                        "" : 
                    ""
                }`}
                onClick={() => !showResult && handleAnswerSelect(index)}
                disabled={showResult}
              >
                <div className="flex items-center gap-3">
                  {showResult && index === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrect && (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {showResult && selectedAnswer === index && index !== (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrect && (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Forklaring */}
          {showResult && (isRetryPhase ? wrongQuestions : questions)[currentQuestion].explanation && (
            <Card className={`p-4 ${
              selectedAnswer === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrect
                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                : "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {selectedAnswer === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrect ? "✅" : "❌"}
                </span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">
                    {selectedAnswer === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrect
                      ? isRetryPhase ? "Flott! Nå har du forstått det! 🎉" : "Riktig!"
                      : isRetryPhase ? "Dette må vi øve mer på." : "Feil."}
                  </p>
                  <p className="text-sm">
                    {(isRetryPhase ? wrongQuestions : questions)[currentQuestion].explanation}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            {!showResult ? (
              <Button 
                onClick={handleSubmitAnswer} 
                disabled={selectedAnswer === null}
              >
                Svar
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {isRetryPhase 
                  ? (currentQuestion + 1 < wrongQuestions.length ? 'Neste spørsmål' : 'Fullfør quiz')
                  : (currentQuestion + 1 < questions.length ? 'Neste spørsmål' : (wrongQuestions.length > 0 ? 'Gå videre til repetisjon' : 'Fullfør quiz'))
                }
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestQuiz;
