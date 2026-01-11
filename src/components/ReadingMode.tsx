import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTestContext } from '@/contexts/TestContext';
import { format, differenceInDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";

const ReadingMode = () => {
  const { tests } = useTestContext();
  const navigate = useNavigate();

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
            <h1 className="text-2xl font-bold">Lesing</h1>
            <p className="text-muted-foreground">Les og lær fra studiematerialet ditt</p>
          </div>
        </div>

        {/* Tests List with Reading Texts */}
        {tests.length > 0 ? (
          <div className="space-y-6">
            {tests.map((test) => {
              const daysUntil = differenceInDays(test.date, new Date());
              const isPast = daysUntil < 0;
              const hasReadingTexts = test.generatedContent?.readingTexts && test.generatedContent.readingTexts.length > 0;
              
              return (
                <Card key={test.id} className={isPast ? "opacity-60" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold">{test.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{test.subject}</p>
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

                    {hasReadingTexts ? (
                      <div className="space-y-4 mt-6">
                        {test.generatedContent!.readingTexts.map((text, index) => (
                          <Card key={text.id} className="bg-secondary/20">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold">{text.title}</h3>
                              </div>
                              <ScrollArea className="h-[300px] pr-4">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{text.content}</p>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-secondary/10 rounded-lg">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Ingen lesetekster generert for denne prøven ennå.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Last opp filer når du legger til en prøve for å generere lesetekster automatisk.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Ingen prøver lagt til</h3>
            <p className="text-muted-foreground mb-4">
              Legg til dine prøver i "Tester"-fanen for å generere lesetekster
            </p>
            <Button onClick={() => navigate('/tests-tab')}>Legg til prøve</Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReadingMode;
