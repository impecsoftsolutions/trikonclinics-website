import { createClient } from '@supabase/supabase-js';
import type { ThemeConfig } from '../types/modernTheme';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          email: string;
          role: 'Super Admin' | 'Admin' | 'Content Manager' | 'Viewer';
          created_by: string | null;
          last_login: string | null;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          email: string;
          role: 'Super Admin' | 'Admin' | 'Content Manager' | 'Viewer';
          created_by?: string | null;
          last_login?: string | null;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          email?: string;
          role?: 'Super Admin' | 'Admin' | 'Content Manager' | 'Viewer';
          created_by?: string | null;
          last_login?: string | null;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      hospital_profile: {
        Row: {
          id: string;
          name: string;
          about_text: string | null;
          mission: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          phone_numbers: string[] | null;
          emails: string[] | null;
          working_hours: string | null;
          logo_image: string | null;
          banner_image: string | null;
          last_updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          qualification: string | null;
          specialisation: string | null;
          years_of_experience: number;
          expertise_details: string | null;
          photo: string | null;
          display_order: number;
          is_enabled: boolean;
          added_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      testimonials: {
        Row: {
          id: string;
          patient_name: string;
          review_english: string | null;
          review_telugu: string | null;
          patient_photo: string | null;
          star_rating: number | null;
          display_order: number;
          is_published: boolean;
          added_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      services: {
        Row: {
          id: string;
          service_name: string;
          description: string | null;
          icon_image: string | null;
          display_order: number;
          is_enabled: boolean;
          added_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      contact_information: {
        Row: {
          id: string;
          address: string | null;
          phone_numbers: string[] | null;
          email_addresses: string[] | null;
          working_hours: string | null;
          appointment_booking_link: string | null;
          google_maps_code: string | null;
          last_updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      social_media: {
        Row: {
          id: string;
          platform_name: string;
          profile_url: string;
          is_enabled: boolean;
          display_order: number;
          last_updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          description: string | null;
          table_affected: string | null;
          record_id: string | null;
          created_at: string;
        };
      };
      modern_themes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          config: ThemeConfig;
          is_preset: boolean;
          config_hash: string | null;
          validation_status: 'passed' | 'failed' | 'pending';
          validation_errors: any;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      modern_site_settings: {
        Row: {
          id: string;
          active_theme_id: string | null;
          previous_theme_id: string | null;
          theme_hash: string | null;
          site_mode: 'light' | 'dark' | 'auto';
          activated_at: string | null;
          activated_by: string | null;
          rollback_deadline: string | null;
          high_contrast_enabled: boolean;
          reduced_motion_enabled: boolean;
          updated_at: string;
        };
      };
      health_library_categories: {
        Row: {
          id: string;
          category_name: string;
          slug: string;
          display_order: number;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_name: string;
          slug: string;
          display_order?: number;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_name?: string;
          slug?: string;
          display_order?: number;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      health_library_illnesses: {
        Row: {
          id: string;
          illness_name: string;
          slug: string;
          short_summary: string;
          meaning: string | null;
          symptoms: string[];
          management_treatment: string[];
          category_id: string | null;
          tags: string[];
          visibility: 'draft' | 'published';
          display_order: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          illness_name: string;
          slug: string;
          short_summary: string;
          meaning?: string | null;
          symptoms?: string[];
          management_treatment?: string[];
          category_id?: string | null;
          tags?: string[];
          visibility?: 'draft' | 'published';
          display_order?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          illness_name?: string;
          slug?: string;
          short_summary?: string;
          meaning?: string | null;
          symptoms?: string[];
          management_treatment?: string[];
          category_id?: string | null;
          tags?: string[];
          visibility?: 'draft' | 'published';
          display_order?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      health_library_images: {
        Row: {
          id: string;
          illness_id: string;
          image_url: string;
          alt_text: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          illness_id: string;
          image_url: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          illness_id?: string;
          image_url?: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          tag_name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tag_name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tag_name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          short_description: string;
          full_description: string;
          event_date: string;
          event_time: string | null;
          venue: string | null;
          highlights: string[] | null;
          status: 'draft' | 'published';
          is_featured: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          short_description: string;
          full_description: string;
          event_date: string;
          event_time?: string | null;
          venue?: string | null;
          highlights?: string[] | null;
          status?: 'draft' | 'published';
          is_featured?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          short_description?: string;
          full_description?: string;
          event_date?: string;
          event_time?: string | null;
          venue?: string | null;
          highlights?: string[] | null;
          status?: 'draft' | 'published';
          is_featured?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_images: {
        Row: {
          id: string;
          event_id: string;
          image_url_small: string;
          image_url_medium: string;
          image_url_large: string;
          alt_text: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          image_url_small: string;
          image_url_medium: string;
          image_url_large: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          image_url_small?: string;
          image_url_medium?: string;
          image_url_large?: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      event_videos: {
        Row: {
          id: string;
          event_id: string;
          youtube_url: string;
          youtube_video_id: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          youtube_url: string;
          youtube_video_id: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          youtube_url?: string;
          youtube_video_id?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      event_tags: {
        Row: {
          event_id: string;
          tag_id: string;
        };
        Insert: {
          event_id: string;
          tag_id: string;
        };
        Update: {
          event_id?: string;
          tag_id?: string;
        };
      };
      event_error_logs: {
        Row: {
          id: string;
          error_type: string;
          error_message: string;
          context_data: any;
          stack_trace: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          error_type: string;
          error_message: string;
          context_data?: any;
          stack_trace?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          error_type?: string;
          error_message?: string;
          context_data?: any;
          stack_trace?: string | null;
          created_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          events_enabled: boolean;
          events_public_access: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          events_enabled?: boolean;
          events_public_access?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          events_enabled?: boolean;
          events_public_access?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      url_redirects: {
        Row: {
          id: string;
          old_slug: string;
          new_slug: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          old_slug: string;
          new_slug: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          old_slug?: string;
          new_slug?: string;
          event_id?: string;
          created_at?: string;
        };
      };
    };
  };
};
