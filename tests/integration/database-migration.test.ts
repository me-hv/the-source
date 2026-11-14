import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Database Migration Verification", () => {
  const migrationsDir = path.resolve(__dirname, "../../supabase/migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

  it("should have at least one migration file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  const sqlContent = files
    .map((file) => fs.readFileSync(path.join(migrationsDir, file), "utf-8"))
    .join("\n");

  const expectedTables = [
    "profiles",
    "workspaces",
    "items",
    "item_assets",
    "tags",
    "item_tags",
    "collections",
    "collection_items",
    "item_connections",
  ];

  it("should create all 9 required tables", () => {
    expectedTables.forEach((table) => {
      const tableRegex = new RegExp(
        `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?public\\.${table}\\b`,
        "i"
      );
      expect(sqlContent).toMatch(tableRegex);
    });
  });

  it("should enable Row Level Security on all 9 tables", () => {
    expectedTables.forEach((table) => {
      const rlsRegex = new RegExp(
        `ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        "i"
      );
      expect(sqlContent).toMatch(rlsRegex);
    });
  });

  it("should enforce a single personal workspace per owner", () => {
    const singlePersonalWsRegex = /CREATE\s+UNIQUE\s+INDEX[\s\S]*?ON\s+public\.workspaces\s*\(\s*owner_id\s*\)\s*WHERE\s+is_personal\s*=\s*TRUE/i;
    expect(sqlContent).toMatch(singlePersonalWsRegex);
  });

  it("should prevent self-referencing item connections", () => {
    const noSelfConnRegex = /CHECK\s*\(\s*source_item_id\s*<>\s*target_item_id\s*\)/i;
    expect(sqlContent).toMatch(noSelfConnRegex);
  });

  it("should prevent duplicate equivalent item connections with a unique index", () => {
    const uniqueConnRegex = /CREATE\s+UNIQUE\s+INDEX[\s\S]*?ON\s+public\.item_connections\s*\(\s*workspace_id,\s*LEAST\(/i;
    expect(sqlContent).toMatch(uniqueConnRegex);
  });

  it("should define composite foreign keys to prevent cross-workspace references", () => {
    // Check item_assets -> items (workspace_id, item_id)
    const itemAssetsFk = /FOREIGN\s+KEY\s*\(\s*workspace_id,\s*item_id\s*\)\s*REFERENCES\s+public\.items\s*\(\s*workspace_id,\s*id\s*\)/i;
    expect(sqlContent).toMatch(itemAssetsFk);

    // Check item_tags -> items (workspace_id, item_id)
    const itemTagsFk = /FOREIGN\s+KEY\s*\(\s*workspace_id,\s*item_id\s*\)\s*REFERENCES\s+public\.items\s*\(\s*workspace_id,\s*id\s*\)/i;
    expect(sqlContent).toMatch(itemTagsFk);
  });

  it("should configure the private storage bucket source-assets with a 50MB limit", () => {
    expect(sqlContent).toContain("'source-assets'");
    expect(sqlContent).toContain("52428800"); // 50MB
    expect(sqlContent).toContain("audio/mpeg");
    expect(sqlContent).toContain("audio/wav");
    expect(sqlContent).toContain("image/png");
    expect(sqlContent).toContain("application/pdf");
  });

  it("should enforce workspace ownership for storage.objects via RLS", () => {
    const storageRlsRegex = /CREATE\s+POLICY[\s\S]*?ON\s+storage\.objects/i;
    expect(sqlContent).toMatch(storageRlsRegex);
    expect(sqlContent).toContain("is_workspace_owner");
  });
});
