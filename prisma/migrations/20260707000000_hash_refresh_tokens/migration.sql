-- Rename the refresh token storage column to reflect that only HMAC hashes are stored.
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";

ALTER INDEX "refresh_tokens_token_key" RENAME TO "refresh_tokens_token_hash_key";

DROP INDEX "refresh_tokens_user_id_idx";

CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");
