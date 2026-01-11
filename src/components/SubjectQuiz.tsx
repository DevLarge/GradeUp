import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Brain, TrendingUp, Target, Lightbulb } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLearningTracking } from "@/hooks/useLearningTracking";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic?: string;
}

interface ShuffledQuestion extends Question {
  shuffledOptions: string[];
  shuffledCorrectAnswer: number;
}

interface QuizAnalysis {
  overallPerformance: string;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  topicsToReview: string[];
  motivationalMessage: string;
  masteryLevel: string;
  score: number;
  totalQuestions: number;
  percentage: number;
}

const sampleQuestions: Record<string, Question[]> = {
  norsk: [
    {
      id: 1,
      question: "Hvilken forfatter skrev 'Hunger'?",
      options: ["Knut Hamsun", "Henrik Ibsen", "Bjørnstjerne Bjørnson", "Alexander Kielland"],
      correctAnswer: 0,
      explanation: "Knut Hamsun skrev romanen 'Hunger' i 1890."
    },
    {
      id: 2,
      question: "Hva er hovedtemaet i 'Et dukkehjem'?",
      options: ["Kjærlighet", "Kvinnefrigjøring", "Familie", "Penger"],
      correctAnswer: 1,
      explanation: "Et dukkehjem fokuserer på kvinnefrigjøring og Noras kamp for selvstendighet."
    }
  ],
  matematikk: [
    {
      id: 1,
      question: "Hva er løsningen for x² - 5x + 6 = 0?",
      options: ["x = 2, x = 3", "x = 1, x = 6", "x = -2, x = -3", "x = 0, x = 5"],
      correctAnswer: 0,
      explanation: "Faktorisering: (x-2)(x-3) = 0, så x = 2 eller x = 3."
    },
    {
      id: 2,
      question: "Hva er den deriverte av f(x) = 3x²?",
      options: ["6x", "3x", "x²", "6x²"],
      correctAnswer: 0,
      explanation: "Den deriverte av 3x² er 6x ved bruk av potensregelen."
    }
  ],
  engelsk: [
    {
      id: 1,
      question: "Which is the correct past tense of 'go'?",
      options: ["goed", "went", "gone", "going"],
      correctAnswer: 1,
      explanation: "'Went' is the past tense of 'go'."
    },
    {
      id: 2,
      question: "What is a metaphor?",
      options: ["A direct comparison", "An indirect comparison", "A sound effect", "A rhyme"],
      correctAnswer: 1,
      explanation: "A metaphor is an indirect comparison between two unlike things."
    }
  ],
  historie: [
    {
      id: 1,
      question: "Når fikk Norge sin grunnlov?",
      options: ["1814", "1815", "1813", "1816"],
      correctAnswer: 0,
      explanation: "Norges grunnlov ble vedtatt 17. mai 1814 på Eidsvoll."
    },
    {
      id: 2,
      question: "Hvem var Norges første konge?",
      options: ["Harald Hårfagre", "Olav Tryggvason", "Magnus den gode", "Haakon den gode"],
      correctAnswer: 0,
      explanation: "Harald Hårfagre regnes som Norges første konge."
    }
  ]
};

// Function to shuffle array and track correct answer
const shuffleQuestions = (questions: Question[]): ShuffledQuestion[] => {
  return questions.map(q => {
    const indices = q.options.map((_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return {
      ...q,
      shuffledOptions: indices.map(i => q.options[i]),
      shuffledCorrectAnswer: indices.indexOf(q.correctAnswer)
    };
  });
};

const SubjectQuiz = () => {
  const { subject } = useParams<{ subject: string }>();
  const { addActivity } = useTestContext();
  const { trackActivity } = useLearningTracking();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [quizSessionId] = useState(crypto.randomUUID());
  const [wrongQuestions, setWrongQuestions] = useState<ShuffledQuestion[]>([]);
  const [isRetryPhase, setIsRetryPhase] = useState(false);
  const [retryAnswers, setRetryAnswers] = useState<number[]>([]);

  const originalQuestions = sampleQuestions[subject || 'norsk'] || sampleQuestions.norsk;
  const questions = useMemo(() => shuffleQuestions(originalQuestions), [subject]);
  const subjectName = subject === 'matematikk' ? 'Matematikk' : 
                      subject === 'engelsk' ? 'Engelsk' : 
                      subject === 'historie' ? 'Historie' : 'Norsk';

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return; // Ikke tillat endring etter at forklaring er vist
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) return;

    const currentQ = questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.shuffledCorrectAnswer;

    // Lagre svaret til databasen
    if (userId) {
      await supabase.from('question_attempts').insert({
        user_id: userId,
        question_text: currentQ.question,
        question_id: currentQ.id?.toString(),
        user_answer: currentQ.shuffledOptions[selectedAnswer],
        correct_answer: currentQ.shuffledOptions[currentQ.shuffledCorrectAnswer],
        is_correct: isCorrect,
        subject: subjectName,
        quiz_type: 'subject_quiz',
        quiz_session_id: quizSessionId,
        attempt_count: isRetryPhase ? 2 : 1,
        mastered: isRetryPhase && isCorrect
      });
    }

    // Store the answer
    if (isRetryPhase) {
      const newRetryAnswers = [...retryAnswers, selectedAnswer];
      setRetryAnswers(newRetryAnswers);
    } else {
      const newAnswers = [...userAnswers, selectedAnswer];
      setUserAnswers(newAnswers);
      
      // Samle feil spørsmål for repetisjon
      if (!isCorrect) {
        setWrongQuestions([...wrongQuestions, currentQ]);
      }
    }

    setSelectedAnswer(null);
    setShowExplanation(false);

    // Sjekk om vi er ferdig med første runde
    if (!isRetryPhase && currentQuestion + 1 >= questions.length) {
      if (wrongQuestions.length > 0) {
        // Start repetisjon av feil spørsmål
        setIsRetryPhase(true);
        setCurrentQuestion(0);
        toast.info(`La oss repetere ${wrongQuestions.length} spørsmål du fikk feil`);
        return;
      }
    }

    // Sjekk om vi er ferdig med retry-fase
    if (isRetryPhase && currentQuestion + 1 >= wrongQuestions.length) {
      // Quiz completed - analyze results
      setQuizCompleted(true);
      setAnalyzing(true);

      // Calculate score (både første runde og retry)
      let totalScore = userAnswers.reduce((total, answer, idx) => {
        return total + (answer === questions[idx].shuffledCorrectAnswer ? 1 : 0);
      }, 0);

      if (isRetryPhase) {
        totalScore += retryAnswers.reduce((total, answer, idx) => {
          return total + (answer === wrongQuestions[idx].shuffledCorrectAnswer ? 1 : 0);
        }, 0);
      }

      const totalQuestions = questions.length + (isRetryPhase ? wrongQuestions.length : 0);
      const scorePercentage = Math.round((totalScore / questions.length) * 100);

      // Track learning activity
      await trackActivity({
        activityType: 'quiz',
        subject: subjectName,
        score: scorePercentage,
        totalQuestions: questions.length,
        difficultyLevel: 'medium',
        metadata: {
          correctAnswers: totalScore,
          quizType: 'subject_quiz',
          hadRetry: isRetryPhase
        }
      });

      // Save to database if user is logged in
      if (userId) {
        const { error } = await supabase.from('quiz_results').insert({
          user_id: userId,
          subject: subjectName,
          quiz_type: 'subject_quiz',
          score: totalScore,
          total_questions: questions.length,
          percentage: scorePercentage
        });

        if (error) {
          console.error('Error saving quiz result:', error);
        }

        // Generer forklaringer for ALLE feil svar (både første og andre forsøk)
        const allWrongAnswers = [];
        
        // Feil fra første runde
        questions.forEach((q, idx) => {
          if (userAnswers[idx] !== q.shuffledCorrectAnswer) {
            allWrongAnswers.push({
              question: q.question,
              userAnswer: q.shuffledOptions[userAnswers[idx]],
              correctAnswer: q.shuffledOptions[q.shuffledCorrectAnswer],
              topic: q.topic || subjectName
            });
          }
        });

        // Feil fra retry-fase (hvis det var retry)
        if (isRetryPhase) {
          wrongQuestions.forEach((q, idx) => {
            if (retryAnswers[idx] !== q.shuffledCorrectAnswer) {
              allWrongAnswers.push({
                question: q.question,
                userAnswer: q.shuffledOptions[retryAnswers[idx]],
                correctAnswer: q.shuffledOptions[q.shuffledCorrectAnswer],
                topic: q.topic || subjectName,
                isRetry: true
              });
            }
          });
        }

        // Kall analyze-answers for å generere forklaringer
        if (allWrongAnswers.length > 0) {
          try {
            await supabase.functions.invoke('analyze-answers', {
              body: {
                userId,
                activityId: quizSessionId,
                activityType: 'subject_quiz',
                subject: subjectName,
                wrongAnswers: allWrongAnswers
              }
            });
            toast.success(`${allWrongAnswers.length} forklaringer lagret`);
          } catch (error) {
            console.error('Error generating explanations:', error);
          }
        }

        // Prepare answers for AI analysis
        const answersData = questions.map((q, idx) => ({
          question: q.question,
          userAnswer: userAnswers[idx],
          correctAnswer: q.shuffledCorrectAnswer,
          isCorrect: userAnswers[idx] === q.shuffledCorrectAnswer
        }));

        // Call AI analysis
        try {
          const { data, error: analysisError } = await supabase.functions.invoke('analyze-quiz-results', {
            body: {
              userId,
              subject: subjectName,
              answers: answersData,
              score: totalScore,
              totalQuestions: questions.length
            }
          });

          if (analysisError) throw analysisError;

          setAnalysis(data.analysis);
          toast.success('Quiz analysert!');
        } catch (error) {
          console.error('Error analyzing quiz:', error);
          toast.error('Kunne ikke analysere quizzen');
          // Fallback to simple result
          setAnalysis({
            overallPerformance: `Du fikk ${totalScore} av ${questions.length} riktige svar (${scorePercentage}%)`,
            strengths: ['Fullførte quizzen'],
            weaknesses: [],
            nextSteps: ['Prøv igjen for å forbedre scoren'],
            topicsToReview: [],
            motivationalMessage: 'Bra jobbet!',
            masteryLevel: scorePercentage >= 80 ? 'advanced' : scorePercentage >= 60 ? 'intermediate' : 'beginner',
            score: totalScore,
            totalQuestions: questions.length,
            percentage: scorePercentage
          });
        }
      }

      // Also save to local context for backwards compatibility
      addActivity({
        id: quizSessionId,
        subject: subjectName,
        type: 'quiz',
        score: scorePercentage,
        completedAt: new Date(),
        itemsCompleted: totalScore,
        totalItems: questions.length
      });

      setAnalyzing(false);
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
    setShowExplanation(false);
    setUserAnswers([]);
    setRetryAnswers([]);
    setWrongQuestions([]);
    setIsRetryPhase(false);
    setQuizCompleted(false);
    setAnalysis(null);
  };

  const getMasteryColor = (level: string) => {
    switch(level) {
      case 'advanced': return 'bg-green-600';
      case 'intermediate': return 'bg-yellow-600';
      default: return 'bg-orange-600';
    }
  };

  if (quizCompleted && analyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6 flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center space-y-6">
            <Brain className="h-16 w-16 mx-auto animate-pulse text-primary" />
            <h2 className="text-2xl font-bold">AI analyserer svarene dine...</h2>
            <p className="text-muted-foreground">
              Dette tar bare noen sekunder
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (quizCompleted && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/quiz-modes">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Quiz-analyse</h1>
          </div>

          {/* Score Overview */}
          <Card className="p-8 text-center space-y-4">
            <div className="text-6xl mb-4">
              {analysis.percentage >= 80 ? '🎉' : analysis.percentage >= 60 ? '👍' : '💪'}
            </div>
            <h2 className="text-3xl font-bold">{analysis.score}/{analysis.totalQuestions}</h2>
            <Progress value={analysis.percentage} className="h-3" />
            <Badge className={getMasteryColor(analysis.masteryLevel)}>
              {analysis.percentage}% - {analysis.masteryLevel === 'advanced' ? 'Avansert' : 
                analysis.masteryLevel === 'intermediate' ? 'Middels' : 'Nybegynner'}
            </Badge>
            <p className="text-lg text-muted-foreground italic">
              "{analysis.motivationalMessage}"
            </p>
          </Card>

          {/* Overall Performance */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Oppsummering
            </h3>
            <p className="text-muted-foreground">{analysis.overallPerformance}</p>
          </Card>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                Styrker
              </h3>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Target className="h-5 w-5" />
                Forbedringsområder
              </h3>
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">→</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Topics to Review */}
          {analysis.topicsToReview.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Tema å repetere</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.topicsToReview.map((topic, idx) => (
                  <Badge key={idx} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Neste steg
            </h3>
            <ol className="space-y-3">
              {analysis.nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button onClick={resetQuiz} variant="outline">
              Prøv igjen
            </Button>
            <Link to="/quiz-modes">
              <Button>Tilbake til quiz-modus</Button>
            </Link>
            <Link to="/insights">
              <Button variant="secondary">
                <Brain className="h-4 w-4 mr-2" />
                Se læringsprofil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/quiz-modes">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {subjectName} Quiz {isRetryPhase && "- Repetisjon"}
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
              💡 La oss repetere spørsmålene du fikk feil. Hvis du svarer riktig nå, markeres de som "forstått"!
            </p>
          </Card>
        )}

        {/* Question Card */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">
            {(isRetryPhase ? wrongQuestions : questions)[currentQuestion].question}
          </h2>

          <div className="space-y-3">
            {(isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledOptions.map((option, index) => {
              const currentQ = (isRetryPhase ? wrongQuestions : questions)[currentQuestion];
              const isCorrect = index === currentQ.shuffledCorrectAnswer;
              const isSelected = selectedAnswer === index;
              const showResult = showExplanation;
              
              let buttonVariant: "default" | "outline" | "destructive" = "outline";
              let additionalClasses = "";
              
              if (showResult) {
                if (isCorrect) {
                  additionalClasses = "border-green-500 bg-green-50 dark:bg-green-950/20";
                } else if (isSelected && !isCorrect) {
                  additionalClasses = "border-red-500 bg-red-50 dark:bg-red-950/20";
                }
              } else if (isSelected) {
                buttonVariant = "default";
              }
              
              return (
                <Button
                  key={index}
                  variant={buttonVariant}
                  className={`w-full justify-start p-4 h-auto text-left ${additionalClasses}`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                    {showResult && isCorrect && <span className="ml-auto text-green-600 dark:text-green-400">✓</span>}
                    {showResult && isSelected && !isCorrect && <span className="ml-auto text-red-600 dark:text-red-400">✗</span>}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Forklaring */}
          {showExplanation && (
            <Card className={`p-4 ${
              selectedAnswer === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrectAnswer
                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                : "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {selectedAnswer === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrectAnswer ? "✅" : "❌"}
                </span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">
                    {selectedAnswer === (isRetryPhase ? wrongQuestions : questions)[currentQuestion].shuffledCorrectAnswer
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
            <Button 
              onClick={handleNextQuestion} 
              disabled={!showExplanation}
            >
              {isRetryPhase 
                ? (currentQuestion + 1 < wrongQuestions.length ? 'Neste spørsmål' : 'Fullfør quiz')
                : (currentQuestion + 1 < questions.length ? 'Neste spørsmål' : (wrongQuestions.length > 0 ? 'Gå videre til repetisjon' : 'Fullfør quiz'))
              }
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubjectQuiz;
