/*
  # Add Foreign Key Indexes for Chat and Notification Tables

  ## Changes
  1. Add indexes for all foreign key columns in chat and notification tables

  ## Foreign Key Indexes Added
  - chat_messages.room_id
  - chat_messages.user_id
  - chat_room_members.user_id
  - chat_rooms.created_by
  - notifications.user_id
  - uploaded_files.room_id
  - uploaded_files.uploaded_by

  ## Notes
  - These indexes improve JOIN performance and foreign key constraint checking
  - Essential for query performance as these tables grow
  - Room_id and user_id are frequently used in WHERE and JOIN clauses
*/

-- ============================================================================
-- Add indexes for chat_messages foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id 
  ON public.chat_messages(room_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
  ON public.chat_messages(user_id);

-- ============================================================================
-- Add indexes for chat_room_members foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id 
  ON public.chat_room_members(user_id);

-- ============================================================================
-- Add indexes for chat_rooms foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by 
  ON public.chat_rooms(created_by);

-- ============================================================================
-- Add indexes for notifications foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications(user_id);

-- ============================================================================
-- Add indexes for uploaded_files foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_uploaded_files_room_id 
  ON public.uploaded_files(room_id);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by 
  ON public.uploaded_files(uploaded_by);
