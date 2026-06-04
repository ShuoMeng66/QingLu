import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'qinglu.db')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    last_sent_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );
`)

export interface UserRow {
  id: string
  email: string
  password_hash: string
  display_name: string | null
  created_at: number
  updated_at: number
}

export interface UserDataRow {
  user_id: string
  data_json: string
  updated_at: number
}

export interface EmailVerificationRow {
  email: string
  code_hash: string
  expires_at: number
  last_sent_at: number
  attempts: number
}
