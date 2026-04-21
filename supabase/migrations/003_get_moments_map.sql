-- ===========================================
-- Aura: Optimized Map Retrieval RPC (v2)
-- Run this in the Supabase SQL Editor
-- This uses 'lat' and 'lng' to match the frontend expectations.
-- ===========================================

CREATE OR REPLACE FUNCTION get_moments_map()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  moment_type text,
  lat double precision,
  lng double precision,
  expires_at timestamptz,
  created_at timestamptz,
  participant_count bigint,
  creator_id uuid,
  creator jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.description,
    m.moment_type,
    ST_Y(m.location::geometry) as lat,
    ST_X(m.location::geometry) as lng,
    m.expires_at,
    m.created_at,
    (SELECT count(*) FROM public.participants p WHERE p.moment_id = m.id AND p.status = 'joined') as participant_count,
    m.creator_id,
    jsonb_build_object(
      'id', prof.id,
      'username', prof.username,
      'avatar_url', prof.avatar_url
    ) as creator
  FROM public.moments m
  LEFT JOIN public.profiles prof ON m.creator_id = prof.id
  WHERE m.expires_at > now()
  ORDER BY m.created_at DESC;
END;
$$;
