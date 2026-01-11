export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      explanations: {
        Row: {
          activity_id: string
          activity_type: string
          correct_answer: string
          created_at: string
          examples: string | null
          explanation: string
          id: string
          question_text: string
          subject: string
          understood: boolean | null
          updated_at: string
          user_answer: string
          user_id: string
        }
        Insert: {
          activity_id: string
          activity_type: string
          correct_answer: string
          created_at?: string
          examples?: string | null
          explanation: string
          id?: string
          question_text: string
          subject: string
          understood?: boolean | null
          updated_at?: string
          user_answer: string
          user_id: string
        }
        Update: {
          activity_id?: string
          activity_type?: string
          correct_answer?: string
          created_at?: string
          examples?: string | null
          explanation?: string
          id?: string
          question_text?: string
          subject?: string
          understood?: boolean | null
          updated_at?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_activities: {
        Row: {
          activity_type: string
          completed: boolean | null
          created_at: string
          difficulty_level: string | null
          id: string
          metadata: Json | null
          score: number | null
          subject: string
          time_spent_seconds: number | null
          topic: string | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          completed?: boolean | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          subject: string
          time_spent_seconds?: number | null
          topic?: string | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          completed?: boolean | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          subject?: string
          time_spent_seconds?: number | null
          topic?: string | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: []
      }
      learning_patterns: {
        Row: {
          average_session_duration: number | null
          consistency_score: number | null
          id: string
          last_analyzed_at: string | null
          learning_style: string | null
          optimal_study_time: string | null
          preferred_learning_methods: Json | null
          subject_strengths: Json | null
          subject_weaknesses: Json | null
          total_study_time: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_session_duration?: number | null
          consistency_score?: number | null
          id?: string
          last_analyzed_at?: string | null
          learning_style?: string | null
          optimal_study_time?: string | null
          preferred_learning_methods?: Json | null
          subject_strengths?: Json | null
          subject_weaknesses?: Json | null
          total_study_time?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_session_duration?: number | null
          consistency_score?: number | null
          id?: string
          last_analyzed_at?: string | null
          learning_style?: string | null
          optimal_study_time?: string | null
          preferred_learning_methods?: Json | null
          subject_strengths?: Json | null
          subject_weaknesses?: Json | null
          total_study_time?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_tests: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          difficulty_level: string | null
          id: string
          metadata: Json | null
          questions: Json
          score: number | null
          subject: string
          time_limit_minutes: number
          title: string
          topics: Json
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          metadata?: Json | null
          questions: Json
          score?: number | null
          subject: string
          time_limit_minutes?: number
          title: string
          topics?: Json
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          metadata?: Json | null
          questions?: Json
          score?: number | null
          subject?: string
          time_limit_minutes?: number
          title?: string
          topics?: Json
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          attempt_count: number
          correct_answer: string
          created_at: string
          id: string
          is_correct: boolean
          mastered: boolean
          question_id: string | null
          question_text: string
          quiz_session_id: string | null
          quiz_type: string
          subject: string
          topic: string | null
          user_answer: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          correct_answer: string
          created_at?: string
          id?: string
          is_correct: boolean
          mastered?: boolean
          question_id?: string | null
          question_text: string
          quiz_session_id?: string | null
          quiz_type: string
          subject: string
          topic?: string | null
          user_answer: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          correct_answer?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          mastered?: boolean
          question_id?: string | null
          question_text?: string
          quiz_session_id?: string | null
          quiz_type?: string
          subject?: string
          topic?: string | null
          user_answer?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          completed_at: string
          id: string
          percentage: number
          quiz_type: string
          score: number
          subject: string
          test_id: string | null
          theme_id: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          percentage: number
          quiz_type: string
          score: number
          subject: string
          test_id?: string | null
          theme_id?: string | null
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          percentage?: number
          quiz_type?: string
          score?: number
          subject?: string
          test_id?: string | null
          theme_id?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          adapted_count: number
          completed_phases: Json
          created_at: string
          current_phase: string
          generated_at: string
          id: string
          metadata: Json | null
          phases: Json
          subject: string
          test_date: string
          test_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adapted_count?: number
          completed_phases?: Json
          created_at?: string
          current_phase?: string
          generated_at?: string
          id?: string
          metadata?: Json | null
          phases?: Json
          subject: string
          test_date: string
          test_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adapted_count?: number
          completed_phases?: Json
          created_at?: string
          current_phase?: string
          generated_at?: string
          id?: string
          metadata?: Json | null
          phases?: Json
          subject?: string
          test_date?: string
          test_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_reflections: {
        Row: {
          created_at: string
          felt_prepared: boolean | null
          how_it_went: string | null
          id: string
          stress_level: number | null
          test_date: string
          test_id: string
          test_subject: string
          test_title: string
          user_id: string
          what_could_be_better: string | null
          what_helped: string | null
          would_change: string | null
        }
        Insert: {
          created_at?: string
          felt_prepared?: boolean | null
          how_it_went?: string | null
          id?: string
          stress_level?: number | null
          test_date: string
          test_id: string
          test_subject: string
          test_title: string
          user_id: string
          what_could_be_better?: string | null
          what_helped?: string | null
          would_change?: string | null
        }
        Update: {
          created_at?: string
          felt_prepared?: boolean | null
          how_it_went?: string | null
          id?: string
          stress_level?: number | null
          test_date?: string
          test_id?: string
          test_subject?: string
          test_title?: string
          user_id?: string
          what_could_be_better?: string | null
          what_helped?: string | null
          would_change?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          average_study_time_minutes: number | null
          created_at: string
          id: string
          learning_style: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          optimal_study_time: string | null
          preferred_difficulty: string | null
          preferred_explanation_style: string | null
          preferred_learning_methods: Json | null
          preferred_subjects: Json | null
          preparation_habits: Json | null
          target_grade: string | null
          updated_at: string
          user_id: string
          wants_hints: boolean | null
          wants_step_by_step: boolean | null
        }
        Insert: {
          average_study_time_minutes?: number | null
          created_at?: string
          id?: string
          learning_style?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          optimal_study_time?: string | null
          preferred_difficulty?: string | null
          preferred_explanation_style?: string | null
          preferred_learning_methods?: Json | null
          preferred_subjects?: Json | null
          preparation_habits?: Json | null
          target_grade?: string | null
          updated_at?: string
          user_id: string
          wants_hints?: boolean | null
          wants_step_by_step?: boolean | null
        }
        Update: {
          average_study_time_minutes?: number | null
          created_at?: string
          id?: string
          learning_style?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          optimal_study_time?: string | null
          preferred_difficulty?: string | null
          preferred_explanation_style?: string | null
          preferred_learning_methods?: Json | null
          preferred_subjects?: Json | null
          preparation_habits?: Json | null
          target_grade?: string | null
          updated_at?: string
          user_id?: string
          wants_hints?: boolean | null
          wants_step_by_step?: boolean | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          average_percentage: number
          id: string
          last_activity: string
          readiness_level: string
          subject: string
          total_quizzes: number
          total_score: number
          user_id: string
        }
        Insert: {
          average_percentage?: number
          id?: string
          last_activity?: string
          readiness_level?: string
          subject: string
          total_quizzes?: number
          total_score?: number
          user_id: string
        }
        Update: {
          average_percentage?: number
          id?: string
          last_activity?: string
          readiness_level?: string
          subject?: string
          total_quizzes?: number
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
