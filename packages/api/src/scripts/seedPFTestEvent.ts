/**
 * Seed a test People First event + invitation for manual assessment testing.
 * Safe to run multiple times — deletes any prior run's test data first.
 *
 * Run: npm run seed:pf-test --workspace=packages/api
 */
import 'dotenv/config';
import pool from '../db/client';

const TEST_TOKEN = 'test-token-123456';

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows: adminRows } = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE role = 'super_admin' ORDER BY created_at ASC LIMIT 1`
    );
    const facilitatorId = adminRows[0]?.id;
    if (!facilitatorId) {
      throw new Error('No super_admin user found — create one before seeding.');
    }

    await client.query('BEGIN');

    // Clear out a prior run's test data so this script is re-runnable.
    await client.query(`DELETE FROM pf_invitations WHERE token = $1`, [TEST_TOKEN]);
    await client.query(
      `DELETE FROM pf_events WHERE name = 'Test Event' AND event_type = 'couples_night'`
    );

    const { rows: eventRows } = await client.query<{ id: string }>(
      `INSERT INTO pf_events (name, event_type, facilitator_id, status, is_free)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['Test Event', 'couples_night', facilitatorId, 'active', true]
    );
    const eventId = eventRows[0].id;

    await client.query(
      `INSERT INTO pf_invitations (event_id, email, first_name, last_name, token, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [eventId, 'test@test.com', 'Test', 'User', TEST_TOKEN, 'pending']
    );

    await client.query('COMMIT');

    console.log('[seed] ✓ pf_events:', eventId);
    console.log('[seed] ✓ pf_invitations: token =', TEST_TOKEN);
    console.log('Assessment URL:', process.env.VITE_PF_URL + '/assess/' + TEST_TOKEN);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
