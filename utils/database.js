import postgres from 'postgres';

const sql = postgres({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '6543', 10),
  database: process.env.PG_DATABASE,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  ssl: 'require',
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idle_timeout: 20,
  connect_timeout: 10
});

export default sql;
