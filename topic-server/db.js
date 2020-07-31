/* eslint-disable no-process-env */
/* eslint-disable no-undef */
require('dotenv').config();
const {Pool} = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const {DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE, DATABASE_URL} = process.env;
const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;
const pool = new Pool({
  connectionString: isProduction ? DATABASE_URL : connectionString,
  // ssl: isProduction
  // rejectUnauthorized: false
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
