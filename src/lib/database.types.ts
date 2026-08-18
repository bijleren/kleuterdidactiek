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
      schools: {
        Row: {
          id: string
          name: string
          school_code: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          premium_school: number
          created_at: string
          updated_at: string
          created_by: string | null
          owner_user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          school_code?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          premium_school?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          owner_user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          school_code?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          premium_school?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          owner_user_id?: string | null
        }
      }
      school_teammembers: {
        Row: {
          id: string
          school_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          school_id: string
          name: string
          grade_level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          grade_level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          grade_level?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          school_id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          profile_picture_url: string | null
          color: string | null
          symbol: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          profile_picture_url?: string | null
          color?: string | null
          symbol?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          profile_picture_url?: string | null
          color?: string | null
          symbol?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      educational_goals: {
        Row: {
          code: string
          domain: string
          subject: string
          title: string
          description: string
          created_at: string
        }
        Insert: {
          code: string
          domain: string
          subject: string
          title: string
          description: string
          created_at?: string
        }
        Update: {
          code?: string
          domain?: string
          subject?: string
          title?: string
          description?: string
          created_at?: string
        }
      }
      goal_tracking_sessions: {
        Row: {
          id: string
          group_id: string
          goal_codes: string[]
          activity_type: string
          activity_name: string | null
          practiced_at: string
          duration_minutes: number | null
          repetitions: number
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          goal_codes: string[]
          activity_type: string
          activity_name?: string | null
          practiced_at?: string
          duration_minutes?: number | null
          repetitions?: number
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          goal_codes?: string[]
          activity_type?: string
          activity_name?: string | null
          practiced_at?: string
          duration_minutes?: number | null
          repetitions?: number
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      group_goal_progress: {
        Row: {
          id: string
          group_id: string
          goal_code: string
          total_sessions: number
          total_repetitions: number
          last_practiced_at: string | null
          first_practiced_at: string | null
          mastery_level: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          goal_code: string
          total_sessions?: number
          total_repetitions?: number
          last_practiced_at?: string | null
          first_practiced_at?: string | null
          mastery_level?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          goal_code?: string
          total_sessions?: number
          total_repetitions?: number
          last_practiced_at?: string | null
          first_practiced_at?: string | null
          mastery_level?: string
          updated_at?: string
        }
      }
      vocabulary_practice_log: {
        Row: {
          id: string
          group_id: string
          word: string
          goal_codes: string[] | null
          clicked_at: string
          created_by: string
        }
        Insert: {
          id?: string
          group_id: string
          word: string
          goal_codes?: string[] | null
          clicked_at?: string
          created_by: string
        }
        Update: {
          id?: string
          group_id?: string
          word?: string
          goal_codes?: string[] | null
          clicked_at?: string
          created_by?: string
        }
      }
      student_evaluation_sessions: {
        Row: {
          id: string
          group_id: string
          goal_code: string
          observation_method: string
          observation_context: string | null
          evaluated_at: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          goal_code: string
          observation_method: string
          observation_context?: string | null
          evaluated_at?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          goal_code?: string
          observation_method?: string
          observation_context?: string | null
          evaluated_at?: string
          created_by?: string
          created_at?: string
        }
      }
      student_goal_evaluations: {
        Row: {
          id: string
          session_id: string
          student_id: string
          goal_code: string
          result: string
          comment: string | null
          evaluated_at: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          goal_code: string
          result: string
          comment?: string | null
          evaluated_at?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          goal_code?: string
          result?: string
          comment?: string | null
          evaluated_at?: string
          created_by?: string
          created_at?: string
        }
      }
      minimumdoelen: {
        Row: {
          code: string
          domein: string
          vakdiscipline: string
          onderwerp: string | null
          subthema: string | null
          type_onderwijsdoel: string
          is_te_bereiken: boolean
          doelzin: string
          uitbreiding: string | null
          woordenschat: string | null
          geldig_vanaf: string | null
          niveau: string
          onderwijsstructuur: string
          created_at: string
        }
        Insert: {
          code: string
          domein: string
          vakdiscipline: string
          onderwerp?: string | null
          subthema?: string | null
          type_onderwijsdoel: string
          is_te_bereiken?: boolean
          doelzin: string
          uitbreiding?: string | null
          woordenschat?: string | null
          geldig_vanaf?: string | null
          niveau?: string
          onderwijsstructuur?: string
          created_at?: string
        }
        Update: {
          code?: string
          domein?: string
          vakdiscipline?: string
          onderwerp?: string | null
          subthema?: string | null
          type_onderwijsdoel?: string
          is_te_bereiken?: boolean
          doelzin?: string
          uitbreiding?: string | null
          woordenschat?: string | null
          geldig_vanaf?: string | null
        }
      }
      netten: {
        Row: {
          code: string
          naam: string
          bron_url: string | null
          opgehaald_op: string | null
          sort_order: number
        }
        Insert: {
          code: string
          naam: string
          bron_url?: string | null
          opgehaald_op?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          naam?: string
          bron_url?: string | null
          opgehaald_op?: string | null
          sort_order?: number
        }
      }
      leerplandoelen: {
        Row: {
          id: string
          net_code: string
          doelnummer: string
          doelnummers: string[]
          omschrijving: string
          path: string[]
          path_labels: string[]
          leeftijd_25_4: boolean
          leeftijd_4_5: boolean
          leeftijd_5_6: boolean
          extra: Json
          bron_volgorde: number | null
          created_at: string
        }
        Insert: {
          id?: string
          net_code: string
          doelnummer: string
          doelnummers?: string[]
          omschrijving: string
          path?: string[]
          path_labels?: string[]
          leeftijd_25_4?: boolean
          leeftijd_4_5?: boolean
          leeftijd_5_6?: boolean
          extra?: Json
          bron_volgorde?: number | null
        }
        Update: {
          net_code?: string
          doelnummer?: string
          omschrijving?: string
          leeftijd_25_4?: boolean
          leeftijd_4_5?: boolean
          leeftijd_5_6?: boolean
          extra?: Json
        }
      }
      leerplandoel_minimumdoelen: {
        Row: {
          leerplandoel_id: string
          code: string
        }
        Insert: {
          leerplandoel_id: string
          code: string
        }
        Update: {
          leerplandoel_id?: string
          code?: string
        }
      }
      leerplandoel_details: {
        Row: {
          id: string
          leerplandoel_id: string
          soort: string
          tekst: string
          leeftijd_25_4: boolean
          leeftijd_4_5: boolean
          leeftijd_5_6: boolean
          volgorde: number
        }
        Insert: {
          id?: string
          leerplandoel_id: string
          soort: string
          tekst: string
          leeftijd_25_4?: boolean
          leeftijd_4_5?: boolean
          leeftijd_5_6?: boolean
          volgorde?: number
        }
        Update: {
          soort?: string
          tekst?: string
          volgorde?: number
        }
      }
    }
    Views: {
      v_doelen_per_leeftijd_en_net: {
        Row: {
          net_code: string
          net_naam: string
          leeftijd: string
          code: string
          vakdiscipline: string
          onderwerp: string | null
          doelzin: string
          is_te_bereiken: boolean
          in_app: boolean
          app_titel: string | null
          aantal_leerplandoelen: number
          doelnummers: string[]
        }
        Relationships: []
      }
      v_woord_per_net_en_leeftijd: {
        Row: {
          word_id: string
          word: string
          is_custom: boolean
          school_id: string | null
          net_code: string
          leeftijd_25_4: boolean
          leeftijd_4_5: boolean
          leeftijd_5_6: boolean
          precisie: string
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
