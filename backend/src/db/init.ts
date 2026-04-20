import fs from 'fs';
import path from 'path';
import { pool } from './index';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const createDatabaseIfNotExists = async () => {
    // Connect to default postgres DB first to create our target DB
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres' // default
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`${process.env.DB_NAME} database not found, creating it...`);
            await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log(`created database ${process.env.DB_NAME}`);
        } else {
            console.log(`${process.env.DB_NAME} database already exists.`);
        }
    } catch (error) {
        console.error('Error creating database:', error);
    } finally {
        await client.end();
    }
};

const initializeDatabase = async () => {
    // If using a cloud provider (DATABASE_URL is set), the database itself is typically pre-created.
    // If running locally with raw host/user/pass, automatically create it.
    if (!process.env.DATABASE_URL) {
        await createDatabaseIfNotExists();
    }

    console.log('Connecting to', process.env.DB_NAME || 'Cloud Database');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

    try {
        await pool.query(schemaSql);
        console.log('Schema initialized successfully.');
    } catch (err) {
        console.error('Error initializing schema:', err);
    } finally {
        await pool.end();
    }
};

initializeDatabase();
