import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  skill: string;
  subject: string;
  explanation: string;
}

const mockQuestions: Question[] = [
  {
    id: "1",
    question: "Løs for x: 2x + 5 = 13",
    options: ["x = 4", "x = 6", "x = 8", "x = 9"],
    correctAnswer: 0,
    skill: "Lineære ligninger",
    subject: "Matematikk",
    explanation: "Trekk fra 5 på begge sider: 2x = 8, deretter del på 2: x = 4"
  },
  {
    id: "2", 
    question: "Hva skjer med etterspurt mengde når prisen øker?",
    options: ["Øker", "Synker", "Forblir den samme", "Blir null"],
    correctAnswer: 1,
    skill: "Tilbud og etterspørsel",
    subject: "Økonomi",
    explanation: "I følge etterspørselsloven, når prisen øker, synker etterspurt mengde (omvendt forhold)."
  },
  {
    id: "3",
    question: "Hvilket år sluttet andre verdenskrig?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: 1,
    skill: "Andre verdenskrig",
    subject: "Historie",
    explanation: "Andre verdenskrig sluttet i 1945 med Japans kapitulasjon etter atombombene."
  }
];

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = mockQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, isCorrect];
    setAnswers(newAnswers);
    
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const score = answers.filter(Boolean).length;
    const percentage = Math.round((score / answers.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center shadow-lg">
            <div className="space-y-6">
              <div className="text-6xl">🎉</div>
              <h1 className="text-3xl font-bold">Quiz fullført!</h1>
              <div className="space-y-4">
                <div className="text-4xl font-bold text-primary">{percentage}%</div>
                <p className="text-lg text-muted-foreground">
                  Du fikk {score} av {answers.length} spørsmål riktig
                </p>
              </div>
              
              {/* Skills Impact */}
              <Card className="p-4 bg-gradient-to-r from-success/10 to-success/5">
                <h3 className="font-semibold mb-2">Ferdigheter oppdatert</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lineære ligninger</span>
                    <Badge className="bg-success text-success-foreground">+5% mestring</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tilbud og etterspørsel</span>
                    <Badge className="bg-success text-success-foreground">+3% mestring</Badge>
                  </div>
                </div>
              </Card>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={resetQuiz} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Ta på nytt
                </Button>
                <Link to="/">
                  <Button>Tilbake til oversikt</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="outline">← Tilbake til oversikt</Button>
          </Link>
          <Badge variant="outline">
            Spørsmål {currentQuestion + 1} av {mockQuestions.length}
          </Badge>
        </div>

        {/* Progress */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fremgang</span>
              <span>{Math.round(((currentQuestion + 1) / mockQuestions.length) * 100)}%</span>
            </div>
            <Progress value={((currentQuestion + 1) / mockQuestions.length) * 100} />
          </div>
        </Card>

        {/* Question */}
        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="secondary">{question.subject} • {question.skill}</Badge>
              <h2 className="text-2xl font-semibold">{question.question}</h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => {
                let buttonClass = "justify-start text-left h-auto p-4 font-normal";
                
                if (showResult) {
                  if (index === question.correctAnswer) {
                    buttonClass += " bg-success/20 border-success text-success-foreground hover:bg-success/30";
                  } else if (index === selectedAnswer && selectedAnswer !== question.correctAnswer) {
                    buttonClass += " bg-destructive/20 border-destructive text-destructive-foreground";
                  }
                } else {
                  buttonClass += " hover:bg-secondary/50";
                }

                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={buttonClass}
                    onClick={() => !showResult && handleAnswer(index)}
                    disabled={showResult}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && index === question.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      {showResult && index === selectedAnswer && selectedAnswer !== question.correctAnswer && (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Result & Explanation */}
            {showResult && (
              <Card className={`p-4 ${isCorrect ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-semibold">
                      {isCorrect ? "Riktig!" : "Feil"}
                    </span>
                  </div>
                  <p className="text-sm">{question.explanation}</p>
                </div>
              </Card>
            )}

            {/* Next Button */}
            {showResult && (
              <Button onClick={handleNext} className="w-full">
                {currentQuestion < mockQuestions.length - 1 ? (
                  <>
                    Neste spørsmål
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  "Fullfør quiz"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;