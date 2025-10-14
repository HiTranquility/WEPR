import 'dotenv/config';
import knex from 'knex';

const env = process.env;

const database = knex({
  client: 'pg',
  connection: {
    host: env.PG_HOST || env.PGHOST,
    port: parseInt(env.PG_PORT || env.PGPORT || '5432', 10),
    database: env.PG_DATABASE || env.PGDATABASE,
    user: env.PG_USER || env.PGUSER,
    password: env.PG_PASSWORD || env.PGPASSWORD
  },
  pool: {
    min: parseInt(env.PG_POOL_MIN || '0', 10),
    max: parseInt(env.PG_POOL_MAX || '10', 10)
  }
});

export default database;