-- NdakoCare Community Wallet V2
-- Align the membership role default with the role constraint.

ALTER TABLE public.community_members
ALTER COLUMN role SET DEFAULT 'member';
