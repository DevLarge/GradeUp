import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, Check, X, Eye } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { toast } from "sonner";

const TestFlashcards = () => {
  const { testId, themeId } = useParams<{ testId: string; themeId: string }>();
  const { tests, addActivity } = useTestContext();
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());
  const [correctCards, setCorrectCards] = useState<Set<number>>(new Set());
  const [studyMode, setStudyMode] = useState<'study' | 'review'>('study');

  const test = tests.find(t => t.id === testId);
  
  if (!test || !test.generatedContent || !test.generatedContent.flashcards) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link to="/flashcard-modes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Tilbake
            </Button>
          </Link>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Ingen flashkort funnet</p>
          </Card>
        </div>
      </div>
    );
  }

  let cards = test.generatedContent.flashcards;
  const decodedTheme = themeId ? decodeURIComponent(themeId) : "alle";
  
  if (decodedTheme !== "alle") {
    cards = cards.filter(card => card.category === decodedTheme);
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link to={`/flashcards/${testId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Tilbake
            </Button>
          </Link>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Ingen flashkort i dette temaet</p>
          </Card>
        </div>
      </div>
    );
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleCorrect = () => {
    setCorrectCards(prev => new Set([...prev, currentCard]));
    setReviewedCards(prev => new Set([...prev, currentCard]));
    nextCard();
  };

  const handleIncorrect = () => {
    setReviewedCards(prev => new Set([...prev, currentCard]));
    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      const scorePercentage = Math.round((correctCards.size / cards.length) * 100);
      
      addActivity({
        id: crypto.randomUUID(),
        subject: test.subject,
        type: 'flashcards',
        score: scorePercentage,
        completedAt: new Date(),
        itemsCompleted: correctCards.size,
        totalItems: cards.length
      });
      
      toast.success("Flashkort fullført! Din prøveklarhet er oppdatert.");
      setStudyMode('review');
    }
  };

  const resetStudy = () => {
    setCurrentCard(0);
    setIsFlipped(false);
    setReviewedCards(new Set());
    setCorrectCards(new Set());
    setStudyMode('study');
  };

  const progress = ((reviewedCards.size) / cards.length) * 100;
  const correctPercentage = reviewedCards.size > 0 ? (correctCards.size / reviewedCards.size) * 100 : 0;

  if (studyMode === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to={`/flashcards/${testId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Øktrunde fullført!</h1>
          </div>

          <Card className="p-8 text-center space-y-6">
            <div className="text-6xl">🎯</div>
            <h2 className="text-2xl font-bold">Bra jobbet!</h2>
            <div className="space-y-4">
              <div className="text-lg">
                Du husket {correctCards.size} av {cards.length} kort
              </div>
              <div className="text-3xl font-bold text-primary">
                {Math.round(correctPercentage)}%
              </div>
              <Progress value={correctPercentage} className="w-full" />
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground">
                {correctPercentage >= 80 ? 
                  "Utmerket! Du behersker dette stoffet godt." :
                  correctPercentage >= 60 ?
                  "Bra! Øv litt mer for bedre resultat." :
                  "Fortsett å øve. Du kommer til å bli bedre!"}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={resetStudy} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Øv igjen
              </Button>
              <Link to={`/flashcards/${testId}`}>
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
          <Link to={`/flashcards/${testId}`}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-muted-foreground">
              {decodedTheme !== "alle" ? decodedTheme : "Alle kort"} • 
              Kort {currentCard + 1} av {cards.length}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fremdrift</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Flashcard */}
        <div className="relative perspective-1000">
          <Card 
            className={`min-h-[300px] cursor-pointer transition-all duration-500 transform-style-preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={handleFlip}
          >
            {/* Front side */}
            <div className={`absolute inset-0 p-8 flex flex-col justify-center items-center text-center space-y-4 backface-hidden ${
              isFlipped ? 'hidden' : 'block'
            }`}>
              <div className="text-sm text-muted-foreground">Spørsmål</div>
              <h2 className="text-2xl font-semibold">{cards[currentCard].front}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-auto">
                <Eye className="h-4 w-4" />
                <span className="text-sm">Klikk for å se svar</span>
              </div>
            </div>

            {/* Back side */}
            <div className={`absolute inset-0 p-8 flex flex-col justify-center items-center text-center space-y-4 backface-hidden bg-secondary/10 ${
              isFlipped ? 'block' : 'hidden'
            }`}>
              <div className="text-sm text-muted-foreground">Svar</div>
              <div className="text-lg leading-relaxed">{cards[currentCard].back}</div>
            </div>
          </Card>
        </div>

        {/* Action buttons */}
        {isFlipped && (
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleIncorrect}
              className="flex-1 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20"
            >
              <X className="h-5 w-5 mr-2" />
              Feil
            </Button>
            <Button 
              variant="default" 
              size="lg"
              onClick={handleCorrect}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-5 w-5 mr-2" />
              Riktig
            </Button>
          </div>
        )}

        {/* Info card */}
        <Card className="p-4 text-center text-sm text-muted-foreground">
          <p>💡 Klikk på kortet for å vise svaret, deretter velg om du svarte riktig eller feil</p>
        </Card>
      </div>
    </div>
  );
};

export default TestFlashcards;
