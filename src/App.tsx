import React from "react";
import { TestProvider } from "@/contexts/TestContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Quiz from "./components/Quiz";
import SkillDetail from "./components/SkillDetail";
import WeeklyPlanner from "./components/WeeklyPlanner";
import Tests from "./components/Tests";
import PracticeAndLearning from "./components/PracticeAndLearning";
import QuizModes from "./components/QuizModes";
import TestModes from "./components/TestModes";
import FlashcardModes from "./components/FlashcardModes";
import SubjectQuiz from "./components/SubjectQuiz";
import SubjectTest from "./components/SubjectTest";
import SubjectFlashcards from "./components/SubjectFlashcards";
import TestQuiz from "./components/TestQuiz";
import TestFlashcards from "./components/TestFlashcards";
import TestFlashcardThemes from "./components/TestFlashcardThemes";
import TestTest from "./components/TestTest";
import ReadingMode from "./components/ReadingMode";
import ExplainersMode from "./components/ExplainersMode";
import TemplatesMode from "./components/TemplatesMode";
import FloatingAIChat from "./components/FloatingAIChat";
import SimpleFloatingMenu from "./components/SimpleFloatingMenu";
import BottomNavigation from "./components/BottomNavigation";
import AIChatPage from "./pages/AIChat";
import NotesPage from "./pages/Notes";
import NotFound from "./pages/NotFound";
import TestQuizThemes from "./components/TestQuizThemes";
import PersonalInsights from "./pages/PersonalInsights";
import StudySession from "./pages/StudySession";
import PracticeTests from "./components/PracticeTests";
import PracticeTest from "./pages/PracticeTest";
import Explanations from "./components/Explanations";
import StudyPlan from "./pages/StudyPlan";
import DailyPlan from "./pages/DailyPlan";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/onboarding';

  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><PracticeAndLearning /></ProtectedRoute>} />
        <Route path="/quiz-modes" element={<ProtectedRoute><QuizModes /></ProtectedRoute>} />
        <Route path="/test-modes" element={<ProtectedRoute><TestModes /></ProtectedRoute>} />
        <Route path="/flashcard-modes" element={<ProtectedRoute><FlashcardModes /></ProtectedRoute>} />
        <Route path="/quiz/:testId" element={<ProtectedRoute><TestQuizThemes /></ProtectedRoute>} />
        <Route path="/quiz/:testId/:themeId" element={<ProtectedRoute><TestQuiz /></ProtectedRoute>} />
        <Route path="/subject-test/:testId" element={<ProtectedRoute><SubjectTest /></ProtectedRoute>} />
        <Route path="/test/:testId" element={<ProtectedRoute><TestTest /></ProtectedRoute>} />
        <Route path="/flashcards/:testId" element={<ProtectedRoute><TestFlashcardThemes /></ProtectedRoute>} />
        <Route path="/flashcards/:testId/:themeId" element={<ProtectedRoute><TestFlashcards /></ProtectedRoute>} />
        <Route path="/reading" element={<ProtectedRoute><ReadingMode /></ProtectedRoute>} />
        <Route path="/explainers" element={<ProtectedRoute><ExplainersMode /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><TemplatesMode /></ProtectedRoute>} />
        <Route path="/skill/:id" element={<ProtectedRoute><SkillDetail /></ProtectedRoute>} />
        <Route path="/planner" element={<ProtectedRoute><WeeklyPlanner /></ProtectedRoute>} />
        <Route path="/tests" element={<ProtectedRoute><Tests /></ProtectedRoute>} />
        <Route path="/tests-tab" element={<ProtectedRoute><Tests /></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><PersonalInsights /></ProtectedRoute>} />
        <Route path="/study-session/:testId" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />
        <Route path="/practice-tests" element={<ProtectedRoute><PracticeTests /></ProtectedRoute>} />
        <Route path="/practice-test/:id" element={<ProtectedRoute><PracticeTest /></ProtectedRoute>} />
        <Route path="/explanations" element={<ProtectedRoute><Explanations /></ProtectedRoute>} />
        <Route path="/study-plans" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />
        <Route path="/dagens-plan" element={<ProtectedRoute><DailyPlan /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAuthPage && (
        <>
          <SimpleFloatingMenu />
          <BottomNavigation />
        </>
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TestProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </TestProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
