import 'dotenv/config';
import knex from 'knex';

const env = process.env;

const host = env.PG_HOST || env.PGHOST;
const port = parseInt(env.PG_PORT || env.PGPORT || '6543', 10);
const databaseName = env.PG_DATABASE || env.PGDATABASE;
const user = env.PG_USER || env.PGUSER;
const password = env.PG_PASSWORD || env.PGPASSWORD;
const dbUrl = env.DATABASE_URL || env.PG_URL;

const sslExplicit = (env.PG_SSL || env.PGSSL || '').toLowerCase() === 'true';
const sslReject = (env.PG_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'true';
const hostLooksSupabase = typeof host === 'string' && /supabase\.co|supabase\.com/.test(host);
const urlRequiresSsl = typeof dbUrl === 'string' && /sslmode=require/i.test(dbUrl);
const enableSsl = sslExplicit || hostLooksSupabase || urlRequiresSsl;

const connection = dbUrl
  ? {
      connectionString: dbUrl,
      ssl: enableSsl ? { rejectUnauthorized: sslReject } : false
    }
  : {
      host,
      port,
      database: databaseName,
      user,
      password,
      ssl: enableSsl ? { rejectUnauthorized: sslReject } : false
    };

const database = knex({
  client: 'pg',
  connection,
  pool: {
    min: parseInt(env.PG_POOL_MIN || '0', 10),
    max: parseInt(env.PG_POOL_MAX || '10', 10)
  },
  debug: (env.KNEX_DEBUG || '').toLowerCase() === 'true'
});

export default database;