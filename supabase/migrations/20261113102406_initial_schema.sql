-- ==============================================================================
-- THE SOURCE - Phase 0 Initial Database Schema Migration
-- ==============================================================================
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. WORKSPACES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_personal BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure a user can only have exactly ONE personal workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_personal_owner 
  ON public.workspaces (owner_id) 
  WHERE is_personal = TRUE;

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);

-- ==============================================================================
-- SECURITY DEFINER HELPER: is_workspace_owner
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = ws_id AND owner_id = auth.uid()
  );
$$;

-- ==============================================================================
-- 3. ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'thought' CHECK (kind IN ('thought', 'lyric', 'recording', 'image', 'document', 'journal', 'reference', 'clip', 'quote', 'note')),
  content_type TEXT NOT NULL DEFAULT 'text',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  content TEXT,
  rich_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_markdown TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  journal_date DATE,
  mood TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  -- Compound unique constraint enables composite foreign keys for cross-workspace reference prevention
  CONSTRAINT uq_items_workspace_id UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_items_workspace_id ON public.items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_items_created_by ON public.items(created_by);
CREATE INDEX IF NOT EXISTS idx_items_kind ON public.items(kind);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_journal_date ON public.items(journal_date) WHERE kind = 'journal';
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON public.items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_items_search_vector ON public.items USING gin(search_vector);

-- Search vector update trigger
CREATE OR REPLACE FUNCTION public.items_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content_markdown, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_items_search_vector ON public.items;
CREATE TRIGGER trg_items_search_vector
BEFORE INSERT OR UPDATE OF title, content, content_markdown ON public.items
FOR EACH ROW EXECUTE FUNCTION public.items_search_vector_update();

-- ==============================================================================
-- 4. ITEM_ASSETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.item_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Composite foreign key guarantees asset cannot reference an item in another workspace
  CONSTRAINT fk_item_assets_item FOREIGN KEY (workspace_id, item_id) 
    REFERENCES public.items(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_item_assets_workspace_id UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_item_assets_item_id ON public.item_assets(workspace_id, item_id);

-- ==============================================================================
-- 5. TAGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tags_workspace_id UNIQUE (workspace_id, id),
  CONSTRAINT uq_tags_workspace_name UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_workspace_id ON public.tags(workspace_id);

-- ==============================================================================
-- 6. ITEM_TAGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.item_tags (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, tag_id),
  -- Composite foreign keys guarantee tags and items must share the same workspace
  CONSTRAINT fk_item_tags_item FOREIGN KEY (workspace_id, item_id) 
    REFERENCES public.items(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_item_tags_tag FOREIGN KEY (workspace_id, tag_id) 
    REFERENCES public.tags(workspace_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON public.item_tags(workspace_id, tag_id);

-- ==============================================================================
-- 7. COLLECTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID,
  cover_asset_id UUID REFERENCES public.item_assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_collections_workspace_id UNIQUE (workspace_id, id),
  CONSTRAINT fk_collections_parent FOREIGN KEY (workspace_id, parent_id)
    REFERENCES public.collections(workspace_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_workspace_id ON public.collections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON public.collections(parent_id);

-- ==============================================================================
-- 8. COLLECTION_ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.collection_items (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL,
  item_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, item_id),
  CONSTRAINT fk_collection_items_collection FOREIGN KEY (workspace_id, collection_id)
    REFERENCES public.collections(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_collection_items_item FOREIGN KEY (workspace_id, item_id)
    REFERENCES public.items(workspace_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_items_item ON public.collection_items(workspace_id, item_id);

-- ==============================================================================
-- 9. ITEM_CONNECTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.item_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_item_id UUID NOT NULL,
  target_item_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'related',
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_item_connections_source FOREIGN KEY (workspace_id, source_item_id)
    REFERENCES public.items(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_item_connections_target FOREIGN KEY (workspace_id, target_item_id)
    REFERENCES public.items(workspace_id, id) ON DELETE CASCADE,
  -- Rule: A connection cannot connect an item to itself
  CONSTRAINT chk_no_self_connection CHECK (source_item_id <> target_item_id)
);

-- Rule: Duplicate equivalent connections must be prevented
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_connections_unique ON public.item_connections (
  workspace_id,
  LEAST(source_item_id, target_item_id),
  GREATEST(source_item_id, target_item_id),
  relationship_type
);

CREATE INDEX IF NOT EXISTS idx_item_connections_source ON public.item_connections(workspace_id, source_item_id);
CREATE INDEX IF NOT EXISTS idx_item_connections_target ON public.item_connections(workspace_id, target_item_id);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_items_updated_at ON public.items;
CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_collections_updated_at ON public.collections;
CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. WORKSPACES
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create own workspaces"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own workspaces"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own workspaces"
  ON public.workspaces FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- 3. ITEMS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in own workspaces"
  ON public.items FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can insert items into own workspaces"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id) AND created_by = auth.uid());

CREATE POLICY "Users can update items in own workspaces"
  ON public.items FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete items in own workspaces"
  ON public.items FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- 4. ITEM_ASSETS
ALTER TABLE public.item_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view item assets in own workspaces"
  ON public.item_assets FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can insert item assets into own workspaces"
  ON public.item_assets FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can update item assets in own workspaces"
  ON public.item_assets FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete item assets in own workspaces"
  ON public.item_assets FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- 5. TAGS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags in own workspaces"
  ON public.tags FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can insert tags into own workspaces"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can update tags in own workspaces"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete tags in own workspaces"
  ON public.tags FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- 6. ITEM_TAGS
ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view item_tags in own workspaces"
  ON public.item_tags FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can insert item_tags into own workspaces"
  ON public.item_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete item_tags in own workspaces"
  ON public.item_tags FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- 7. COLLECTIONS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collections in own workspaces"
  ON public.collections FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can insert collections into own workspaces"
  ON public.collections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can update collections in own workspaces"
  ON public.collections FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete collections in own workspaces"
  ON public.collections FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- 8. COLLECTION_ITEMS
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collection_items in own workspaces"
  ON public.collection_items FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can insert collection_items into own workspaces"
  ON public.collection_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can update collection_items in own workspaces"
  ON public.collection_items FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete collection_items in own workspaces"
  ON public.collection_items FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- 9. ITEM_CONNECTIONS
ALTER TABLE public.item_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view item_connections in own workspaces"
  ON public.item_connections FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can insert item_connections into own workspaces"
  ON public.item_connections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id) AND created_by = auth.uid());

CREATE POLICY "Users can update item_connections in own workspaces"
  ON public.item_connections FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete item_connections in own workspaces"
  ON public.item_connections FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- ==============================================================================
-- 10. SUPABASE STORAGE BUCKET & STORAGE RLS POLICIES
-- ==============================================================================
-- Private bucket: source-assets
-- File limit: 50MB (52428800 bytes)
-- Path format: workspace_id/item_id/unique-filename
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'source-assets',
  'source-assets',
  false,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/flac',
    'application/pdf',
    'text/plain',
    'text/markdown'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users can view storage objects in own workspaces"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'source-assets'
    AND public.is_workspace_owner(NULLIF(split_part(name, '/', 1), '')::uuid)
  );

CREATE POLICY "Users can upload storage objects to own workspaces"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'source-assets'
    AND public.is_workspace_owner(NULLIF(split_part(name, '/', 1), '')::uuid)
  );

CREATE POLICY "Users can update storage objects in own workspaces"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'source-assets'
    AND public.is_workspace_owner(NULLIF(split_part(name, '/', 1), '')::uuid)
  )
  WITH CHECK (
    bucket_id = 'source-assets'
    AND public.is_workspace_owner(NULLIF(split_part(name, '/', 1), '')::uuid)
  );

CREATE POLICY "Users can delete storage objects in own workspaces"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'source-assets'
    AND public.is_workspace_owner(NULLIF(split_part(name, '/', 1), '')::uuid)
  );

-- ==============================================================================
-- 11. AUTOMATED ONBOARDING TRIGGER (AUTH.USERS -> PROFILES & PERSONAL WORKSPACE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_name TEXT;
  ws_title TEXT;
BEGIN
  clean_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- 1. Create Profile
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    clean_name,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    updated_at = NOW();

  -- 2. Create Personal Workspace
  ws_title := clean_name || '''s Studio';

  INSERT INTO public.workspaces (owner_id, name, description, is_personal)
  VALUES (
    NEW.id,
    ws_title,
    'Personal creative workspace',
    TRUE
  )
  ON CONFLICT (owner_id) WHERE is_personal = TRUE DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
