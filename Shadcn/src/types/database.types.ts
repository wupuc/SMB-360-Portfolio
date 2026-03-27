// Auto-generated from Supabase — regenerate with mcp__supabase__generate_typescript_types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null; body: string | null; company_id: string
          created_at: string | null; expires_at: string | null; id: string
          is_pinned: boolean | null; published_at: string | null; title: string
        }
        Insert: {
          author_id?: string | null; body?: string | null; company_id: string
          created_at?: string | null; expires_at?: string | null; id?: string
          is_pinned?: boolean | null; published_at?: string | null; title: string
        }
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string; company_id: string | null; created_at: string | null
          id: string; ip_address: string | null; new_values: Json | null
          old_values: Json | null; record_id: string | null; table_name: string
          user_id: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & { action: string; table_name: string }
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>
        Relationships: []
      }
      campaigns: {
        Row: {
          budget: number | null; company_id: string | null; created_at: string | null
          currency_id: string | null; description: string | null; end_date: string | null
          goal: string | null; id: string; name: string; owner_id: string | null
          start_date: string | null; status: string | null; type: string
        }
        Insert: Partial<Database["public"]["Tables"]["campaigns"]["Row"]> & { name: string; type: string }
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Row"]>
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string | null; created_at: string | null; email: string | null
          first_name: string; id: string; is_primary: boolean | null
          last_name: string; notes: string | null; phone: string | null; role: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["client_contacts"]["Row"]> & { first_name: string; last_name: string }
        Update: Partial<Database["public"]["Tables"]["client_contacts"]["Row"]>
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null; assigned_to: string | null; city: string | null
          company_id: string | null; country: string | null; created_at: string | null
          id: string; industry: string | null; is_active: boolean | null
          lead_score: number | null; name: string; notes: string | null
          phone: string | null; team_id: string | null; type: string | null
          updated_at: string | null; website: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & { name: string }
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>
        Relationships: []
      }
      close_reasons: {
        Row: { company_id: string | null; id: string; is_active: boolean | null; name: string; type: string }
        Insert: Partial<Database["public"]["Tables"]["close_reasons"]["Row"]> & { name: string; type: string }
        Update: Partial<Database["public"]["Tables"]["close_reasons"]["Row"]>
        Relationships: []
      }
      companies: {
        Row: {
          brand_color: string | null; created_at: string | null
          email_sender_address: string | null; email_sender_name: string | null
          id: string; locale: string | null; login_background_url: string | null
          logo_url: string | null; name: string; timezone: string | null; updated_at: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]> & { name: string }
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>
        Relationships: []
      }
      contact_segments: {
        Row: {
          company_id: string | null; created_at: string | null; created_by: string | null
          description: string | null; filter_criteria: Json; id: string
          is_shared: boolean | null; name: string
        }
        Insert: Partial<Database["public"]["Tables"]["contact_segments"]["Row"]> & { name: string }
        Update: Partial<Database["public"]["Tables"]["contact_segments"]["Row"]>
        Relationships: []
      }
      currencies: {
        Row: {
          code: string; company_id: string; exchange_rate: number | null; id: string
          is_active: boolean | null; is_base: boolean | null; name: string; symbol: string
        }
        Insert: Partial<Database["public"]["Tables"]["currencies"]["Row"]> & { code: string; company_id: string; name: string; symbol: string }
        Update: Partial<Database["public"]["Tables"]["currencies"]["Row"]>
        Relationships: []
      }
      departments: {
        Row: {
          company_id: string; created_at: string | null; head_user_id: string | null
          id: string; name: string; parent_id: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["departments"]["Row"]> & { company_id: string; name: string }
        Update: Partial<Database["public"]["Tables"]["departments"]["Row"]>
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string; company_id: string | null; created_at: string | null
          created_by: string | null; id: string; is_shared: boolean | null
          name: string; subject: string
        }
        Insert: Partial<Database["public"]["Tables"]["email_templates"]["Row"]> & { body: string; name: string; subject: string }
        Update: Partial<Database["public"]["Tables"]["email_templates"]["Row"]>
        Relationships: []
      }
      files: {
        Row: {
          company_id: string; created_at: string | null; id: string
          mime_type: string | null; name: string; size_bytes: number | null
          source_app: string | null; source_id: string | null
          storage_path: string; uploaded_by: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["files"]["Row"]> & { company_id: string; name: string; storage_path: string }
        Update: Partial<Database["public"]["Tables"]["files"]["Row"]>
        Relationships: []
      }
      interactions: {
        Row: {
          assigned_to: string | null; campaign_id: string | null; client_id: string | null
          company_id: string | null; completed_at: string | null; created_at: string | null
          created_by: string | null; description: string | null; email_subject: string | null
          email_to: string | null; id: string; opportunity_id: string | null
          priority: string | null; scheduled_at: string | null; status: string | null
          title: string; type: string; updated_at: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["interactions"]["Row"]> & { title: string; type: string }
        Update: Partial<Database["public"]["Tables"]["interactions"]["Row"]>
        Relationships: []
      }
      module_config: {
        Row: { company_id: string; config: Json | null; is_enabled: boolean | null; module: string }
        Insert: Partial<Database["public"]["Tables"]["module_config"]["Row"]> & { company_id: string; module: string }
        Update: Partial<Database["public"]["Tables"]["module_config"]["Row"]>
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null; company_id: string; created_at: string | null; id: string
          is_read: boolean | null; source_app: string | null; source_id: string | null
          source_url: string | null; title: string; type: string; user_id: string
        }
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & { company_id: string; title: string; type: string; user_id: string }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>
        Relationships: []
      }
      opportunities: {
        Row: {
          actual_close_date: string | null; client_id: string | null; close_reason: string | null
          company_id: string | null; created_at: string | null; currency_id: string | null
          estimated_value: number | null; expected_close_date: string | null; id: string
          inactivity_flag: string | null; last_activity_at: string | null; name: string
          notes: string | null; owner_id: string | null; probability: number | null
          stage_id: string | null; team_id: string | null; updated_at: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["opportunities"]["Row"]> & { name: string }
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Row"]>
        Relationships: []
      }
      opportunity_products: {
        Row: {
          discount_percent: number | null; opportunity_id: string; product_id: string
          quantity: number | null; unit_price: number | null
        }
        Insert: Partial<Database["public"]["Tables"]["opportunity_products"]["Row"]> & { opportunity_id: string; product_id: string }
        Update: Partial<Database["public"]["Tables"]["opportunity_products"]["Row"]>
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string | null; company_id: string | null; id: string
          is_active: boolean | null; name: string; probability_default: number | null
          stage_order: number; system_flag: string
        }
        Insert: Partial<Database["public"]["Tables"]["pipeline_stages"]["Row"]> & { name: string; stage_order: number; system_flag: string }
        Update: Partial<Database["public"]["Tables"]["pipeline_stages"]["Row"]>
        Relationships: []
      }
      products: {
        Row: {
          category: string | null; company_id: string | null; created_at: string | null
          currency_id: string | null; description: string | null; id: string
          is_active: boolean | null; name: string; price: number | null; sku: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & { name: string }
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>
        Relationships: []
      }
      team_members: {
        Row: { role: string | null; team_id: string; user_id: string }
        Insert: Partial<Database["public"]["Tables"]["team_members"]["Row"]> & { team_id: string; user_id: string }
        Update: Partial<Database["public"]["Tables"]["team_members"]["Row"]>
        Relationships: []
      }
      teams: {
        Row: { company_id: string; created_at: string | null; description: string | null; id: string; name: string }
        Insert: Partial<Database["public"]["Tables"]["teams"]["Row"]> & { company_id: string; name: string }
        Update: Partial<Database["public"]["Tables"]["teams"]["Row"]>
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null; company_id: string | null; created_at: string | null
          department_id: string | null; email: string; first_name: string; id: string
          is_active: boolean | null; last_name: string; locale_override: string | null
          manager_id: string | null; role: string; updated_at: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string }
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>
        Relationships: []
      }
    }
    Views: {
      employee_profiles_safe: {
        Row: {
          id: string | null; first_name: string | null; last_name: string | null
          email: string | null; role: string | null; department_id: string | null
          company_id: string | null; avatar_url: string | null; is_active: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_company_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

// Aliases used across the codebase
export type ModuleKey = string
export type UserRole = string

// Named row aliases for convenience
export type Company = Tables<"companies">
export type Currency = Tables<"currencies">
export type Department = Tables<"departments">
export type User = Tables<"users">
export type Notification = Tables<"notifications">

export const Constants = { public: { Enums: {} } } as const
