import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Brain } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTestContext } from '@/contexts/TestContext';
import { Badge } from "@/components/ui/badge";

const TestQuizThemes = () => {
  const { testId } = useParams<{ testId: string }>();
  const { tests } = useTestContext();
  
  const test = tests.find(t => t.id === testId);
  const themes = test?.generatedContent?.quizzes || [];

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/quiz-modes">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Prøve ikke funnet</h1>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Denne prøven finnes ikke.</p>
            <Link to="/quiz-modes">
              <Button>Tilbake til quiz-modus</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/quiz-modes">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Ingen quiz tilgjengelig</h1>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Denne prøven har ingen genererte quiz-spørsmål. Last opp dokumenter i Tester-fanen for å generere innhold.
            </p>
            <Link to="/tests-tab">
              <Button>Gå til Tester</Button>
            </Link>
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
          <Link to="/quiz-modes">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-muted-foreground">Velg et tema å øve på</p>
          </div>
        </div>

        {/* Themes List */}
        <div className="space-y-4">
          {themes.map((theme) => (
            <Link key={theme.id} to={`/quiz/${testId}/${theme.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Brain className="h-6 w-6 text-primary" />
                        <h3 className="font-semibold text-xl">{theme.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {theme.description}
                      </p>
                      <Badge variant="secondary">
                        {theme.questions.length} spørsmål
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestQuizThemes;
