// Auto-generated types from Supabase schema.
// Regenerate with: supabase gen types typescript --local > src/types/database.types.ts
// This is a placeholder until the Supabase CLI is run against the local schema.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'super_admin' | 'admin' | 'hr' | 'manager' | 'employee'
export type ModuleKey =
  | 'request_flow'
  | 'sales_track'
  | 'project_hub'
  | 'people_hub'
  | 'book_it'
  | 'helpdesk'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          login_background_url: string | null
          brand_color: string
          email_sender_name: string | null
          email_sender_address: string | null
          timezone: string
          locale: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          login_background_url?: string | null
          brand_color?: string
          email_sender_name?: string | null
          email_sender_address?: string | null
          timezone?: string
          locale?: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
        Relationships: []
      }
      users: {
        Row: {
          id: string
          company_id: string | null
          first_name: string
          last_name: string
          email: string
          avatar_url: string | null
          role: UserRole
          department_id: string | null
          manager_id: string | null
          is_active: boolean
          locale_override: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          avatar_url?: string | null
          role?: UserRole
          department_id?: string | null
          manager_id?: string | null
          is_active?: boolean
          locale_override?: string | null
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          company_id: string
          name: string
          parent_id: string | null
          head_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          parent_id?: string | null
          head_user_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['departments']['Insert']>
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
        }
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
        Relationships: []
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          role: 'member' | 'lead'
        }
        Insert: {
          team_id: string
          user_id: string
          role?: 'member' | 'lead'
        }
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          company_id: string
          user_id: string
          title: string
          body: string | null
          type: string
          source_app: string | null
          source_id: string | null
          source_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          title: string
          body?: string | null
          type: string
          source_app?: string | null
          source_id?: string | null
          source_url?: string | null
          is_read?: boolean
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
      files: {
        Row: {
          id: string
          company_id: string
          uploaded_by: string | null
          name: string
          storage_path: string
          mime_type: string | null
          size_bytes: number | null
          source_app: string | null
          source_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          uploaded_by?: string | null
          name: string
          storage_path: string
          mime_type?: string | null
          size_bytes?: number | null
          source_app?: string | null
          source_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['files']['Insert']>
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          company_id: string
          title: string
          body: string | null
          author_id: string | null
          is_pinned: boolean
          published_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          body?: string | null
          author_id?: string | null
          is_pinned?: boolean
          published_at?: string | null
          expires_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>
        Relationships: []
      }
      module_config: {
        Row: {
          company_id: string
          module: ModuleKey
          is_enabled: boolean
          config: Json
        }
        Insert: {
          company_id: string
          module: ModuleKey
          is_enabled?: boolean
          config?: Json
        }
        Update: Partial<Database['public']['Tables']['module_config']['Insert']>
        Relationships: []
      }
      currencies: {
        Row: {
          id: string
          company_id: string
          code: string
          name: string
          symbol: string
          exchange_rate: number
          is_base: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          company_id: string
          code: string
          name: string
          symbol: string
          exchange_rate?: number
          is_base?: boolean
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['currencies']['Insert']>
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          company_id: string | null
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
        }
        Update: never
        Relationships: []
      }
    }
    Views: {
      employee_profiles_safe: {
        Row: {
          user_id: string | null
          company_id: string | null
          date_of_birth: string | null
          job_title: string | null
          contract_type: string | null
          start_date: string | null
          end_date: string | null
          employment_status: string | null
          salary_amount: number | null
          salary_band: string | null
        }
        Insert: {
          user_id?: string | null
        }
        Update: {
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, {
      Args: Record<string, unknown>
      Returns: unknown
    }>
    Enums: {
      user_role: UserRole
      module_key: ModuleKey
    }
    CompositeTypes: Record<string, never>
  }
}

// Convenience type aliases
export type Company = Database['public']['Tables']['companies']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type FileRecord = Database['public']['Tables']['files']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type ModuleConfig = Database['public']['Tables']['module_config']['Row']
export type Currency = Database['public']['Tables']['currencies']['Row']
