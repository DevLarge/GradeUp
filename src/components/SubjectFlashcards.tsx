import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, Check, X, Eye } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { toast } from "sonner";
import { useLearningTracking } from "@/hooks/useLearningTracking";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  category: string;
}

const sampleFlashcards: Record<string, Flashcard[]> = {
  norsk: [
    {
      id: 1,
      front: "Hvem skrev 'Hunger'?",
      back: "Knut Hamsun (1890). En modernistisk roman som skildrer en sulten kunstners kamp i Kristiania.",
      category: "Litteratur"
    },
    {
      id: 2,
      front: "Hva er en metafor?",
      back: "En overført betydning hvor man sammenligner to ulike ting uten å bruke 'som' eller 'liksom'.",
      category: "Språk"
    },
    {
      id: 3,
      front: "Når ble 'Et dukkehjem' skrevet?",
      back: "1879 av Henrik Ibsen. Et drama om Nora som forlater sitt hjem for å finne seg selv.",
      category: "Litteratur"
    },
    {
      id: 4,
      front: "Hva er alliterasjon?",
      back: "Gjentakelse av samme konsonantlyd i begynnelsen av ord som står nær hverandre.",
      category: "Språk"
    }
  ],
  matematikk: [
    {
      id: 1,
      front: "Hva er den deriverte av x²?",
      back: "2x (ved bruk av potensregelen: d/dx[x^n] = n·x^(n-1))",
      category: "Derivasjon"
    },
    {
      id: 2,
      front: "Løs: x² - 5x + 6 = 0",
      back: "x = 2 eller x = 3 (faktorisering: (x-2)(x-3) = 0)",
      category: "Ligninger"
    },
    {
      id: 3,
      front: "Hva er abc-formelen?",
      back: "x = (-b ± √(b²-4ac)) / 2a for ligningen ax² + bx + c = 0",
      category: "Ligninger"
    },
    {
      id: 4,
      front: "Hva er integralet av 2x?",
      back: "x² + C (konstant C må alltid legges til ved ubestemt integral)",
      category: "Integrasjon"
    }
  ],
  engelsk: [
    {
      id: 1,
      front: "Present perfect tense of 'go'",
      back: "has/have gone (I have gone, she has gone)",
      category: "Grammar"
    },
    {
      id: 2,
      front: "Difference between 'affect' and 'effect'",
      back: "Affect = verb (to influence), Effect = noun (the result)",
      category: "Vocabulary"
    },
    {
      id: 3,
      front: "What is a metaphor?",
      back: "A figure of speech that compares two things without using 'like' or 'as'",
      category: "Literature"
    },
    {
      id: 4,
      front: "Past tense of 'bring'",
      back: "brought (irregular verb)",
      category: "Grammar"
    }
  ],
  historie: [
    {
      id: 1,
      front: "Når ble Norges grunnlov vedtatt?",
      back: "17. mai 1814 på Eidsvoll av 112 menn (Riksforsamlingen)",
      category: "Grunnlov"
    },
    {
      id: 2,
      front: "Hvem var Harald Hårfagre?",
      back: "Norges første konge (ca. 872-930). Samlet Norge til ett rike etter slaget ved Hafrsfjord.",
      category: "Middelalder"
    },
    {
      id: 3,
      front: "Hva skjedde i 1905?",
      back: "Norge ble selvstendig fra Sverige. Stortinget valgte prins Carl av Danmark til konge (Haakon VII).",
      category: "Unionen"
    },
    {
      id: 4,
      front: "Når begynte andre verdenskrig for Norge?",
      back: "9. april 1940 da Tyskland invaderte Norge (Operation Weserübung)",
      category: "Andre verdenskrig"
    }
  ]
};

const SubjectFlashcards = () => {
  const { subject } = useParams<{ subject: string }>();
  const { addActivity } = useTestContext();
  const { trackActivity } = useLearningTracking();
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());
  const [correctCards, setCorrectCards] = useState<Set<number>>(new Set());
  const [studyMode, setStudyMode] = useState<'study' | 'review'>('study');

  const cards = sampleFlashcards[subject || 'norsk'] || sampleFlashcards.norsk;
  const subjectName = subject === 'matematikk' ? 'Matematikk' : 
                      subject === 'engelsk' ? 'Engelsk' : 
                      subject === 'historie' ? 'Historie' : 'Norsk';

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

  const nextCard = async () => {
    setIsFlipped(false);
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      const scorePercentage = Math.round((correctCards.size / cards.length) * 100);
      
      // Track learning activity
      await trackActivity({
        activityType: 'flashcard',
        subject: subjectName,
        score: scorePercentage,
        totalQuestions: cards.length,
        difficultyLevel: 'medium',
        metadata: {
          correctCards: correctCards.size,
          reviewMode: 'flashcard'
        }
      });
      
      // Register activity (backwards compatibility)
      addActivity({
        id: crypto.randomUUID(),
        subject: subjectName,
        type: 'flashcards',
        score: scorePercentage,
        completedAt: new Date(),
        itemsCompleted: correctCards.size,
        totalItems: cards.length
      });
      
      toast.success(`Flashkort fullført! Din AI-kompis har lært seg mer om deg.`);
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
            <Link to="/flashcard-modes">
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
              <Link to="/flashcard-modes">
                <Button>Tilbake til flashkort</Button>
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
          <Link to="/flashcard-modes">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{subjectName} Flashkort</h1>
            <p className="text-muted-foreground">
              Kort {currentCard + 1} av {cards.length} • {cards[currentCard].category}
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

export default SubjectFlashcards;