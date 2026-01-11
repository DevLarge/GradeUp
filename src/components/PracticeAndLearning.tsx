import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckSquare, FileText, CreditCard, BookOpen, PlayCircle, FileType } from "lucide-react";
import { Link } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface LearningMode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  bgColor: string;
  textColor: string;
}

const PracticeAndLearning = () => {
  const { tests } = useTestContext();
  const [practiceTestCount, setPracticeTestCount] = useState(0);
  const [explanationCount, setExplanationCount] = useState(0);

  // Calculate counts from context
  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get practice tests count
      const { data: practiceTests } = await supabase
        .from('practice_tests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);
      
      setPracticeTestCount(practiceTests?.length || 0);

      // Get explanations count
      const { data: explanations } = await supabase
        .from('explanations')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);
      
      setExplanationCount(explanations?.length || 0);
    };

    fetchCounts();
  }, []);

  // Count content from all tests
  const totalQuizzes = tests.reduce((sum, test) => 
    sum + (test.generatedContent?.quizzes?.length || 0), 0
  );
  
  const totalTests = tests.reduce((sum, test) => 
    sum + (test.generatedContent?.tests?.length || 0), 0
  );
  
  const totalFlashcards = tests.reduce((sum, test) => 
    sum + (test.generatedContent?.flashcards?.length || 0), 0
  );
  
  const totalReadingTexts = tests.reduce((sum, test) => 
    sum + (test.generatedContent?.readingTexts?.length || 0), 0
  );

  const learningModes: LearningMode[] = [
    {
      id: "practice-tests",
      title: "Øveprøver",
      description: "Tren i realistiske prøvesituasjoner med tidsbegrensning",
      icon: <CheckSquare className="h-6 w-6" />,
      count: practiceTestCount,
      color: "hsl(var(--primary))",
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      id: "tests",
      title: "Tester",
      description: "Generer øvingsprøver fra ditt pensum",
      icon: <CheckSquare className="h-6 w-6" />,
      count: totalTests,
      color: "hsl(var(--destructive))",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      textColor: "text-red-700 dark:text-red-300"
    },
    {
      id: "quizzes",
      title: "Quiz",
      description: "Generer quiz fra ditt materiale",
      icon: <FileText className="h-6 w-6" />,
      count: totalQuizzes,
      color: "hsl(var(--warning))",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      textColor: "text-yellow-700 dark:text-yellow-300"
    },
    {
      id: "flashcards",
      title: "Flashkort",
      description: "Generer flashkort fra ditt materiale",
      icon: <CreditCard className="h-6 w-6" />,
      count: totalFlashcards,
      color: "hsl(var(--info))",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      textColor: "text-cyan-700 dark:text-cyan-300"
    },
    {
      id: "reading",
      title: "Lesing",
      description: "Les tekster på ulike temaer for å lære",
      icon: <BookOpen className="h-6 w-6" />,
      count: totalReadingTexts,
      color: "hsl(var(--accent))",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    {
      id: "explainers",
      title: "Forklaringer",
      description: "Se AI-genererte forklaringer på feil svar",
      icon: <PlayCircle className="h-6 w-6" />,
      count: explanationCount,
      color: "hsl(var(--destructive))",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      textColor: "text-pink-700 dark:text-pink-300"
    },
    {
      id: "templates",
      title: "Maler",
      description: "Finn maler for hvordan du skriver tekster, kortsvar og langsvar",
      icon: <FileType className="h-6 w-6" />,
      count: 0,
      color: "hsl(var(--info))",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      textColor: "text-indigo-700 dark:text-indigo-300"
    }
  ];
  const getNavigationPath = (modeId: string) => {
    switch(modeId) {
      case "practice-tests": return "/practice-tests";
      case "tests": return "/test-modes";
      case "quizzes": return "/quiz-modes";
      case "flashcards": return "/flashcard-modes";
      case "reading": return "/reading";
      case "explainers": return "/explanations";
      case "templates": return "/templates";
      default: return "/practice";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Øving og læring</h1>
            <p className="text-muted-foreground">Velg hvordan du vil øve</p>
          </div>
        </div>

        {/* Learning Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learningModes.map((mode) => {
            const navigationPath = getNavigationPath(mode.id);
            return (
              <Link key={mode.id} to={navigationPath}>
                <Card 
                  className={`p-6 cursor-pointer hover:shadow-lg transition-all ${mode.bgColor} h-full`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <div className="text-primary">
                            {mode.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{mode.title}</h3>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium"
                      >
                        {mode.count}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {mode.description}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PracticeAndLearning;