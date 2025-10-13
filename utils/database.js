import knex from 'knex';

const database = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'postgres',
    ssl: process.env.PG_HOST?.includes('supabase.com') ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: parseInt(process.env.PG_POOL_MIN || '0', 10),
    max: parseInt(process.env.PG_POOL_MAX || '15', 10)
  }
});

export default database;