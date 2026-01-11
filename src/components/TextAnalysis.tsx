import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, BookOpen, TrendingUp } from "lucide-react";
import Anthropic from "@anthropic-ai/sdk";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  subject: string;
  text: string;
  strengths: string[];
  improvements: string[];
  grade: number;
  explanation: string;
}

// Norsk historie-pensum for videregående skoler
const historyTopics = [
  "Første verdenskrig (1914-1918)",
  "Mellomkrigstiden og økonomisk krise", 
  "Andre verdenskrig (1939-1945)",
  "Den kalde krigen (1945-1991)",
  "Dekolonisering og ny verdensorden",
  "Norsk politisk historie 1900-tallet",
  "Industrialisering og urbanisering", 
  "Kvinnekamp og demokratisering",
  "Arbeiderbevegelsen i Norge",
  "Olje og moderne Norge",
  "Miljøbevegelsen og bærekraftig utvikling",
  "Globalisering og teknologi"
];

const TextAnalysis = () => {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [inputText, setInputText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = async () => {
    if (!selectedSubject || !inputText.trim()) return;
    
    const apiKey = localStorage.getItem('anthropic_api_key');
    setIsAnalyzing(true);
    
    try {
      if (apiKey) {
        // Use real AI analysis
        const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
        
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: `Analyser denne teksten for faget ${selectedSubject}. Gi tilbakemelding på følgende format (svar kun med JSON):
{
  "strengths": ["styrke 1", "styrke 2", "styrke 3"],
  "improvements": ["forbedring 1", "forbedring 2", "forbedring 3"],
  "grade": 1-6,
  "explanation": "kort forklaring av karakteren"
}

Tekst å analysere:
${inputText}`
          }]
        });
        
        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          setAnalysisResult({
            subject: selectedSubject,
            text: inputText,
            strengths: analysis.strengths,
            improvements: analysis.improvements,
            grade: analysis.grade,
            explanation: analysis.explanation
          });
        } else {
          throw new Error("Could not parse AI response");
        }
      } else {
        // Fallback to simple analysis
        let result: AnalysisResult;
        switch (selectedSubject) {
          case "Engelsk":
            result = analyzeEnglish(inputText);
            break;
          case "Norsk":
            result = analyzeNorwegian(inputText);
            break;
          case "Matematikk":
            result = analyzeMath(inputText);
            break;
          case "Historie":
            result = analyzeHistory(inputText);
            break;
          default:
            result = {
              subject: selectedSubject,
              text: inputText,
              strengths: ["Teksten er levert inn"],
              improvements: ["Velg et gyldig fag for analyse"],
              grade: 1,
              explanation: "Kunne ikke analysere - ugyldig fag"
            };
        }
        setAnalysisResult(result);
      }
    } catch (error) {
      toast({
        title: "Feil ved analyse",
        description: "Kunne ikke analysere teksten. Sjekk API-nøkkelen din.",
        variant: "destructive"
      });
      setIsAnalyzing(false);
      return;
    }
    
    setIsAnalyzing(false);
  };

  const analyzeEnglish = (text: string): AnalysisResult => {
    const wordCount = text.split(' ').length;
    const hasVariedVocab = text.length > 200;
    const hasComplexSentences = text.includes(',') && text.includes('.');
    const hasGoodStructure = text.split('\n').length > 1;
    
    let grade = 2;
    let strengths: string[] = [];
    let improvements: string[] = [];
    
    if (wordCount >= 100) {
      grade++;
      strengths.push("Tilfredsstillende tekstlengde");
    } else {
      improvements.push("Utvid teksten for bedre utfoldelse av temaet");
    }
    
    if (hasVariedVocab) {
      grade++;
      strengths.push("Variert ordforråd");
    } else {
      improvements.push("Bruk mer variert og presist ordforråd");
    }
    
    if (hasComplexSentences) {
      grade++;
      strengths.push("God setningsstruktur med variasjon");
    } else {
      improvements.push("Variere setningslengde og bruk sammensatte setninger");
    }
    
    if (hasGoodStructure) {
      strengths.push("Tydelig tekststruktur");
    } else {
      improvements.push("Del teksten inn i avsnitt for bedre struktur");
    }
    
    return {
      subject: "Engelsk",
      text,
      strengths,
      improvements,
      grade: Math.min(6, grade),
      explanation: `Basert på språklig kompetanse, kommunikasjon og tekststruktur i henhold til engelskfagets kompetansemål.`
    };
  };

  const analyzeNorwegian = (text: string): AnalysisResult => {
    const wordCount = text.split(' ').length;
    const hasAnalysis = text.toLowerCase().includes('analyse') || text.toLowerCase().includes('drøft');
    const hasStructure = text.split('\n').length > 2;
    const hasGoodLanguage = text.includes(',') && text.includes('.');
    
    let grade = 2;
    let strengths: string[] = [];
    let improvements: string[] = [];
    
    if (wordCount >= 150) {
      grade++;
      strengths.push("God utfoldelse av temaet");
    } else {
      improvements.push("Utvid teksten med mer dybdeanalyse");
    }
    
    if (hasAnalysis) {
      grade++;
      strengths.push("Viser analytisk tenkning");
    } else {
      improvements.push("Inkluder mer analyse og refleksjon");
    }
    
    if (hasStructure) {
      grade++;
      strengths.push("Klar tekststruktur med avsnitt");
    } else {
      improvements.push("Del teksten inn i logiske avsnitt");
    }
    
    if (hasGoodLanguage) {
      strengths.push("Tilfredsstillende språkføring");
    } else {
      improvements.push("Fokuser på variert setningsstruktur og rettskriving");
    }
    
    return {
      subject: "Norsk",
      text,
      strengths,
      improvements,
      grade: Math.min(6, grade),
      explanation: "Vurdert etter innhold, struktur, språk og analytisk evne i norskfaget."
    };
  };

  const analyzeMath = (text: string): AnalysisResult => {
    const hasCalculations = /\d+/.test(text);
    const hasFormulas = text.includes('=') || text.includes('+') || text.includes('-');
    const hasExplanation = text.split(' ').length > 20;
    const hasSteps = text.includes('1.') || text.includes('2.') || text.includes('først');
    
    let grade = 2;
    let strengths: string[] = [];
    let improvements: string[] = [];
    
    if (hasCalculations) {
      grade++;
      strengths.push("Inkluderer relevante tall og beregninger");
    } else {
      improvements.push("Vis konkrete beregninger og tall i løsningen");
    }
    
    if (hasFormulas) {
      grade++;
      strengths.push("Bruker matematiske uttrykk og formler");
    } else {
      improvements.push("Inkluder relevante formler og matematiske uttrykk");
    }
    
    if (hasExplanation) {
      grade++;
      strengths.push("God forklaring av fremgangsmåte");
    } else {
      improvements.push("Gi tydeligere forklaring av løsningsmetoden");
    }
    
    if (hasSteps) {
      strengths.push("Strukturert fremstilling av løsningstrinn");
    } else {
      improvements.push("Del opp løsningen i tydelige steg");
    }
    
    return {
      subject: "Matematikk",
      text,
      strengths,
      improvements,
      grade: Math.min(6, grade),
      explanation: "Vurdert etter faglig forståelse, utregninger, nøyaktighet og forklaringer."
    };
  };

  const analyzeHistory = (text: string): AnalysisResult => {
    const hasHistoricalFacts = /\d{4}/.test(text); // År
    const hasCriticalThinking = text.toLowerCase().includes('fordi') || text.toLowerCase().includes('årsak');
    const hasSources = text.toLowerCase().includes('kilde') || text.toLowerCase().includes('dokument');
    const hasContextualUnderstanding = text.split(' ').length > 100;
    
    let grade = 2;
    let strengths: string[] = [];
    let improvements: string[] = [];
    
    if (hasHistoricalFacts) {
      grade++;
      strengths.push("Inkluderer konkrete historiske fakta og årstall");
    } else {
      improvements.push("Inkluder relevante årstall og historiske fakta");
    }
    
    if (hasCriticalThinking) {
      grade++;
      strengths.push("Viser årsak-virkning-forståelse");
    } else {
      improvements.push("Analyser årsaker og konsekvenser mer dyptgående");
    }
    
    if (hasSources) {
      grade++;
      strengths.push("Viser kildekritisk bevissthet");
    } else {
      improvements.push("Inkluder kildekritiske vurderinger");
    }
    
    if (hasContextualUnderstanding) {
      strengths.push("God kontekstuell forståelse");
    } else {
      improvements.push("Utvid med mer historisk kontekst");
    }
    
    return {
      subject: "Historie",
      text,
      strengths,
      improvements,
      grade: Math.min(6, grade),
      explanation: "Vurdert etter fagkunnskap, kildekritikk, resonnement og historisk forståelse."
    };
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 5) return "text-success";
    if (grade >= 4) return "text-warning";
    return "text-destructive";
  };

  const getGradeText = (grade: number) => {
    const gradeTexts: { [key: number]: string } = {
      6: "Fremragende kompetanse",
      5: "Meget god kompetanse", 
      4: "God kompetanse",
      3: "Nokså god kompetanse",
      2: "Lav kompetanse",
      1: "Svært lav kompetanse"
    };
    return gradeTexts[grade] || "Ukjent nivå";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Tekstanalyse</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Velg fag</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Velg fag for analyse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Norsk">Norsk</SelectItem>
                <SelectItem value="Matematikk">Matematikk</SelectItem>
                <SelectItem value="Engelsk">Engelsk</SelectItem>
                <SelectItem value="Historie">Historie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Tekst for analyse
              {selectedSubject === "Historie" && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Relevant pensum: {historyTopics.slice(0, 3).join(", ")} m.fl.
                </span>
              )}
            </label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Skriv inn teksten du vil analysere for ${selectedSubject || "valgt fag"}...`}
              rows={6}
              className="resize-none"
            />
          </div>
          
          <Button 
            onClick={analyzeText}
            disabled={!selectedSubject || !inputText.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? "Analyserer..." : "Analyser tekst"}
          </Button>
        </div>
      </Card>

      {analysisResult && (
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-success" />
            <h3 className="text-xl font-semibold">Analyse for {analysisResult.subject}</h3>
            <Badge className={`ml-auto ${getGradeColor(analysisResult.grade)}`}>
              Karakter: {analysisResult.grade}/6
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">{getGradeText(analysisResult.grade)}</p>
              <p className="text-xs text-muted-foreground mt-1">{analysisResult.explanation}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-success/5 border-success/20">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h4 className="font-semibold">Styrker</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  {analysisResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-success text-xs mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </Card>
              
              <Card className="p-4 bg-warning/5 border-warning/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <h4 className="font-semibold">Forbedringsområder</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  {analysisResult.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-warning text-xs mt-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </Card>
      )}

      {selectedSubject === "Historie" && (
        <Card className="p-4 bg-muted/50">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Historie-pensum for videregående skole
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {historyTopics.map((topic, index) => (
              <Badge key={index} variant="outline" className="justify-start">
                {topic}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TextAnalysis;