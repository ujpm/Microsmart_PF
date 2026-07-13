export interface Database {
  public: {
    Tables: {
      annotator_sessions: {
        Row: {
          session_id: string;
          annotator_name: string;
          credentials: string;
          start_time: string;
          end_time: string | null;
          status: 'In Progress' | 'Completed';
          digital_signature: string | null;
        };
        Insert: Omit<Database['public']['Tables']['annotator_sessions']['Row'], 'session_id'>;
      };
      annotations: {
        Row: {
          id: string;
          session_id: string;
          slide_index: number;
          slide_id: string;
          trophozoite_count: number;
          gametocyte_count: number;
          is_flagged: boolean;
          time_taken_seconds: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['annotations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['annotations']['Insert']>;
      };
    };
  };
}
