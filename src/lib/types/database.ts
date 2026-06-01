export type MembershipRole = "HOST" | "CO_HOST" | "PLAYER";
export type MembershipStatus = "ACTIVE" | "LEFT" | "BANNED";
export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type ParticipationStatus = "CONFIRMED" | "STANDBY" | "DECLINED" | "DROPPED_OUT";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
export type PaymentProvider = "UPI_INTENT";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by_user_id: string;
  whatsapp_group_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  group_id: string;
  created_by_user_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location_name: string;
  location_address: string;
  google_maps_link: string | null;
  max_players: number;
  fee_per_player: number;
  prepayment_required: boolean;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

export interface MatchParticipation {
  id: string;
  match_id: string;
  user_id: string;
  status: ParticipationStatus;
  joined_at: string;
  dropped_out_at: string | null;
}

export interface Payment {
  id: string;
  match_id: string;
  payer_user_id: string;
  amount: number;
  currency: string;
  upi_intent_url: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  transaction_ref: string;
  created_at: string;
  updated_at: string;
}

export interface GroupWithRole extends Group {
  role: MembershipRole;
  member_count: number;
}

export interface MatchWithCounts extends Match {
  confirmed_count: number;
  group_name: string;
}

export interface ParticipationWithUser extends MatchParticipation {
  user: Pick<User, "id" | "name" | "email">;
  payment: Payment | null;
}

type Tables = {
  users: {
    Row: User;
    Insert: Omit<User, "created_at" | "updated_at"> & {
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<User, "id">>;
    Relationships: [];
  };
  cricket_groups: {
    Row: Group;
    Insert: Omit<Group, "id" | "created_at" | "updated_at"> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<Group, "id">>;
    Relationships: [];
  };
  group_memberships: {
    Row: GroupMembership;
    Insert: Omit<GroupMembership, "id" | "created_at" | "updated_at"> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<GroupMembership, "id">>;
    Relationships: [
      {
        foreignKeyName: "group_memberships_group_id_fkey";
        columns: ["group_id"];
        isOneToOne: false;
        referencedRelation: "cricket_groups";
        referencedColumns: ["id"];
      },
    ];
  };
  matches: {
    Row: Match;
    Insert: Omit<Match, "id" | "created_at" | "updated_at"> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<Match, "id">>;
    Relationships: [
      {
        foreignKeyName: "matches_group_id_fkey";
        columns: ["group_id"];
        isOneToOne: false;
        referencedRelation: "cricket_groups";
        referencedColumns: ["id"];
      },
    ];
  };
  match_participations: {
    Row: MatchParticipation;
    Insert: Omit<MatchParticipation, "id" | "joined_at" | "dropped_out_at"> & {
      id?: string;
      joined_at?: string;
      dropped_out_at?: string | null;
    };
    Update: Partial<Omit<MatchParticipation, "id">>;
    Relationships: [];
  };
  payments: {
    Row: Payment;
    Insert: Omit<Payment, "id" | "created_at" | "updated_at"> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<Payment, "id">>;
    Relationships: [];
  };
};

export interface Database {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      membership_role: MembershipRole;
      membership_status: MembershipStatus;
      match_status: MatchStatus;
      participation_status: ParticipationStatus;
      payment_status: PaymentStatus;
      payment_provider: PaymentProvider;
    };
    CompositeTypes: Record<string, never>;
  };
}
