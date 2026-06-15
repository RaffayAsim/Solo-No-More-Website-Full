/**
 * TypeScript types for the Solo-No-More Supabase schema.
 * Covers Phase 1 (profiles) and Phase 3 (friends, beacons, beacon_applications).
 *
 * Keep in sync with backend/phase1_schema.sql and backend/phase3_schema.sql.
 */

// ─── Phase 1 ─────────────────────────────────────────────────────────────────

export type SubscriptionTier = "none" | "member" | "family" | "admin";
export type AccountStatus =
  | "pending_vetting"
  | "approved"
  | "rejected"
  | "suspended";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  social_link: string | null;
  subscription_tier: SubscriptionTier;
  account_status: AccountStatus;
  city: string;
  avatar_icon: string;
  is_partner: boolean;
  business_name: string | null;
  vibe_tags: string[];
  is_active_seeker: boolean;
  seeker_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Phase 3 ─────────────────────────────────────────────────────────────────

export type FriendStatus = "pending" | "accepted" | "blocked";

export interface Friend {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
}

export type BeaconCategory = "sports" | "casual" | "nightlife";
export type BeaconVisibility = "stranger" | "friend";
export type BeaconStatus = "active" | "completed" | "cancelled";

export interface Beacon {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  category: BeaconCategory;
  visibility_mode: BeaconVisibility;
  total_slots: number;
  filled_slots: number;
  location_name: string | null;
  scheduled_at: string | null;
  google_maps_url: string | null;
  status: BeaconStatus;
  city: string;
  image_url: string | null;
  is_partner_offer: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_icon: string | null;
  } | null;
  application_status?: "pending" | "approved" | "declined" | "none";
}

export type BeaconApplicationStatus = "pending" | "approved" | "declined" | "withdrawn";

export interface BeaconApplication {
  id: string;
  beacon_id: string;
  applicant_id: string;
  status: BeaconApplicationStatus;
  flagged_ghost?: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Phase 11 — Notifications ─────────────────────────────────────────────────

export type NotificationType =
  | "beacon_near_start"
  | "beacon_no_attendees"
  | "beacon_not_full"
  | "beacon_no_interest"
  | "attendance_reminder"
  | "post_event_vibe_check"
  | "beacon_full"
  | "application_approved"
  | "application_declined"
  | "guest_withdrew"
  | "beacon_cancelled"
  | "capacity_changed"
  | "new_request_pending"
  | "pending_request_reminder"
  | "spot_available";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  related_beacon_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type VibeRating = "vibe_matched" | "meh" | "no_show_zone";

export interface EventFeedback {
  id: string;
  beacon_id: string;
  rater_id: string;
  rating: VibeRating;
  created_at: string;
}

// ─── Phase 12 — Memories ──────────────────────────────────────────────────────

export interface BeaconMemory {
  id: string;
  beacon_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  is_public: boolean;
  created_at: string;
}

// ─── Input types (for create/update operations) ───────────────────────────────

export type CreateBeaconInput = {
  title: string;
  description?: string;
  category: BeaconCategory;
  visibility_mode: BeaconVisibility;
  total_slots: number;
  location_name?: string;
  scheduled_at?: string;
  google_maps_url?: string;
  city?: string;
  image_url?: string;
  is_partner_offer?: boolean;
};

// ─── Supabase Database type map ───────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      friends: {
        Row: Friend;
        Insert: Omit<Friend, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<Friend, "status">>;
        Relationships: [
          { foreignKeyName: "friends_user_id_1_fkey"; columns: ["user_id_1"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "friends_user_id_2_fkey"; columns: ["user_id_2"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      beacons: {
        Row: Beacon;
        Insert: Omit<Beacon, "id" | "filled_slots" | "created_at" | "updated_at"> & {
          id?: string;
          filled_slots?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Beacon, "id" | "host_id" | "created_at">>;
        Relationships: [
          { foreignKeyName: "beacons_host_id_fkey"; columns: ["host_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      beacon_applications: {
        Row: BeaconApplication;
        Insert: Omit<BeaconApplication, "id" | "created_at" | "updated_at"> & {
          id?: string;
          status?: BeaconApplicationStatus;
          flagged_ghost?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<BeaconApplication, "status" | "flagged_ghost">>;
        Relationships: [
          { foreignKeyName: "beacon_applications_beacon_id_fkey"; columns: ["beacon_id"]; referencedRelation: "beacons"; referencedColumns: ["id"] },
          { foreignKeyName: "beacon_applications_applicant_id_fkey"; columns: ["applicant_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<Notification, "is_read">>;
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      event_feedback: {
        Row: EventFeedback;
        Insert: Omit<EventFeedback, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      beacon_memories: {
        Row: BeaconMemory;
        Insert: Omit<BeaconMemory, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<BeaconMemory, "id" | "created_at">>;
        Relationships: [
          { foreignKeyName: "beacon_memories_beacon_id_fkey"; columns: ["beacon_id"]; referencedRelation: "beacons"; referencedColumns: ["id"] },
          { foreignKeyName: "beacon_memories_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      official_events: {
        Row: OfficialEvent;
        Insert: Omit<OfficialEvent, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<OfficialEvent, "id" | "created_at">>;
        Relationships: [];
      };
      event_tickets: {
        Row: EventTicket;
        Insert: Omit<EventTicket, "id" | "created_at" | "updated_at"> & {
          id?: string;
          ticket_status?: EventTicketStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<EventTicket, "ticket_status">>;
        Relationships: [
          { foreignKeyName: "event_tickets_event_id_fkey"; columns: ["event_id"]; referencedRelation: "official_events"; referencedColumns: ["id"] },
          { foreignKeyName: "event_tickets_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
      account_status: AccountStatus;
      beacon_category: BeaconCategory;
      beacon_visibility: BeaconVisibility;
      beacon_status: BeaconStatus;
      friend_status: FriendStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

// ─── Phase 6 ─────────────────────────────────────────────────────────────────

export type OfficialEventType = "artist_split" | "platform_owned";
export type EventTicketStatus = "active" | "scanned" | "cancelled";

export interface OfficialEvent {
  id: string;
  title: string;
  description: string | null;
  venue_name: string | null;
  event_type: OfficialEventType;
  price: number;
  max_capacity: number;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
}

export interface EventTicket {
  id: string;
  event_id: string;
  user_id: string;
  ticket_status: EventTicketStatus;
  created_at: string;
  updated_at: string;
}

