import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, MessageSquare, ScrollText, BookOpen, CheckSquare, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  content: string;
  example: string;
  color: string;
}

const templates: Template[] = [
  {
    id: "short-answer",
    title: "Kortsvar",
    description: "Mal for korte og konsise svar",
    icon: <MessageSquare className="h-6 w-6" />,
    category: "Oppgavetyper",
    color: "bg-blue-50 dark:bg-blue-950/20",
    content: "Struktur for kortsvar:\n\n1. Start med et direkte svar på spørsmålet\n2. Gi en kort forklaring eller begrunnelse\n3. Bruk fagterminologi\n4. Hold svaret mellom 2-4 setninger\n\nTips: Vær presis og unngå unødvendige detaljer.",
    example: "Spørsmål: Hva er fotosyntese?\n\nSvar: Fotosyntese er prosessen der planter omdanner sollys til kjemisk energi. Gjennom denne prosessen bruker plantene karbondioksid og vann for å produsere glukose og oksygen."
  },
  {
    id: "long-answer",
    title: "Langsvar",
    description: "Mal for utfyllende og detaljerte svar",
    icon: <ScrollText className="h-6 w-6" />,
    category: "Oppgavetyper",
    color: "bg-purple-50 dark:bg-purple-950/20",
    content: "Struktur for langsvar:\n\n1. Innledning: Presenter temaet og definer nøkkelbegreper\n2. Hoveddel: Utvid med detaljer, eksempler og forklaringer\n   - Punkt 1 med utdyping\n   - Punkt 2 med utdyping\n   - Punkt 3 med utdyping\n3. Avslutning: Oppsummer hovedpoengene\n\nTips: Bruk overganger mellom avsnitt og strukturer svaret logisk.",
    example: "Spørsmål: Forklar industrialiseringen i Norge.\n\nSvar: Industrialiseringen i Norge begynte senere enn i andre europeiske land, hovedsakelig på 1800-tallet.\n\nDet var flere faktorer som bidro til dette: Tilgang på vannkraft la grunnlaget for industri, mens økt handel og kapitaltilgang muliggjorde investeringer...\n\nSamlet sett førte industrialiseringen til store samfunnsendringer i Norge."
  },
  {
    id: "essay-structure",
    title: "Essaystruktur",
    description: "Mal for å skrive gode essays",
    icon: <FileText className="h-6 w-6" />,
    category: "Skriftlige tekster",
    color: "bg-green-50 dark:bg-green-950/20",
    content: "Essaystruktur:\n\n1. Innledning (10%)\n   - Fang oppmerksomhet\n   - Present problemstilling\n   - Angi disposisjon\n\n2. Hoveddel (80%)\n   - Argument 1 med belegg\n   - Argument 2 med belegg\n   - Motargument og tilbakevising\n\n3. Konklusjon (10%)\n   - Oppsummer argumenter\n   - Svar på problemstilling\n   - Avslutt sterkt\n\nTips: Hver paragraf bør ha ett hovedpoeng.",
    example: "Tittel: Betydningen av miljøvern\n\nI en tid med økende klimautfordringer er miljøvern viktigere enn noensinne. Dette essayet vil diskutere hvorfor...\n\nFor det første viser forskning at...\n\nAvslutningsvis kan vi konkludere at..."
  },
  {
    id: "analysis",
    title: "Tekstanalyse",
    description: "Mal for å analysere tekster",
    icon: <BookOpen className="h-6 w-6" />,
    category: "Skriftlige tekster",
    color: "bg-yellow-50 dark:bg-yellow-950/20",
    content: "Struktur for tekstanalyse:\n\n1. Innledning\n   - Forfatter, tittel, sjanger\n   - Kort sammendrag\n   - Tema/budskap\n\n2. Analyse\n   - Språk og virkemidler\n   - Struktur og komposisjon\n   - Symbolikk og billedbruk\n\n3. Tolkning\n   - Budskap og mening\n   - Sammenheng med kontekst\n\n4. Konklusjon\n   - Oppsummer analysen\n   - Egen vurdering\n\nTips: Bruk sitater fra teksten som dokumentasjon.",
    example: "Analyse av 'Terje Vigen' av Henrik Ibsen:\n\nDiktet handler om Terje Vigen, en mann som opplever tragedie under Napoleonskrigene...\n\nIbsen bruker havmetaforikk gjennomgående i diktet..."
  },
  {
    id: "summary",
    title: "Sammendrag",
    description: "Mal for å skrive gode sammendrag",
    icon: <CheckSquare className="h-6 w-6" />,
    category: "Skriftlige tekster",
    color: "bg-red-50 dark:bg-red-950/20",
    content: "Struktur for sammendrag:\n\n1. Les teksten nøye først\n2. Identifiser hovedbudskap\n3. Plukk ut viktigste poeng\n4. Skriv med egne ord\n5. Hold det kort og konsist\n\nRetningslinjer:\n- Bruk ca. 1/4 av originaltekstens lengde\n- Inkluder kun hovedpoeng\n- Ikke ta med egne meninger\n- Bruk nåtid\n- Vær objektiv\n\nTips: Et godt sammendrag skal kunne leses alene.",
    example: "Originalartikkel om klimaendringer (1000 ord)\n\nSammendrag (250 ord):\nArtikkelen diskuterer klimaendringenes påvirkning på Norge. Hovedpunktene er økte temperaturer, endrede nedbørsmønstre og konsekvenser for natur og samfunn..."
  },
  {
    id: "problem-solving",
    title: "Problemløsning",
    description: "Mal for å løse mattematiske oppgaver",
    icon: <Lightbulb className="h-6 w-6" />,
    category: "Oppgavetyper",
    color: "bg-orange-50 dark:bg-orange-950/20",
    content: "Struktur for problemløsning:\n\n1. Forstå problemet\n   - Les nøye\n   - Hva er kjent?\n   - Hva skal du finne?\n\n2. Planlegg løsningen\n   - Hvilken metode/formel?\n   - Tegn skisse hvis relevant\n\n3. Utfør beregningen\n   - Vis alle steg\n   - Inkluder enheter\n\n4. Kontroller svaret\n   - Er det rimelig?\n   - Stemmer enheten?\n\n5. Konkluder\n   - Svar på opprinnelig spørsmål\n\nTips: Vis alltid utregningene dine.",
    example: "Oppgave: En bil kjører 180 km på 2 timer. Hva er gjennomsnittsfarten?\n\nKjent: s = 180 km, t = 2 t\nSøker: v = ?\n\nFormel: v = s/t\n\nUtregning: v = 180 km / 2 t = 90 km/t\n\nSvar: Gjennomsnittsfarten er 90 km/t."
  }
];

const TemplatesMode = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/practice">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Maler</h1>
            <p className="text-muted-foreground">Finn maler for ulike skriftlige oppgaver</p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`p-6 hover:shadow-lg transition-all cursor-pointer ${template.color}`}
              onClick={() => handleTemplateClick(template)}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <div className="text-primary">
                      {template.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{template.title}</h3>
                    <Badge variant="secondary" className="mb-2">
                      {template.category}
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      {template.description}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Vis mal
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Template Details Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedTemplate?.icon}
                <span>{selectedTemplate?.title}</span>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                <div>
                  <Badge variant="secondary">{selectedTemplate?.category}</Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Struktur og tips:</h4>
                  <Card className="p-4 bg-muted/50">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {selectedTemplate?.content}
                    </pre>
                  </Card>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Eksempel:</h4>
                  <Card className="p-4 bg-primary/5">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {selectedTemplate?.example}
                    </pre>
                  </Card>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTemplate?.content || "");
                    setShowDialog(false);
                  }}
                >
                  Kopier mal
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TemplatesMode;
