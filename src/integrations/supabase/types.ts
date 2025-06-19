export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_history: {
        Row: {
          answer: string
          id: string
          question: string
          rating: number | null
          source_id: string | null
          source_name: string | null
          source_type: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          answer: string
          id?: string
          question: string
          rating?: number | null
          source_id?: string | null
          source_name?: string | null
          source_type?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          answer?: string
          id?: string
          question?: string
          rating?: number | null
          source_id?: string | null
          source_name?: string | null
          source_type?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          created_at: string
          id: string
          messages: Json
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_vector: string | null
          created_at: string
          document_id: string
          id: string
          page_number: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          content_vector?: string | null
          created_at?: string
          document_id: string
          id?: string
          page_number?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          content_vector?: string | null
          created_at?: string
          document_id?: string
          id?: string
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_summary: string | null
          content_summary: string | null
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          keywords: string[] | null
          last_processed_at: string | null
          name: string
          processing_error: string | null
          processing_status: string | null
          total_chunks: number | null
          updated_at: string
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          ai_summary?: string | null
          content_summary?: string | null
          created_at?: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          keywords?: string[] | null
          last_processed_at?: string | null
          name: string
          processing_error?: string | null
          processing_status?: string | null
          total_chunks?: number | null
          updated_at?: string
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          ai_summary?: string | null
          content_summary?: string | null
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          keywords?: string[] | null
          last_processed_at?: string | null
          name?: string
          processing_error?: string | null
          processing_status?: string | null
          total_chunks?: number | null
          updated_at?: string
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_gaps: {
        Row: {
          created_at: string
          frequency: number
          id: string
          last_searched: string
          search_query: string
          status: string
          suggested_action: string | null
        }
        Insert: {
          created_at?: string
          frequency?: number
          id?: string
          last_searched?: string
          search_query: string
          status?: string
          suggested_action?: string | null
        }
        Update: {
          created_at?: string
          frequency?: number
          id?: string
          last_searched?: string
          search_query?: string
          status?: string
          suggested_action?: string | null
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          content_excerpt: string | null
          created_at: string
          id: string
          keywords: string[] | null
          source_id: string
          source_type: string
        }
        Insert: {
          content_excerpt?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          source_id: string
          source_type: string
        }
        Update: {
          content_excerpt?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          source_id?: string
          source_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      qa_pairs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          question: string
          tags: string[] | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          question: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          question?: string
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_pairs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          clicked_result_id: string | null
          clicked_result_type: string | null
          created_at: string
          id: string
          results_count: number
          satisfaction_rating: number | null
          search_query: string
          user_id: string
        }
        Insert: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string
          id?: string
          results_count?: number
          satisfaction_rating?: number | null
          search_query: string
          user_id: string
        }
        Update: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string
          id?: string
          results_count?: number
          satisfaction_rating?: number | null
          search_query?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_enhanced_search: {
        Args: {
          search_query: string
          user_context?: Json
          limit_results?: number
        }
        Returns: {
          result_type: string
          result_id: string
          title: string
          content: string
          source: string
          relevance_score: number
          context_match: number
        }[]
      }
      enhanced_search: {
        Args: { search_query: string; limit_results?: number }
        Returns: {
          result_type: string
          result_id: string
          title: string
          content: string
          source: string
          relevance_score: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      increment_qa_usage: {
        Args: { qa_id: string }
        Returns: undefined
      }
      track_knowledge_gap: {
        Args: { query_text: string; results_found: number }
        Returns: undefined
      }
      update_document_processing_status: {
        Args: {
          doc_id: string
          status: string
          summary?: string
          chunk_count?: number
          doc_keywords?: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee"],
    },
  },
} as const
