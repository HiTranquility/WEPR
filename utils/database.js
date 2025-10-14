import 'dotenv/config';
import knex from 'knex';

const database = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PG_PORT || process.env.PGPORT || '5432'),
    database: process.env.PG_DATABASE || process.env.PGDATABASE,
    user: process.env.PG_USER || process.env.PGUSER,
    password: process.env.PG_PASSWORD || process.env.PGPASSWORD
  },
  pool: {
    min: parseInt(process.env.PG_POOL_MIN || process.env.PGPOOLMIN || '2'),
    max: parseInt(process.env.PG_POOL_MAX || process.env.PGPOOLMAX || '10')
  }
});

export default database;