DROP FUNCTION IF EXISTS nearby_moments(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION nearby_moments(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  moment_type text,
  tags text[],
  image_url text,
  lat double precision,
  lng double precision,
  distance_meters double precision,
  participant_count bigint,
  capacity_limit int,
  created_at timestamptz,
  expires_at timestamptz,
  is_private boolean,
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
    m.tags,
    m.image_url,
    ST_Y(m.location::geometry) as lat,
    ST_X(m.location::geometry) as lng,
    ST_Distance(
      m.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) as distance_meters,
    (SELECT count(*) FROM participants p WHERE p.moment_id = m.id AND p.status = 'joined') as participant_count,
    m.capacity_limit,
    m.created_at,
    m.expires_at,
    m.is_private,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'avatar_url', u.avatar_url
    ) as creator
  FROM moments m
  JOIN profiles u ON m.creator_id = u.id
  WHERE 
    m.expires_at > now()
    AND (
      radius_km <= 0 
      OR 
      ST_DWithin(
        m.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_km * 1000
      )
    )
  ORDER BY distance_meters ASC;
END;
$$;
