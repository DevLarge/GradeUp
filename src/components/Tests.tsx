import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, FileText, ArrowLeft, Upload, BookOpen, Brain, Zap, Trash2, ClipboardCheck } from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTestContext, type GeneratedContent, type Test, type Assessment } from "@/contexts/TestContext";
import { AIService } from "@/utils/aiService";
import { AIServiceBackend } from "@/utils/aiServiceBackend";
import TextAnalysis from "./TextAnalysis";
import TestReflectionDialog from "./TestReflectionDialog";
import { supabase } from "@/integrations/supabase/client";
import { ALL_SUBJECTS } from "@/constants/subjects";

const Tests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tests, addTest, deleteTest } = useTestContext();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Test form state
  const [testDate, setTestDate] = useState<Date>();
  const [testSubject, setTestSubject] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [assignmentSheet, setAssignmentSheet] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Get past tests that haven't been reflected on yet
  const pastTestsForReflection = tests.filter(test => isPast(test.date));

  const generateContentFromFiles = async (files: File[], subject: string, testDate: Date): Promise<GeneratedContent> => {
    console.log('🚀 STARTER AI-GENERERING');
    console.log(`📁 Antall filer: ${files.length}`);
    console.log(`📚 Fag: ${subject}`);
    console.log(`📅 Prøvedato: ${testDate.toLocaleDateString()}`);
    
    let combinedContent = "";
    
    // Analyze each file using backend
    for (const file of files) {
      console.log(`\n📄 Analyserer fil ${files.indexOf(file) + 1}/${files.length}: ${file.name}`);
      try {
        const text = await AIService.readFileContent(file);
        const analysis = await AIServiceBackend.analyzeDocument(text, subject);
        combinedContent += analysis + "\n\n";
      } catch (error) {
        console.error(`Feil ved analysering av ${file.name}:`, error);
        throw error;
      }
    }
    
    console.log(`\n✅ Alle filer analysert. Total innholdslengde: ${combinedContent.length} tegn`);
    console.log('\n🎯 Genererer quizer, tester, flashkort og lesetekster parallelt...');
    
    // Generate content using backend services
    const [quizzes, tests, flashcards, readingTexts] = await Promise.all([
      AIServiceBackend.generateQuizzes(combinedContent, subject),
      AIServiceBackend.generateTests(combinedContent, subject),
      AIServiceBackend.generateFlashcards(combinedContent, subject),
      AIServiceBackend.generateReadingTexts(combinedContent, subject, 8)
    ]);
    
    console.log('\n📋 Genererer studieplan...');
    const studyPlan = await AIServiceBackend.generateStudyPlan(combinedContent, subject, testDate, readingTexts);
    
    console.log('\n✅ ALLE AI-OPPGAVER FULLFØRT!');
    console.log(`   • Quizer: ${quizzes.length}`);
    console.log(`   • Tester: ${tests.length}`);
    console.log(`   • Flashkort: ${flashcards.length}`);
    console.log(`   • Lesetekster: ${readingTexts.length}`);
    console.log(`   • Studieplan: ${studyPlan.length > 0 ? 'Ja' : 'Nei'}`);
    
    return { quizzes, tests, flashcards, readingTexts, studyPlan };
  };

  const handleAddTest = async () => {
    if (testDate && testSubject && testTitle) {
      setIsGenerating(true);
      
      try {
        // Check if user is logged in
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          toast({
            title: "Du må være innlogget",
            description: "Logg inn for å legge til prøver",
            variant: "destructive"
          });
          setIsGenerating(false);
          return;
        }

        let generatedContent: GeneratedContent | undefined;
        
        if (uploadedFiles.length > 0) {
          generatedContent = await generateContentFromFiles(uploadedFiles, testSubject, testDate);
          toast({
            title: "AI-innhold generert!",
            description: `Opprettet ${generatedContent.quizzes.length} quizer, ${generatedContent.tests.length} tester, ${generatedContent.flashcards.length} flashkort og ${generatedContent.readingTexts.length} lesetekster`,
          });
        }

        const newTest: Test = {
          id: Date.now().toString(),
          subject: testSubject,
          date: testDate,
          title: testTitle,
          assignmentSheet: assignmentSheet || undefined,
          uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          generatedContent
        };
        
        addTest(newTest);

        // Generate adaptive study plan
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          toast({
            title: "Lager personlig studieplan...",
            description: "GradeUp tilpasser en plan for deg",
          });

          const { data: planData, error: planError } = await supabase.functions.invoke('generate-adaptive-study-plan', {
            body: {
              userId: user.id,
              testId: newTest.id,
              subject: testSubject,
              testDate: testDate.toISOString(),
              topics: assignmentSheet ? [assignmentSheet.substring(0, 100)] : []
            }
          });

          if (planError) {
            console.error('Plan generation error:', planError);
          } else {
            toast({
              title: "Studieplan klar! 🎯",
              description: "Se din personlige plan under 'Studieplaner'",
            });
          }
        }
        
        // Reset form
        setTestDate(undefined);
        setTestSubject("");
        setTestTitle("");
        setAssignmentSheet("");
        setUploadedFiles([]);
        setIsTestDialogOpen(false);
      } catch (error) {
        console.error('Detaljert feil ved registrering av prøve:', error);
        toast({
          title: "Feil ved registrering",
          description: error instanceof Error ? error.message : "Ukjent feil oppstod. Prøv igjen.",
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleSelectTestForResult = (test: Test) => {
    setSelectedTest(test);
    setIsResultDialogOpen(false);
  };

  // Clean up expired tests and their generated content
  useEffect(() => {
    const interval = setInterval(() => {
      // This will be handled by the context now
    }, 24 * 60 * 60 * 1000); // Check daily

    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake til oversikt
            </Button>
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Prøver og vurderinger
            </h1>
            <p className="text-muted-foreground text-lg">Planlegg kommende prøver og spor prestasjonene dine</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-4 md:grid-cols-2">
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Planlegg prøve</h3>
                    <p className="text-muted-foreground">Legg til en kommende prøve eller eksamen</p>
                  </div>
                  <Plus className="h-6 w-6 text-primary ml-auto" />
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Planlegg ny prøve</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-title">Prøvetittel</Label>
                  <Input
                    id="test-title"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="f.eks. Terminprøve"
                  />
                </div>
                
                <div>
                  <Label htmlFor="test-subject">Fag</Label>
                  <Select value={testSubject} onValueChange={setTestSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg fag" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prøvedato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !testDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {testDate ? format(testDate, "PPP") : "Velg dato"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={testDate}
                        onSelect={setTestDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="assignment-sheet">Oppgaveark (valgfritt)</Label>
                  <Textarea
                    id="assignment-sheet"
                    value={assignmentSheet}
                    onChange={(e) => setAssignmentSheet(e.target.value)}
                    placeholder="Lim inn oppgavedetaljer eller studiemateriell her..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="file-upload">Last opp filer (PDF, bilder, osv.)</Label>
                  <div className="space-y-2">
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
                      onChange={handleFileUpload}
                    />
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Opplastede filer:</p>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleAddTest} className="w-full" disabled={isGenerating}>
                  {isGenerating ? "Genererer AI-innhold..." : "Planlegg prøve"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
            <DialogTrigger asChild>
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-r from-success/5 to-success/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors">
                    <ClipboardCheck className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Registrer prøveresultat</h3>
                    <p className="text-muted-foreground">Legg inn hva du fikk på prøven du tok</p>
                  </div>
                  <Plus className="h-6 w-6 text-success ml-auto" />
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Velg prøve å reflektere over</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {pastTestsForReflection.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Ingen fullførte prøver å reflektere over ennå. Prøver som har passert dukker opp her.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pastTestsForReflection.map((test) => (
                      <Card 
                        key={test.id}
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectTestForResult(test)}
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold">{test.title}</h4>
                          <p className="text-sm text-muted-foreground">{test.subject}</p>
                          <p className="text-xs text-muted-foreground">{format(test.date, "PPP")}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Tests */}
        {tests.length > 0 && (
          <Card className="p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Kommende prøver</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <Card key={test.id} className="p-4 border-l-4 border-l-primary">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{test.title}</h3>
                        <p className="text-sm text-muted-foreground">{test.subject}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Er du sikker på at du vil slette denne prøven?')) {
                            deleteTest(test.id);
                            toast({
                              title: "Prøve slettet",
                              description: "Prøven ble slettet"
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{format(test.date, "PPP")}</p>
                    </div>
                     {test.assignmentSheet && (
                       <div className="text-xs text-muted-foreground">
                         <FileText className="h-3 w-3 inline mr-1" />
                         Oppgaveark vedlagt
                       </div>
                     )}
                     {test.uploadedFiles && (
                       <div className="text-xs text-muted-foreground">
                         <Upload className="h-3 w-3 inline mr-1" />
                         {test.uploadedFiles.length} fil(er) lastet opp
                       </div>
                     )}
                     {test.generatedContent && (
                       <div className="grid grid-cols-3 gap-2 mt-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => navigate(`/quiz/${test.id}`)}
                           className="text-xs"
                         >
                           <Brain className="h-3 w-3 mr-1" />
                           Quiz ({test.generatedContent.quizzes.length})
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => navigate(`/test/${test.id}`)}
                           className="text-xs"
                         >
                           <BookOpen className="h-3 w-3 mr-1" />
                           Test ({test.generatedContent.tests.length})
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => navigate(`/flashcards/${test.id}`)}
                           className="text-xs"
                         >
                           <Zap className="h-3 w-3 mr-1" />
                           Kort ({test.generatedContent.flashcards.length})
                         </Button>
                       </div>
                     )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Professional Text Analysis */}
        <TextAnalysis />
      </div>

      {/* Test Reflection Dialog */}
      {selectedTest && (
        <TestReflectionDialog
          open={!!selectedTest}
          onOpenChange={(open) => !open && setSelectedTest(null)}
          test={{
            id: selectedTest.id,
            title: selectedTest.title,
            subject: selectedTest.subject,
            date: selectedTest.date
          }}
        />
      )}
    </div>
  );
};

export default Tests;