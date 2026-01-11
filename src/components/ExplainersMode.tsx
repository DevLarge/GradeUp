import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTestContext } from "@/contexts/TestContext";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExplanationStep {
  step: number;
  title: string;
  description: string;
}

const ExplainersMode = () => {
  const { tests } = useTestContext();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Mock explanation steps - in production, this would come from AI
  const getExplanationSteps = (testId: string): ExplanationStep[] => {
    return [
      {
        step: 1,
        title: "Les oppgaven nøye",
        description: "Start med å lese hele oppgaven og identifiser hva som blir spurt om. Marker nøkkelord og viktig informasjon."
      },
      {
        step: 2,
        title: "Identifiser relevant teori",
        description: "Tenk over hvilke formler, teoremer eller konsepter som er relevante for denne oppgaven."
      },
      {
        step: 3,
        title: "Sett opp løsningen",
        description: "Skriv ned de kjente variablene og hvilken formel eller metode du skal bruke. Organiser informasjonen på en oversiktlig måte."
      },
      {
        step: 4,
        title: "Gjennomfør beregningene",
        description: "Utfør beregningene steg for steg. Vis alle mellomregninger slik at du kan sjekke arbeidet ditt underveis."
      },
      {
        step: 5,
        title: "Sjekk svaret",
        description: "Kontroller at svaret er rimelig. Ser det riktig ut? Har du riktige enheter? Stemmer det med det som blir spurt om?"
      }
    ];
  };

  const handleTestSelect = (testId: string) => {
    setSelectedTest(testId);
    setShowExplanation(true);
  };

  const selectedTestData = tests.find(t => t.id === selectedTest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/practice">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Forklaringer</h1>
            <p className="text-muted-foreground">Velg en prøve for steg-for-steg forklaringer</p>
          </div>
        </div>

        {tests.length === 0 ? (
          <Card className="p-8 text-center">
            <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Ingen prøver lagt til ennå</h3>
            <p className="text-muted-foreground mb-4">
              Legg til prøver i Tester-fanen for å få forklaringer
            </p>
            <Link to="/tests">
              <Button>Gå til Tester</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <Card 
                key={test.id} 
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleTestSelect(test.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <PlayCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{test.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{test.subject}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(test.date).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Klikk for steg-for-steg forklaring av oppgavene
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Explanation Dialog */}
        <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Steg-for-steg forklaring</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {selectedTestData && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">{selectedTestData.title}</h3>
                    <Badge variant="secondary">{selectedTestData.subject}</Badge>
                  </div>
                )}
                
                {selectedTest && getExplanationSteps(selectedTest).map((step) => (
                  <Card key={step.step} className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ExplainersMode;
