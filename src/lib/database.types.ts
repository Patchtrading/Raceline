export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_codes: {
        Row: {
          id: string
          code: string
          created_by: string
          created_at: string
          expires_at: string | null
          max_uses: number | null
          times_used: number
          is_active: boolean
        }
        Insert: {
          id?: string
          code: string
          created_by: string
          created_at?: string
          expires_at?: string | null
          max_uses?: number | null
          times_used?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          code?: string
          created_by?: string
          created_at?: string
          expires_at?: string | null
          max_uses?: number | null
          times_used?: number
          is_active?: boolean
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          app_name: string
          app_tagline: string
          primary_color: string
          secondary_color: string
          logo_url: string | null
          hero_image_url: string | null
          welcome_message: string
          annual_price: number
          lifetime_price: number
          footer_text: string
          contact_email: string | null
          enable_public_registration: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          app_name?: string
          app_tagline?: string
          primary_color?: string
          secondary_color?: string
          logo_url?: string | null
          hero_image_url?: string | null
          welcome_message?: string
          annual_price?: number
          lifetime_price?: number
          footer_text?: string
          contact_email?: string | null
          enable_public_registration?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          app_name?: string
          app_tagline?: string
          primary_color?: string
          secondary_color?: string
          logo_url?: string | null
          hero_image_url?: string | null
          welcome_message?: string
          annual_price?: number
          lifetime_price?: number
          footer_text?: string
          contact_email?: string | null
          enable_public_registration?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          created_at: string
          updated_at: string
          is_deleted: boolean
          room_id: string | null
          file_attachments: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          room_id?: string | null
          file_attachments?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          room_id?: string | null
          file_attachments?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          joined_at: string
          last_read_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          joined_at?: string
          last_read_at?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          room_type: 'general' | 'horse_group'
          created_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          room_type?: 'general' | 'horse_group'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          room_type?: 'general' | 'horse_group'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          membership_type: 'annual' | 'lifetime'
          status: 'pending' | 'active' | 'expired' | 'rejected'
          amount_paid: number
          payment_status: 'unpaid' | 'paid' | 'waived'
          applied_at: string
          approved_at: string | null
          approved_by: string | null
          expires_at: string | null
          admin_code_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          membership_type: 'annual' | 'lifetime'
          status?: 'pending' | 'active' | 'expired' | 'rejected'
          amount_paid: number
          payment_status?: 'unpaid' | 'paid' | 'waived'
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          expires_at?: string | null
          admin_code_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          membership_type?: 'annual' | 'lifetime'
          status?: 'pending' | 'active' | 'expired' | 'rejected'
          amount_paid?: number
          payment_status?: 'unpaid' | 'paid' | 'waived'
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          expires_at?: string | null
          admin_code_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      message_rate_limit: {
        Row: {
          id: string
          user_id: string
          message_count: number
          window_start: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_count?: number
          window_start?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_count?: number
          window_start?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'membership_approved' | 'membership_rejected' | 'new_message' | 'admin_announcement' | 'added_to_room'
          title: string
          message: string
          link: string | null
          is_read: boolean
          created_at: string
          related_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'membership_approved' | 'membership_rejected' | 'new_message' | 'admin_announcement' | 'added_to_room'
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          created_at?: string
          related_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'membership_approved' | 'membership_rejected' | 'new_message' | 'admin_announcement' | 'added_to_room'
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
          related_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'owner' | 'shareholder' | 'syndicate_partner' | 'trainer'
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'owner' | 'shareholder' | 'syndicate_partner' | 'trainer'
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'owner' | 'shareholder' | 'syndicate_partner' | 'trainer'
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          id: string
          room_id: string
          message_id: string | null
          uploaded_by: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          message_id?: string | null
          uploaded_by: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          message_id?: string | null
          uploaded_by?: string
          file_name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_admin_code: {
        Args: { code_input: string }
        Returns: string | null
      }
      generate_next_admin_code: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
