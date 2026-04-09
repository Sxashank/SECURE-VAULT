import { pool } from './src/db/index'; pool.query('DELETE FROM users WHERE email=\'sensiblefight@gmail.com\'').then(() = console.log(\" User "deleted\); process.exit(0); });  
