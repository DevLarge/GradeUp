import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useTestContext } from '@/contexts/TestContext';
import { format, differenceInDays } from 'date-fns';
import { nb } from 'date-fns/locale';

const QuizModes = () => {
  const { tests } = useTestContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/practice">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Quiz</h1>
            <p className="text-muted-foreground">Dine registrerte prøver</p>
          </div>
        </div>

        {/* Tests List */}
        {tests.length > 0 ? (
          <div className="space-y-3">
            {tests.map((test) => {
              const daysUntil = differenceInDays(test.date, new Date());
              const isPast = daysUntil < 0;
              const hasQuizzes = test.generatedContent && test.generatedContent.quizzes.length > 0;
              
              return (
                <Link key={test.id} to={hasQuizzes ? `/quiz/${test.id}` : '#'}>
                  <Card className={`${isPast ? "opacity-60" : "bg-primary/5"} ${hasQuizzes ? "cursor-pointer hover:shadow-lg transition-all" : "cursor-not-allowed"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{test.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{test.subject}</p>
            {hasQuizzes ? (
              <p className="text-xs text-success mt-1">
                ✓ {test.generatedContent.quizzes.length} tema tilgjengelig
              </p>
            ) : (
                            <p className="text-xs text-warning mt-1">
                              ⚠ Ingen quiz generert - last opp dokumenter
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm ml-4">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div className="text-right">
                            <div className="font-medium">
                              {format(test.date, 'd. MMM yyyy', { locale: nb })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isPast 
                                ? 'Gjennomført' 
                                : daysUntil === 0 
                                  ? 'I dag' 
                                  : daysUntil === 1 
                                    ? 'I morgen' 
                                    : `Om ${daysUntil} dager`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Ingen prøver lagt til</h3>
            <p className="text-muted-foreground mb-4">
              Legg til dine prøver i "Tester"-fanen for å se dem her
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

export default QuizModes;