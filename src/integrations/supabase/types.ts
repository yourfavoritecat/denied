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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          commission_amount: number | null
          created_at: string
          deposit_amount: number | null
          id: string
          inquiry_message: string | null
          medical_notes: string | null
          preferred_dates: Json | null
          procedures: Json | null
          provider_estimated_dates: string | null
          provider_message: string | null
          provider_slug: string
          quoted_price: number | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_id: string | null
          trip_brief_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string
          deposit_amount?: number | null
          id?: string
          inquiry_message?: string | null
          medical_notes?: string | null
          preferred_dates?: Json | null
          procedures?: Json | null
          provider_estimated_dates?: string | null
          provider_message?: string | null
          provider_slug: string
          quoted_price?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          trip_brief_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_amount?: number | null
          created_at?: string
          deposit_amount?: number | null
          id?: string
          inquiry_message?: string | null
          medical_notes?: string | null
          preferred_dates?: Json | null
          procedures?: Json | null
          provider_estimated_dates?: string | null
          provider_message?: string | null
          provider_slug?: string
          quoted_price?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          trip_brief_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_brief_id_fkey"
            columns: ["trip_brief_id"]
            isOneToOne: false
            referencedRelation: "trip_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          notification_preferences: Json | null
          phone: string | null
          provider_slug: string | null
          public_profile: boolean
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          provider_slug?: string | null
          public_profile?: boolean
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          provider_slug?: string | null
          public_profile?: boolean
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      provider_applications: {
        Row: {
          business_name: string
          business_type: string
          certifications: string | null
          city: string
          contact_name: string
          country: string
          created_at: string
          email: string
          id: string
          languages: string[] | null
          phone: string
          specialties: string[] | null
          status: string
          updated_at: string
          website_url: string | null
          whatsapp: string | null
          why_join: string | null
          years_in_practice: number | null
        }
        Insert: {
          business_name: string
          business_type: string
          certifications?: string | null
          city: string
          contact_name: string
          country: string
          created_at?: string
          email: string
          id?: string
          languages?: string[] | null
          phone: string
          specialties?: string[] | null
          status?: string
          updated_at?: string
          website_url?: string | null
          whatsapp?: string | null
          why_join?: string | null
          years_in_practice?: number | null
        }
        Update: {
          business_name?: string
          business_type?: string
          certifications?: string | null
          city?: string
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          languages?: string[] | null
          phone?: string
          specialties?: string[] | null
          status?: string
          updated_at?: string
          website_url?: string | null
          whatsapp?: string | null
          why_join?: string | null
          years_in_practice?: number | null
        }
        Relationships: []
      }
      review_upvotes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_upvotes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_edited: boolean
          photos: string[] | null
          procedure_name: string
          provider_slug: string
          rating: number
          recommend: boolean
          review_text: string
          title: string
          updated_at: string
          user_id: string
          verified_trip: boolean
          videos: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_edited?: boolean
          photos?: string[] | null
          procedure_name: string
          provider_slug: string
          rating: number
          recommend?: boolean
          review_text: string
          title: string
          updated_at?: string
          user_id: string
          verified_trip?: boolean
          videos?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          is_edited?: boolean
          photos?: string[] | null
          procedure_name?: string
          provider_slug?: string
          rating?: number
          recommend?: boolean
          review_text?: string
          title?: string
          updated_at?: string
          user_id?: string
          verified_trip?: boolean
          videos?: string[] | null
        }
        Relationships: []
      }
      trip_briefs: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          destination: string | null
          id: string
          inquiry_description: string | null
          medical_notes: string | null
          procedures: Json | null
          status: string
          travel_end: string | null
          travel_start: string | null
          trip_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          destination?: string | null
          id?: string
          inquiry_description?: string | null
          medical_notes?: string | null
          procedures?: Json | null
          status?: string
          travel_end?: string | null
          travel_start?: string | null
          trip_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          destination?: string | null
          id?: string
          inquiry_description?: string | null
          medical_notes?: string | null
          procedures?: Json | null
          status?: string
          travel_end?: string | null
          travel_start?: string | null
          trip_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_planner_state: {
        Row: {
          booking_id: string
          id: string
          state_data: Json
          state_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          id?: string
          state_data?: Json
          state_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          id?: string
          state_data?: Json
          state_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_planner_state_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_user_list: {
        Args: never
        Returns: {
          created_at: string
          email: string
          user_id: string
        }[]
      }
      get_my_provider_slug: { Args: never; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
