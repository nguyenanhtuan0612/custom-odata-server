import * as pg from "pg";
const dotenv = require('dotenv');
dotenv.config();
let db: pg.Client | null = null;

function promisify(client) {
  return new Proxy(client, {
    get(target, name) {
      if (name !== 'query')
        return target[name];

      return function (...args) {
        return new Promise((resolve, reject) => {
          target.query(...args, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });
      }
    }
  });
}

export default async function (): Promise<pg.Client> {

  if (db)
    return db;

    const pool = new pg.Pool({
      user:process.env.DB_USERNAME,
      port:parseInt(process.env.DB_PORT),
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host:process.env.DB_HOST
    });
  return new Promise<pg.Client>((resolve: Function, reject: Function) => {
    pool.connect((err, client) => {
      if (err) return reject(err);
      db = promisify(client);
      resolve(db);
    });
  });
}