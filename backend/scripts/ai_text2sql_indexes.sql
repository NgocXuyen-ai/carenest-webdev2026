-- Manual index script for text-to-SQL and backend query workloads.
-- Safe-by-default scope:
-- - CREATE INDEX IF NOT EXISTS only
-- - No DROP / ALTER / REINDEX
-- - Do not execute automatically in CI/CD or application startup
-- - Review on non-production first, then run manually on Neon when ready

BEGIN;

-- Core tenant and relationship paths
CREATE INDEX IF NOT EXISTS idx_health_profile_user_id
    ON public.health_profile (user_id);

CREATE INDEX IF NOT EXISTS idx_family_owner
    ON public.family (owner);

CREATE INDEX IF NOT EXISTS idx_family_relationship_profile_family
    ON public.family_relationship (profile_id, family_id);

CREATE INDEX IF NOT EXISTS idx_family_relationship_family_profile
    ON public.family_relationship (family_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_family_medicine_cabinet_family_id
    ON public.family_medicine_cabinet (family_id);

-- Medicine and schedule lookups
CREATE INDEX IF NOT EXISTS idx_details_medicine_cabinet_expiry
    ON public.details_medicine (cabinet_id, expiry_date);

CREATE INDEX IF NOT EXISTS idx_medicine_schedule_profile_dates
    ON public.medicine_schedule (profile_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_medicine_dose_status_schedule_date_session
    ON public.medicine_dose_status (schedule_id, dose_date, session);

CREATE INDEX IF NOT EXISTS idx_medicine_dose_status_date_taken
    ON public.medicine_dose_status (dose_date, is_taken);

-- Appointment, vaccine, growth
CREATE INDEX IF NOT EXISTS idx_appointment_profile_date
    ON public.appointment (profile_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointment_date_status
    ON public.appointment (appointment_date, status);

CREATE INDEX IF NOT EXISTS idx_vaccination_profile_planned_status
    ON public.vaccination (profile_id, planned_date, status);

CREATE INDEX IF NOT EXISTS idx_vaccination_profile_given
    ON public.vaccination (profile_id, date_given);

CREATE INDEX IF NOT EXISTS idx_growth_log_profile_record_date
    ON public.growth_log (profile_id, record_date);

-- Notifications and chat tables
CREATE INDEX IF NOT EXISTS idx_notifications_profile_read_time
    ON public.notifications (profile_id, is_read, scheduled_time DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_user_updated
    ON public.ai_conversation (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_detail_conversation_sent
    ON public.ai_chat_detail (conversation_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_request_log_created_feature
    ON public.ai_request_log (created_at DESC, feature_type);

COMMIT;
