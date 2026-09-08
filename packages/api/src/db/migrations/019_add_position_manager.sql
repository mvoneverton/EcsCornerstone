-- Assigns a manager (role='manager') to a position, for the Manager View.
-- Nullable — most positions have no manager assigned. One manager can be
-- assigned to multiple positions.
ALTER TABLE positions
  ADD COLUMN manager_id uuid REFERENCES users(id);

CREATE INDEX positions_manager_id_idx ON positions(manager_id) WHERE manager_id IS NOT NULL;
