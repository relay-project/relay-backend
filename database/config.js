const dotenv = require('dotenv');
dotenv.config();

const configuration = {
  database: process.env.DATABASE_NAME,
  dialect: 'postgres',
  host: process.env.DATABASE_HOST,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
};

module.exports = {
  development: configuration,
  production: configuration,
};
