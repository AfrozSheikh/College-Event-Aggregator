/*
 * Creates (or updates) all tables in the Neon Postgres database from schema.sql.
 *
 * Usage (from the backend folder):  npm run db:init
 *
 * Safe to run more than once: tables/indexes use IF NOT EXISTS and the default admin
 * is only inserted if missing. Existing data is never dropped.
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

(async () => {
    try {
        const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

        // Indian time for CURRENT_DATE / NOW() comparisons (applies to new connections)
        const { rows } = await pool.query('SELECT current_database() AS db');
        await pool.query(`ALTER DATABASE "${rows[0].db}" SET timezone TO 'Asia/Kolkata'`);

        await pool.query(schema);

        const { rows: tables } = await pool.query(
            `SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' ORDER BY table_name`
        );
        console.log('✅ Schema applied. Tables:', tables.map((t) => t.table_name).join(', '));
    } catch (error) {
        console.error('❌ Schema setup failed:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
