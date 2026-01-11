import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, CheckCircle2, CreditCard } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";

interface FlashcardTheme {
  id: string;
  title: string;
  count: number;
  completed: boolean;
}

const TestFlashcardThemes = () => {
  const { testId } = useParams<{ testId: string }>();
  const { tests } = useTestContext();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const test = tests.find(t => t.id === testId);
  
  if (!test || !test.generatedContent || !test.generatedContent.flashcards || test.generatedContent.flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/flashcard-modes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Ingen flashkort tilgjengelig</h1>
          </div>
          <Card className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Last opp dokumenter for å generere flashkort for denne prøven.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Group flashcards by category/theme
  const flashcardsByTheme = test.generatedContent.flashcards.reduce((acc, card, idx) => {
    const theme = card.category || "Generelt";
    if (!acc[theme]) {
      acc[theme] = [];
    }
    acc[theme].push({ ...card, originalIndex: idx });
    return acc;
  }, {} as Record<string, any[]>);

  const themes: FlashcardTheme[] = Object.keys(flashcardsByTheme).map(themeName => ({
    id: themeName,
    title: themeName,
    count: flashcardsByTheme[themeName].length,
    completed: false
  }));

  const totalCards = test.generatedContent.flashcards.length;
  const completedThemes = themes.filter(t => t.completed).length;
  const progress = (completedThemes / themes.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/flashcard-modes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-muted-foreground">{test.subject} • {totalCards} flashkort</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Fremdrift</span>
              <span className="text-muted-foreground">
                {completedThemes} av {themes.length} temaer
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>

        {/* Themes Grid */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Velg tema</h2>
          {themes.map((theme) => (
            <Link key={theme.id} to={`/flashcards/${testId}/${encodeURIComponent(theme.id)}`}>
              <Card className="p-4 hover:shadow-lg transition-all cursor-pointer bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{theme.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {theme.count} kort
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {theme.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Play className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Start all button */}
        <Link to={`/flashcards/${testId}/alle`}>
          <Button className="w-full" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Start alle kort ({totalCards})
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TestFlashcardThemes;
