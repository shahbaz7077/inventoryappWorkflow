import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

function getDbPath() {
  if (process.versions.electron) {
    // Running inside Electron — use a writable per-user folder
    const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Factory Inventory');
    return path.join(userDataPath, 'inventory.db');
  }
  // Normal dev mode (npm run dev)
  return path.join(process.cwd(), 'inventory.db');
}

const db = new Database(getDbPath());

// SQLite settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  unit TEXT DEFAULT 'pcs',
  quantity REAL DEFAULT 0,
  price REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL,
    amount REAL NOT NULL,
    sold_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS demands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    requested_by TEXT NOT NULL,
    department TEXT,
    collected_by TEXT,
    quantity_requested REAL NOT NULL,
    quantity_fulfilled REAL DEFAULT 0,
    status TEXT DEFAULT 'pending'
      CHECK(status IN ('pending', 'partial', 'fulfilled')),
    note TEXT,
    requested_at TEXT DEFAULT (datetime('now')),
    fulfilled_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sales_product
  ON sales(product_id);

  CREATE INDEX IF NOT EXISTS idx_demands_product
  ON demands(product_id);
`);

export default db;