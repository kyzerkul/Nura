export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      companions: {
        Row: Companion;
        Insert: CompanionInsert;
        Update: CompanionUpdate;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: ConversationUpdate;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
        Relationships: [];
      };
      conversation_summaries: {
        Row: ConversationSummary;
        Insert: ConversationSummaryInsert;
        Update: ConversationSummaryUpdate;
        Relationships: [];
      };
      push_tokens: {
        Row: PushToken;
        Insert: PushTokenInsert;
        Update: PushTokenUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// --- Row types (what you SELECT) ---

export type Profile = {
  id: string;
  display_name: string | null;
  language: 'fr' | 'en';
  notification_frequency: 'off' | 'daily' | 'twice_daily' | 'weekly';
  timezone: string | null;
  last_proactive_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Companion = {
  id: string;
  user_id: string;
  name: string;
  persona: string;
  tone: 'warm' | 'playful' | 'calm';
  is_active: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  companion_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  conversation_id: string;
  summary: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type PushToken = {
  id: string;
  user_id: string;
  token: string;
  device_id: string;
  created_at: string;
};

// --- Insert types (omit server-generated fields) ---

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type CompanionInsert = Omit<Companion, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type MessageInsert = Omit<Message, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ConversationSummaryInsert = Omit<ConversationSummary, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PushTokenInsert = Omit<PushToken, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// --- Update types (all fields optional except id) ---

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type CompanionUpdate = Partial<Omit<Companion, 'id' | 'user_id' | 'created_at'>>;

export type ConversationUpdate = Partial<Omit<Conversation, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string;
};

export type MessageUpdate = Partial<Omit<Message, 'id' | 'conversation_id' | 'created_at'>>;

export type ConversationSummaryUpdate = Partial<Omit<ConversationSummary, 'id' | 'conversation_id' | 'created_at'>> & {
  updated_at?: string;
};

export type PushTokenUpdate = Partial<Omit<PushToken, 'id' | 'user_id' | 'created_at'>>;
