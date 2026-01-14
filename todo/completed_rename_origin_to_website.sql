-- Migration: Rename origin table to website
-- Run this BEFORE updating TypeScript code
-- Wrapped in transaction for atomicity

BEGIN;

-- Rename main table and column
ALTER TABLE origin RENAME TO website;
ALTER TABLE website RENAME COLUMN origin_lang TO source_lang;

-- Rename related tables
ALTER TABLE origin_segment RENAME TO website_segment;
ALTER TABLE origin_path RENAME TO website_path;
ALTER TABLE origin_path_segment RENAME TO website_path_segment;
ALTER TABLE origin_path_view RENAME TO website_path_view;

-- Rename foreign key columns
ALTER TABLE host RENAME COLUMN origin_id TO website_id;
ALTER TABLE website_segment RENAME COLUMN origin_id TO website_id;
ALTER TABLE website_path RENAME COLUMN origin_id TO website_id;
ALTER TABLE website_path_segment RENAME COLUMN origin_path_id TO website_path_id;
ALTER TABLE website_path_segment RENAME COLUMN origin_segment_id TO website_segment_id;
ALTER TABLE website_path_view RENAME COLUMN origin_path_id TO website_path_id;
ALTER TABLE translated_segment RENAME COLUMN origin_segment_id TO website_segment_id;
ALTER TABLE translated_path RENAME COLUMN origin_path_id TO website_path_id;

-- Rename sequences
ALTER SEQUENCE origin_id_seq RENAME TO website_id_seq;
ALTER SEQUENCE origin_segment_id_seq RENAME TO website_segment_id_seq;
ALTER SEQUENCE origin_path_id_seq RENAME TO website_path_id_seq;

-- Rename primary key indexes
ALTER INDEX origin_pkey RENAME TO website_pkey;
ALTER INDEX origin_segment_pkey RENAME TO website_segment_pkey;
ALTER INDEX origin_path_pkey RENAME TO website_path_pkey;
ALTER INDEX origin_path_segment_pkey RENAME TO website_path_segment_pkey;
ALTER INDEX origin_path_view_pkey RENAME TO website_path_view_pkey;

-- Rename other indexes
ALTER INDEX idx_host_origin_id RENAME TO idx_host_website_id;
ALTER INDEX origin_segment_origin_id_text_hash_key RENAME TO website_segment_website_id_text_hash_key;
ALTER INDEX origin_path_origin_id_path_key RENAME TO website_path_website_id_path_key;
ALTER INDEX idx_origin_path_segment_segment RENAME TO idx_website_path_segment_segment;
ALTER INDEX idx_origin_path_view_date RENAME TO idx_website_path_view_date;
ALTER INDEX translated_segment_origin_segment_id_lang_key RENAME TO translated_segment_website_segment_id_lang_key;
ALTER INDEX translated_path_origin_path_id_lang_key RENAME TO translated_path_website_path_id_lang_key;

-- Rename foreign key constraints
ALTER TABLE host RENAME CONSTRAINT host_origin_id_fkey TO host_website_id_fkey;
ALTER TABLE website_segment RENAME CONSTRAINT origin_segment_origin_id_fkey TO website_segment_website_id_fkey;
ALTER TABLE website_path RENAME CONSTRAINT origin_path_origin_id_fkey TO website_path_website_id_fkey;
ALTER TABLE website_path_segment RENAME CONSTRAINT origin_path_segment_origin_path_id_fkey TO website_path_segment_website_path_id_fkey;
ALTER TABLE website_path_segment RENAME CONSTRAINT origin_path_segment_origin_segment_id_fkey TO website_path_segment_website_segment_id_fkey;
ALTER TABLE website_path_view RENAME CONSTRAINT origin_path_view_origin_path_id_fkey TO website_path_view_website_path_id_fkey;
ALTER TABLE translated_segment RENAME CONSTRAINT translated_segment_origin_segment_id_fkey TO translated_segment_website_segment_id_fkey;
ALTER TABLE translated_path RENAME CONSTRAINT translated_path_origin_path_id_fkey TO translated_path_website_path_id_fkey;

-- Rename triggers
ALTER TRIGGER origin_updated_at ON website RENAME TO website_updated_at;
ALTER TRIGGER origin_path_view_updated_at ON website_path_view RENAME TO website_path_view_updated_at;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (run if something goes wrong after migration)
-- ============================================================================
--
-- BEGIN;
--
-- -- Rename triggers back
-- ALTER TRIGGER website_updated_at ON website RENAME TO origin_updated_at;
-- ALTER TRIGGER website_path_view_updated_at ON website_path_view RENAME TO origin_path_view_updated_at;
--
-- -- Rename foreign key constraints back
-- ALTER TABLE host RENAME CONSTRAINT host_website_id_fkey TO host_origin_id_fkey;
-- ALTER TABLE website_segment RENAME CONSTRAINT website_segment_website_id_fkey TO origin_segment_origin_id_fkey;
-- ALTER TABLE website_path RENAME CONSTRAINT website_path_website_id_fkey TO origin_path_origin_id_fkey;
-- ALTER TABLE website_path_segment RENAME CONSTRAINT website_path_segment_website_path_id_fkey TO origin_path_segment_origin_path_id_fkey;
-- ALTER TABLE website_path_segment RENAME CONSTRAINT website_path_segment_website_segment_id_fkey TO origin_path_segment_origin_segment_id_fkey;
-- ALTER TABLE website_path_view RENAME CONSTRAINT website_path_view_website_path_id_fkey TO origin_path_view_origin_path_id_fkey;
-- ALTER TABLE translated_segment RENAME CONSTRAINT translated_segment_website_segment_id_fkey TO translated_segment_origin_segment_id_fkey;
-- ALTER TABLE translated_path RENAME CONSTRAINT translated_path_website_path_id_fkey TO translated_path_origin_path_id_fkey;
--
-- -- Rename indexes back
-- ALTER INDEX website_pkey RENAME TO origin_pkey;
-- ALTER INDEX website_segment_pkey RENAME TO origin_segment_pkey;
-- ALTER INDEX website_path_pkey RENAME TO origin_path_pkey;
-- ALTER INDEX website_path_segment_pkey RENAME TO origin_path_segment_pkey;
-- ALTER INDEX website_path_view_pkey RENAME TO origin_path_view_pkey;
-- ALTER INDEX idx_host_website_id RENAME TO idx_host_origin_id;
-- ALTER INDEX website_segment_website_id_text_hash_key RENAME TO origin_segment_origin_id_text_hash_key;
-- ALTER INDEX website_path_website_id_path_key RENAME TO origin_path_origin_id_path_key;
-- ALTER INDEX idx_website_path_segment_segment RENAME TO idx_origin_path_segment_segment;
-- ALTER INDEX idx_website_path_view_date RENAME TO idx_origin_path_view_date;
-- ALTER INDEX translated_segment_website_segment_id_lang_key RENAME TO translated_segment_origin_segment_id_lang_key;
-- ALTER INDEX translated_path_website_path_id_lang_key RENAME TO translated_path_origin_path_id_lang_key;
--
-- -- Rename sequences back
-- ALTER SEQUENCE website_id_seq RENAME TO origin_id_seq;
-- ALTER SEQUENCE website_segment_id_seq RENAME TO origin_segment_id_seq;
-- ALTER SEQUENCE website_path_id_seq RENAME TO origin_path_id_seq;
--
-- -- Rename foreign key columns back
-- ALTER TABLE host RENAME COLUMN website_id TO origin_id;
-- ALTER TABLE website_segment RENAME COLUMN website_id TO origin_id;
-- ALTER TABLE website_path RENAME COLUMN website_id TO origin_id;
-- ALTER TABLE website_path_segment RENAME COLUMN website_path_id TO origin_path_id;
-- ALTER TABLE website_path_segment RENAME COLUMN website_segment_id TO origin_segment_id;
-- ALTER TABLE website_path_view RENAME COLUMN website_path_id TO origin_path_id;
-- ALTER TABLE translated_segment RENAME COLUMN website_segment_id TO origin_segment_id;
-- ALTER TABLE translated_path RENAME COLUMN website_path_id TO origin_path_id;
--
-- -- Rename tables back
-- ALTER TABLE website_path_view RENAME TO origin_path_view;
-- ALTER TABLE website_path_segment RENAME TO origin_path_segment;
-- ALTER TABLE website_path RENAME TO origin_path;
-- ALTER TABLE website_segment RENAME TO origin_segment;
--
-- -- Rename main table and column back
-- ALTER TABLE website RENAME COLUMN source_lang TO origin_lang;
-- ALTER TABLE website RENAME TO origin;
--
-- COMMIT;
