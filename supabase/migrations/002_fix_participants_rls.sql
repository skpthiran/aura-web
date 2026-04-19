-- Allow moment creators to see participants of their moments
-- This is critical for the Signals activity feed to show joins reliably
CREATE POLICY "Creators can view their moment participants"
ON public.participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.moments
    WHERE moments.id = participants.moment_id
    AND moments.creator_id = auth.uid()
  )
);
