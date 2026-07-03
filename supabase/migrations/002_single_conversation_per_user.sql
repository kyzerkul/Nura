-- ============================================================
-- Nura — Enforce single conversation per user
-- Product decision (2026-07-03): one continuous conversation
-- thread per user. The unique constraint makes client-side
-- get-or-create atomic: concurrent inserts resolve to one row.
-- ============================================================

-- Safety: collapse any existing duplicates before adding the
-- constraint (keeps each user's most recent conversation).
DELETE FROM conversations c
USING conversations newer
WHERE c.user_id = newer.user_id
  AND c.created_at < newer.created_at;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_user_id_unique UNIQUE (user_id);
