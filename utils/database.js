import knex from 'knex';

const database = knex({
  client: 'pg',
  connection: {
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.psvilyccxeeibbmdmdmd',
    password: 'uX@JKPf/78$W!ic',
    database: 'postgres',
    pool: { min: 0, max: 15 },
  }
});

export default database;