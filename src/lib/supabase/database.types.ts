export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RequestStatus = "new" | "in_progress" | "approved" | "in_work" | "completed" | "rejected";
export type ContractStatus = "draft" | "sent" | "revision_requested" | "accepted" | "cancelled";
export type UserRole = "admin" | "manager" | "client";
export type AnalyticsEventType = "page_view" | "cta_click";
export type NotificationType = "request_created" | "request_status_changed" | "contract_revision_requested" | "system";
export type NotificationAudienceRole = "admin" | "manager";
export type ImageParentType = "project" | "page" | "service" | "free";
export type TranslationEntityType =
  | "page"
  | "service"
  | "service_package"
  | "service_addon"
  | "project"
  | "tag"
  | "image";
export type TranslationLocale = "ru" | "en";

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          id: string;
          event_type: AnalyticsEventType;
          path: string;
          search: string;
          referrer: string;
          href: string;
          label: string;
          source_hash: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: AnalyticsEventType;
          path: string;
          search?: string;
          referrer?: string;
          href?: string;
          label?: string;
          source_hash?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: AnalyticsEventType;
          path?: string;
          search?: string;
          referrer?: string;
          href?: string;
          label?: string;
          source_hash?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      entity_translations: {
        Row: {
          id: string;
          entity_type: TranslationEntityType;
          entity_id: string;
          locale: TranslationLocale;
          fields: Json;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: TranslationEntityType;
          entity_id: string;
          locale: TranslationLocale;
          fields?: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: TranslationEntityType;
          entity_id?: string;
          locale?: TranslationLocale;
          fields?: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      images: {
        Row: {
          id: string;
          storage_path: string;
          public_url: string;
          title: string;
          caption: string;
          parent_type: ImageParentType;
          parent_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          storage_path: string;
          public_url?: string;
          title?: string;
          caption?: string;
          parent_type: ImageParentType;
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          storage_path?: string;
          public_url?: string;
          title?: string;
          caption?: string;
          parent_type?: ImageParentType;
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_cover_image_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["cover_image_id"];
          }
        ];
      };
      notification_reads: {
        Row: {
          notification_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          notification_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {
          notification_id?: string;
          user_id?: string;
          read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          type: NotificationType;
          title: string;
          body: string;
          entity_type: string;
          entity_id: string | null;
          audience_role: NotificationAudienceRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: NotificationType;
          title: string;
          body?: string;
          entity_type?: string;
          entity_id?: string | null;
          audience_role?: NotificationAudienceRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: NotificationType;
          title?: string;
          body?: string;
          entity_type?: string;
          entity_id?: string | null;
          audience_role?: NotificationAudienceRole;
          created_at?: string;
        };
        Relationships: [];
      };
      order_contracts: {
        Row: {
          id: string;
          request_id: string;
          final_price: number;
          final_duration_days: number;
          work_scope: string;
          materials: string;
          manager_comment: string;
          status: ContractStatus;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          final_price?: number;
          final_duration_days?: number;
          work_scope?: string;
          materials?: string;
          manager_comment?: string;
          status?: ContractStatus;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          final_price?: number;
          final_duration_days?: number;
          work_scope?: string;
          materials?: string;
          manager_comment?: string;
          status?: ContractStatus;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_contracts_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: true;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          }
        ];
      };
      order_contract_feedback: {
        Row: {
          id: string;
          contract_id: string;
          request_id: string;
          client_user_id: string | null;
          author_role: "client" | "manager" | "admin";
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          request_id: string;
          client_user_id?: string | null;
          author_role?: "client" | "manager" | "admin";
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          request_id?: string;
          client_user_id?: string | null;
          author_role?: "client" | "manager" | "admin";
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      order_attachments: {
        Row: {
          id: string;
          request_id: string;
          client_user_id: string | null;
          storage_path: string;
          file_name: string;
          content_type: string;
          size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          client_user_id?: string | null;
          storage_path: string;
          file_name: string;
          content_type: string;
          size: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          client_user_id?: string | null;
          storage_path?: string;
          file_name?: string;
          content_type?: string;
          size?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_attachments_client_user_id_fkey";
            columns: ["client_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_attachments_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          }
        ];
      };
      pages: {
        Row: {
          id: string;
          page_key: string;
          title: string;
          body: string;
          blocks: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_key: string;
          title: string;
          body?: string;
          blocks?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_key?: string;
          title?: string;
          body?: string;
          blocks?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_images: {
        Row: {
          project_id: string;
          image_id: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          image_id: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          image_id?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_images_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_images_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      project_services: {
        Row: {
          project_id: string;
          service_id: string;
        };
        Insert: {
          project_id: string;
          service_id: string;
        };
        Update: {
          project_id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_services_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      project_tags: {
        Row: {
          project_id: string;
          tag_id: string;
        };
        Insert: {
          project_id: string;
          tag_id: string;
        };
        Update: {
          project_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          short_description: string;
          full_description: string;
          cover_image_url: string;
          display_order: number;
          is_featured: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          cover_image_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          short_description?: string;
          full_description?: string;
          cover_image_url?: string;
          display_order?: number;
          is_featured?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          cover_image_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          short_description?: string;
          full_description?: string;
          cover_image_url?: string;
          display_order?: number;
          is_featured?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          cover_image_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_cover_image_id_fkey";
            columns: ["cover_image_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          }
        ];
      };
      request_claim_tokens: {
        Row: {
          id: string;
          request_id: string;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          token_hash?: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "request_claim_tokens_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          }
        ];
      };
      request_status_history: {
        Row: {
          id: string;
          request_id: string;
          from_status: RequestStatus | null;
          to_status: RequestStatus;
          changed_by_user_id: string | null;
          changed_by_role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          from_status?: RequestStatus | null;
          to_status: RequestStatus;
          changed_by_user_id?: string | null;
          changed_by_role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          from_status?: RequestStatus | null;
          to_status?: RequestStatus;
          changed_by_user_id?: string | null;
          changed_by_role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "request_status_history_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          }
        ];
      };
      requests: {
        Row: {
          id: string;
          client_name: string;
          contact_method: string;
          contact_value: string;
          service_id: string | null;
          service_title: string;
          package_id: string | null;
          package_title: string;
          package_description: string;
          package_price_from: number | null;
          package_price_to: number | null;
          package_duration_from_days: number | null;
          package_duration_to_days: number | null;
          selected_addons: Json;
          reference_project_id: string | null;
          reference_project_title: string;
          reference_project_slug: string;
          result_description: string;
          style_preferences: string;
          materials: string;
          desired_deadline: string;
          estimated_price_from: number | null;
          estimated_price_to: number | null;
          estimated_duration_from_days: number | null;
          estimated_duration_to_days: number | null;
          comment: string;
          client_user_id: string | null;
          source_hash: string;
          status: RequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          contact_method: string;
          contact_value: string;
          service_id?: string | null;
          service_title?: string;
          package_id?: string | null;
          package_title?: string;
          package_description?: string;
          package_price_from?: number | null;
          package_price_to?: number | null;
          package_duration_from_days?: number | null;
          package_duration_to_days?: number | null;
          selected_addons?: Json;
          reference_project_id?: string | null;
          reference_project_title?: string;
          reference_project_slug?: string;
          result_description?: string;
          style_preferences?: string;
          materials?: string;
          desired_deadline?: string;
          estimated_price_from?: number | null;
          estimated_price_to?: number | null;
          estimated_duration_from_days?: number | null;
          estimated_duration_to_days?: number | null;
          comment?: string;
          client_user_id?: string | null;
          source_hash?: string;
          status?: RequestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_name?: string;
          contact_method?: string;
          contact_value?: string;
          service_id?: string | null;
          service_title?: string;
          package_id?: string | null;
          package_title?: string;
          package_description?: string;
          package_price_from?: number | null;
          package_price_to?: number | null;
          package_duration_from_days?: number | null;
          package_duration_to_days?: number | null;
          selected_addons?: Json;
          reference_project_id?: string | null;
          reference_project_title?: string;
          reference_project_slug?: string;
          result_description?: string;
          style_preferences?: string;
          materials?: string;
          desired_deadline?: string;
          estimated_price_from?: number | null;
          estimated_price_to?: number | null;
          estimated_duration_from_days?: number | null;
          estimated_duration_to_days?: number | null;
          comment?: string;
          client_user_id?: string | null;
          source_hash?: string;
          status?: RequestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requests_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "service_packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_reference_project_id_fkey";
            columns: ["reference_project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      service_addons: {
        Row: {
          id: string;
          service_id: string;
          title: string;
          description: string;
          price: number;
          duration_days: number;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          title: string;
          description?: string;
          price?: number;
          duration_days?: number;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          title?: string;
          description?: string;
          price?: number;
          duration_days?: number;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_addons_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      service_packages: {
        Row: {
          id: string;
          service_id: string;
          title: string;
          description: string;
          badge: string;
          best_for: string;
          outcome: string;
          included_items: string[];
          price_from: number;
          price_to: number;
          duration_from_days: number;
          duration_to_days: number;
          display_order: number;
          is_active: boolean;
          is_recommended: boolean;
          recommendation_tags: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          title: string;
          description?: string;
          badge?: string;
          best_for?: string;
          outcome?: string;
          included_items?: string[];
          price_from?: number;
          price_to?: number;
          duration_from_days?: number;
          duration_to_days?: number;
          display_order?: number;
          is_active?: boolean;
          is_recommended?: boolean;
          recommendation_tags?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          title?: string;
          description?: string;
          badge?: string;
          best_for?: string;
          outcome?: string;
          included_items?: string[];
          price_from?: number;
          price_to?: number;
          duration_from_days?: number;
          duration_to_days?: number;
          display_order?: number;
          is_active?: boolean;
          is_recommended?: boolean;
          recommendation_tags?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_packages_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      services: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          details: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string;
          details?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          details?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      request_order_contract_revision: {
        Args: {
          target_contract_id: string;
          feedback_message: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];
