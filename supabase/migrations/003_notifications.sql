-- ============================================================
-- Nura — Migration 003: proactive notifications bookkeeping
-- ============================================================

-- IANA timezone reported by the app (quiet-hours computation in the
-- proactive-checkin job). NULL → job assumes UTC.
-- Timestamp of the last proactive check-in sent to this user.

ALTER TABLE profiles
  ADD COLUMN timezone TEXT,
  ADD COLUMN last_proactive_at TIMESTAMPTZ;
