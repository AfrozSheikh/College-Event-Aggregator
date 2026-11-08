const { Pool, types } = require('pg');

// Neon Postgres (pooled endpoint). SSL is verified and SCRAM channel binding is enforced.
const DATABASE_URL =
    'postgresql://neondb_owner:npg_pB9jYXakOc8z@ep-divine-bird-bencmyvx-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=verify-full';

// COUNT(*) and other BIGINT results come back as strings by default – return numbers instead.
// (NUMERIC such as registration_fees stays a string, same as it was with MySQL.)
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));

const pool = new Pool({
    connectionString: DATABASE_URL,
    enableChannelBinding: true,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
});

// Neon closes idle connections; without this handler an idle-client error would crash the server.
pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err.message);
});

module.exports = pool;
