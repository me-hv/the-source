export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ItemKind =
  | "thought"
  | "lyric"
  | "recording"
  | "image"
  | "document"
  | "journal"
  | "reference"
  | "clip"
  | "quote"
  | "note";

export type ItemStatus = "active" | "archived" | "draft";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          is_personal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          is_personal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          is_personal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      items: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          title: string;
          kind: ItemKind;
          content_type: string;
          status: ItemStatus;
          content: string | null;
          rich_content: Json;
          content_markdown: string | null;
          metadata: Json;
          journal_date: string | null;
          mood: string | null;
          is_favorite: boolean;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          title?: string;
          kind?: ItemKind;
          content_type?: string;
          status?: ItemStatus;
          content?: string | null;
          rich_content?: Json;
          content_markdown?: string | null;
          metadata?: Json;
          journal_date?: string | null;
          mood?: string | null;
          is_favorite?: boolean;
          search_vector?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          title?: string;
          kind?: ItemKind;
          content_type?: string;
          status?: ItemStatus;
          content?: string | null;
          rich_content?: Json;
          content_markdown?: string | null;
          metadata?: Json;
          journal_date?: string | null;
          mood?: string | null;
          is_favorite?: boolean;
          search_vector?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      item_assets: {
        Row: {
          id: string;
          workspace_id: string;
          item_id: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          file_size: number;
          checksum: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          item_id: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          file_size: number;
          checksum?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          item_id?: string;
          storage_path?: string;
          original_filename?: string;
          mime_type?: string;
          file_size?: number;
          checksum?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_item_assets_item";
            columns: ["workspace_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["workspace_id", "id"];
          }
        ];
      };
      tags: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      item_tags: {
        Row: {
          workspace_id: string;
          item_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          item_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          item_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_item_tags_item";
            columns: ["workspace_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "fk_item_tags_tag";
            columns: ["workspace_id", "tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["workspace_id", "id"];
          }
        ];
      };
      collections: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          parent_id: string | null;
          cover_asset_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          parent_id?: string | null;
          cover_asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          parent_id?: string | null;
          cover_asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      collection_items: {
        Row: {
          workspace_id: string;
          collection_id: string;
          item_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          workspace_id: string;
          collection_id: string;
          item_id: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          workspace_id?: string;
          collection_id?: string;
          item_id?: string;
          position?: number;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_collection_items_collection";
            columns: ["workspace_id", "collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "fk_collection_items_item";
            columns: ["workspace_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["workspace_id", "id"];
          }
        ];
      };
      item_connections: {
        Row: {
          id: string;
          workspace_id: string;
          source_item_id: string;
          target_item_id: string;
          relationship_type: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          source_item_id: string;
          target_item_id: string;
          relationship_type?: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          source_item_id?: string;
          target_item_id?: string;
          relationship_type?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_item_connections_source";
            columns: ["workspace_id", "source_item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "fk_item_connections_target";
            columns: ["workspace_id", "target_item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["workspace_id", "id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_owner: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
