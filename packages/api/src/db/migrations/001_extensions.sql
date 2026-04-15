-- Enable pgcrypto for gen_random_uuid() on PG < 13.
-- On PG 13+ this is a no-op (the function is built-in), but keeps the
-- migration safe across versions.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
