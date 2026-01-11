import { useState } from "react";
import AIChat from "@/components/AIChat";
import { Card } from "@/components/ui/card";
import { Brain, Sparkles, BookOpen, Lightbulb, Target, TrendingUp } from "lucide-react";

const AIChatPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/10 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-success to-primary shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
              AI Kompis
            </h1>
            <Sparkles className="h-6 w-6 text-success animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Din personlige AI-studieassistent er klar til å hjelpe deg med alt fra forklaringer til studieteknikker
          </p>
        </div>

        {/* Features - Hva AI kan hjelpe med */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <Card className="p-5 border-2 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Forklaringer</h3>
                <p className="text-sm text-muted-foreground">Få enkle forklaringer på vanskelige konsepter</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Studietips</h3>
                <p className="text-sm text-muted-foreground">Lær effektive studieteknikker og metoder</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Eksamenhjelp</h3>
                <p className="text-sm text-muted-foreground">Forbered deg til prøver og eksamener</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-2 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Forbedring</h3>
                <p className="text-sm text-muted-foreground">Få personlige råd for å bli bedre</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
            <div className="text-xs text-muted-foreground">Alltid tilgjengelig</div>
          </Card>
          <Card className="p-3 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">∞</div>
            <div className="text-xs text-muted-foreground">Ubegrensede spørsmål</div>
          </Card>
          <Card className="p-3 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">AI</div>
            <div className="text-xs text-muted-foreground">Smart assistent</div>
          </Card>
        </div>

        {/* Chat Component */}
        <div className="animate-fade-in">
          <AIChat onClose={() => {}} isModal={false} />
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;