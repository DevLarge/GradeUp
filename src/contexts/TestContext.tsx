import React, { createContext, useContext, useState, ReactNode } from 'react';
import { addDays, isPast } from 'date-fns';

export interface GeneratedContent {
  quizzes: QuizTheme[];
  tests: TestItem[];
  flashcards: FlashcardItem[];
  readingTexts: ReadingTextItem[];
  studyPlan: StudyPlanDay[];
}

export interface QuizTheme {
  id: string;
  title: string;
  description: string;
  questions: QuizItem[];
}

export interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface TestItem {
  id: string;
  question: string;
  answer: string;
  points: number;
  theme?: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  category?: string;
}

export interface ReadingTextItem {
  id: string;
  title: string;
  content: string;
}

export interface StudyPlanTask {
  id: string;
  skill: string;
  type: "video" | "practice" | "quiz" | "reading" | "flashcards";
  duration: number;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

export interface StudyPlanDay {
  id: string;
  day: string;
  date: string;
  tasks: StudyPlanTask[];
}

export interface Test {
  id: string;
  subject: string;
  date: Date;
  assignmentSheet?: string;
  title: string;
  uploadedFiles?: File[];
  generatedContent?: GeneratedContent;
}

export interface Assessment {
  id: string;
  subject: string;
  text: string;
  grade: number;
  targetGrade: number;
  analysis: string;
}

export interface Activity {
  id: string;
  subject: string;
  type: 'quiz' | 'flashcards' | 'test' | 'reading';
  score: number; // 0-100
  completedAt: Date;
  itemsCompleted: number;
  totalItems: number;
}

interface TestContextType {
  tests: Test[];
  assessments: Assessment[];
  activities: Activity[];
  addTest: (test: Test) => void;
  addAssessment: (assessment: Assessment) => void;
  addActivity: (activity: Activity) => void;
  deleteTest: (testId: string) => void;
  deleteAssessment: (assessmentId: string) => void;
  getUpcomingTests: () => Test[];
  getNextTest: () => Test | null;
  getSubjectProgress: (subject: string) => number;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from localStorage on mount
  const [tests, setTests] = useState<Test[]>(() => {
    const saved = localStorage.getItem('tests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects and migrate old studyPlan format
        return parsed.map((test: any) => {
          const migratedTest = {
            ...test,
            date: new Date(test.date)
          };
          
          // Migrate old studyPlan string format to new array format
          if (migratedTest.generatedContent?.studyPlan && typeof migratedTest.generatedContent.studyPlan === 'string') {
            console.log('⚠️ Migrerer gammelt studieplan-format til nytt format');
            migratedTest.generatedContent.studyPlan = [];
          }
          
          return migratedTest;
        });
      } catch {
        return [];
      }
    }
    return [];
  });

  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    const saved = localStorage.getItem('assessments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('activities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((activity: any) => ({
          ...activity,
          completedAt: new Date(activity.completedAt)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Save to localStorage whenever tests change
  React.useEffect(() => {
    localStorage.setItem('tests', JSON.stringify(tests));
  }, [tests]);

  // Save to localStorage whenever assessments change
  React.useEffect(() => {
    localStorage.setItem('assessments', JSON.stringify(assessments));
  }, [assessments]);

  // Save to localStorage whenever activities change
  React.useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

  const addTest = (test: Test) => {
    setTests(prev => [...prev, test]);
  };

  const addAssessment = (assessment: Assessment) => {
    setAssessments(prev => [...prev, assessment]);
  };

  const addActivity = (activity: Activity) => {
    setActivities(prev => [...prev, activity]);
  };

  const deleteTest = (testId: string) => {
    setTests(prev => prev.filter(test => test.id !== testId));
  };

  const deleteAssessment = (assessmentId: string) => {
    setAssessments(prev => prev.filter(assessment => assessment.id !== assessmentId));
  };

  const getUpcomingTests = () => {
    return tests.filter(test => !isPast(test.date)).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getNextTest = () => {
    const upcoming = getUpcomingTests();
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  const getSubjectProgress = (subject: string) => {
    const subjectAssessments = assessments.filter(a => a.subject === subject);
    const subjectActivities = activities.filter(a => a.subject === subject);
    
    // If no data at all, return 0
    if (subjectAssessments.length === 0 && subjectActivities.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    // Assessments weighted more heavily (weight: 2)
    if (subjectAssessments.length > 0) {
      const avgGrade = subjectAssessments.reduce((sum, a) => sum + a.grade, 0) / subjectAssessments.length;
      const assessmentScore = (avgGrade / 6) * 100;
      totalScore += assessmentScore * 2;
      totalWeight += 2;
    }
    
    // Activities weighted less (weight: 1)
    if (subjectActivities.length > 0) {
      const avgActivityScore = subjectActivities.reduce((sum, a) => sum + a.score, 0) / subjectActivities.length;
      totalScore += avgActivityScore;
      totalWeight += 1;
    }
    
    return Math.round(totalScore / totalWeight);
  };

  return (
    <TestContext.Provider value={{
      tests,
      assessments,
      activities,
      addTest,
      addAssessment,
      addActivity,
      deleteTest,
      deleteAssessment,
      getUpcomingTests,
      getNextTest,
      getSubjectProgress
    }}>
      {children}
    </TestContext.Provider>
  );
};

export const useTestContext = () => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTestContext must be used within a TestProvider');
  }
  return context;
};