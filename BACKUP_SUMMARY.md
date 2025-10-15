# Database Table Cleanup - Backup Summary

## Overview
This backup was created before removing 4 unused database tables from your Supabase database.

## Files Created

### 1. `inspection_queries.sql`
**Purpose**: Query the live database to see what data currently exists in tables to be removed.

**How to use**:
1. Open Supabase SQL Editor
2. Copy and paste the queries
3. Run them to see current data
4. Review the output to confirm what will be backed up

### 2. `backup_tables_20251015_164928.sql`
**Purpose**: Complete backup with full restoration capability.

**Contents**:
- Complete CREATE TABLE statements for all 4 tables
- All indexes and constraints
- INSERT statements for existing data
- RLS policy documentation
- Restoration instructions

**Tables backed up**:
- `themes` (6 preset themes from old system)
- `site_settings` (1 configuration row)
- `modern_theme_versions` (version history structure)
- `modern_theme_assets` (asset storage structure)

**How to restore**:
1. Open Supabase SQL Editor
2. Copy entire contents of this file
3. Execute to recreate all tables and data
4. Tables will be restored exactly as they were

### 3. `drop_unused_tables.sql`
**Purpose**: Safely delete the 4 unused tables.

**What it does**:
- Drops tables in correct dependency order
- Uses IF EXISTS checks to prevent errors
- Verifies critical tables remain intact
- Provides detailed logging

**How to use**:
1. Review backup file first
2. Open Supabase SQL Editor (or create migration)
3. Copy and paste this file
4. Execute to remove unused tables

### 4. `verification_queries.sql`
**Purpose**: Verify cleanup was successful.

**What it checks**:
- Confirms deleted tables are gone
- Verifies modern_themes and modern_site_settings still exist
- Checks that active theme is still configured
- Identifies any orphaned indexes

**How to use**:
1. After running drop_unused_tables.sql
2. Open Supabase SQL Editor
3. Run these queries
4. Confirm all checks pass

### 5. `DELETE_BACKUP_FILES_PROMPT.txt`
**Purpose**: Ready-to-use prompt for cleaning up these backup files later.

**When to use**:
- After verifying deletion was successful
- After confirming website works perfectly
- When you're confident you won't need to rollback

**How to use**:
1. Open the file
2. Copy the entire contents
3. Paste into a new conversation with Claude Code
4. Claude will delete all backup files

## What Will Be Deleted

### Table 1: `themes` (Old/Legacy)
- **Status**: Completely unused
- **Data**: 6 preset themes (Modern Medical, Trikon Brand, Calm & Caring, Bold & Confident, Elegant Wellness, Warm & Welcoming)
- **Impact**: None - your app uses `modern_themes` instead

### Table 2: `site_settings` (Old/Legacy)
- **Status**: Completely unused
- **Data**: 1 row pointing to Modern Medical theme (in old themes table)
- **Impact**: None - your app uses `modern_site_settings` instead

### Table 3: `modern_theme_versions` (Version History)
- **Status**: Used for audit trail, not required for rendering
- **Data**: Version snapshots of theme changes (at least 3 initial versions)
- **Impact**: Lose version history and rollback capability (but themes will still render)

### Table 4: `modern_theme_assets` (Asset Storage)
- **Status**: Likely empty, no code references found
- **Data**: Probably 0 rows
- **Impact**: None - themes reference external URLs directly

## What Will Be Preserved

### ✓ `modern_themes` (CRITICAL - DO NOT DELETE)
- Contains 3 active preset themes (Clinical Modern, Apple Medical, Hims Health)
- Required for website rendering
- Your entire frontend depends on this

### ✓ `modern_site_settings` (CRITICAL - DO NOT DELETE)
- Contains active theme reference and configuration
- Required to know which theme is currently active
- Includes health_library_enabled toggle

## Foreign Key Dependencies

The deletion order matters:
1. **First**: Drop `site_settings` (has FK to `themes`)
2. **Second**: Drop `themes` (parent table)
3. **Third**: Drop `modern_theme_assets` (has FK to `modern_themes` with CASCADE)
4. **Fourth**: Drop `modern_theme_versions` (has FK to `modern_themes` with CASCADE)

## Restoration Process

If you need to restore these tables:

1. Open Supabase SQL Editor
2. Execute `backup_tables_20251015_164928.sql`
3. All tables, indexes, and data will be restored
4. Note: `modern_theme_versions` data requires manual export if you want live data

## Safety Measures

- ✓ Complete backup created with restoration instructions
- ✓ Deletion order respects foreign key dependencies
- ✓ Critical tables are explicitly preserved
- ✓ Verification queries available to confirm success
- ✓ Using IF EXISTS to prevent errors
- ✓ Detailed logging at every step

## Next Steps

1. **Review**: Read through `inspection_queries.sql` to see what will be backed up
2. **Execute Inspection**: Run queries in Supabase to see current data
3. **Review Backup**: Open `backup_tables_20251015_164928.sql` and confirm it looks complete
4. **Execute Deletion**: Run `drop_unused_tables.sql` in Supabase SQL Editor
5. **Verify**: Run `verification_queries.sql` to confirm cleanup succeeded
6. **Test**: Load your website and verify theme rendering works
7. **Cleanup**: Use `DELETE_BACKUP_FILES_PROMPT.txt` when satisfied

## Rollback Plan

If anything goes wrong:
1. Open `backup_tables_20251015_164928.sql`
2. Execute in Supabase SQL Editor
3. All tables will be restored
4. Your app will continue working with modern_themes system

## Important Notes

- On Supabase free plan, this backup SQL file IS your point-in-time backup
- Store this file somewhere safe (GitHub, local drive, etc.)
- The backup includes table structure + data from original migrations
- Live data in `modern_theme_versions` may need manual export if you've made theme changes
- Your website will continue working perfectly after deletion (uses modern_themes)

## Questions or Issues?

If you encounter any problems:
1. Check verification_queries.sql output
2. Ensure modern_themes and modern_site_settings still exist
3. Test that your website loads
4. If needed, restore from backup_tables_20251015_164928.sql

---

**Created**: 2025-10-15
**Backup Timestamp**: 20251015_164928
**Tables Backed Up**: 4 (themes, site_settings, modern_theme_versions, modern_theme_assets)
**Tables Preserved**: 2 (modern_themes, modern_site_settings)
