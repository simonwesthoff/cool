-- User roles: Teams are no longer created automatically. Remove the Teams that
-- were created automatically and have no athletes; their users choose their
-- role again. Teams with athletes stay.
DELETE FROM "team"
WHERE NOT EXISTS (
  SELECT 1 FROM "athlete" WHERE "athlete"."team_id" = "team"."id"
);
