// app/lib/db/database.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { openDatabaseSync } from "expo-sqlite";
export type ItemType = {
  id?: number;
  name: string;
  quantity: number;
  alias?: string | null;
  mp: number;
  sp: number;
  unit: string;
  target?: number | null;
  created_at?: string;
  updated_at?: string;
  synced?: number; // 0 or 1
};

export const addItemToLocalDB = async (item: ItemType) => {
  try {
    const items = await getItemsFromLocalDB();
    const updatedItems = [...items, item];
    await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error saving item to local DB:', error);
  }
};

export const getItemsFromLocalDB = async (): Promise<ItemType[]> => {
  try {
    const items = await AsyncStorage.getItem('items');
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('Error fetching items from local DB:', error);
    return [];
  }
};

// ------------------- DATABASE CONNECTION -------------------
export const db = openDatabaseSync("app.db");

// ------------------- TYPES -------------------
export type Item = {
  id: number;
  name: string;
  quantity: number;
  alias?: string;
  mp: number;
  sp: number;
  unit?: string;
  target?: number;
  created_at?: string;
  updated_at?: string;
  synced: number;
};

export type Sale = {
  id: number;
  name: string;
  mp: number;
  sp: number;
  qty: number;
  subtotal: number;
  created_at?: string;
  synced: number;
};

// ------------------- INITIAL SETUP -------------------------
export async function initDB() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      quantity REAL,
      created_at TEXT,
      alias TEXT,
      mp REAL,
      sp REAL,
      unit TEXT,
      updated_at TEXT,
      target REAL,
      synced INTEGER DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      mp REAL,
      sp REAL,
      qty REAL,
      subtotal REAL,
      created_at TEXT,
      synced INTEGER DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT,
      username TEXT,
      email TEXT,
      phone TEXT,
      password TEXT,
      role TEXT,
      synced INTEGER DEFAULT 0
    );
  `);

  console.log("📦 Local SQLite DB initialized");
}

// ------------------- OFFLINE READ FUNCTIONS ---------------------

export async function getItems(): Promise<Item[]> {
  return await db.getAllAsync("SELECT * FROM items ORDER BY name ASC");
}

export async function searchItems(text: string): Promise<Item[]> {
  return await db.getAllAsync(
    "SELECT * FROM items WHERE name LIKE ? OR alias LIKE ? ORDER BY name ASC",
    [`%${text}%`, `%${text}%`]
  );
}

export async function getItemById(id: number): Promise<Item> {
  const row = await db.getFirstAsync(
    "SELECT * FROM items WHERE id = ? LIMIT 1",
    [id]
  );
  return row as Item;
}

// ------------------- WRITE FUNCTIONS ---------------------

export async function saveItem(item: {
  name: string;
  quantity: number;
  alias?: string;
  mp: number;
  sp: number;
  unit?: string;
  target?: number;
}) {
  await db.runAsync(
    `INSERT INTO items 
    (name, quantity, alias, mp, sp, unit, target, created_at, updated_at, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0)`,
    [
      item.name,
      item.quantity,
      item.alias || "",
      item.mp,
      item.sp,
      item.unit || "",
      item.target ?? 0,
    ]
  );
}

export async function updateItem(item: {
  id: number;
  name: string;
  quantity: number;
  alias?: string;
  mp: number;
  sp: number;
  unit?: string;
  target?: number;
}) {
  await db.runAsync(
    `UPDATE items SET 
      name = ?, quantity = ?, alias = ?, mp = ?, sp = ?, unit = ?, target = ?,
      updated_at = datetime('now'), synced = 0
    WHERE id = ?`,
    [
      item.name,
      item.quantity,
      item.alias || "",
      item.mp,
      item.sp,
      item.unit || "",
      item.target ?? 0,
      item.id,
    ]
  );
}

export async function updateItemQty(id: number, qtySold: number) {
  await db.runAsync(
    `UPDATE items SET quantity = quantity - ?, synced = 0 WHERE id = ?`,
    [qtySold, id]
  );
}

export async function addSale(
  name: string,
  mp: number,
  sp: number,
  qty: number,
  subtotal: number
) {
  await db.runAsync(
    `INSERT INTO sales (name, mp, sp, qty, subtotal, created_at, synced)
     VALUES (?, ?, ?, ?, ?, datetime('now'), 0)`,
    [name, mp, sp, qty, subtotal]
  );
}

// ------------------- SYNC HELPERS -------------------------

export async function findUnsyncedItems(): Promise<Item[]> {
  return await db.getAllAsync("SELECT * FROM items WHERE synced = 0");
}

export async function findUnsyncedSales(): Promise<Sale[]> {
  return await db.getAllAsync("SELECT * FROM sales WHERE synced = 0");
}

export async function markItemSynced(id: number) {
  return await db.runAsync("UPDATE items SET synced = 1 WHERE id = ?", [id]);
}

export async function markSaleSynced(id: number) {
  return await db.runAsync("UPDATE sales SET synced = 1 WHERE id = ?", [id]);
}
// ------------------- WORKERS OFFLINE -------------------------

export type Worker = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  synced: number;
};

export async function addWorkerOffline(worker: {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}) {
  await db.runAsync(
    `INSERT INTO users (id, full_name, username, email, phone, password, role, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      worker.id,
      worker.full_name,
      worker.username,
      worker.email,
      worker.phone,
      worker.password,
      worker.role,
    ]
  );
}

export async function findUnsyncedWorkers() {
  return await db.getAllAsync("SELECT * FROM users WHERE synced = 0");
}

export async function markWorkerSynced(id: string) {
  return await db.runAsync("UPDATE users SET synced = 1 WHERE id = ?", [id]);
}
export async function deleteItem(id: number) {
  await db.runAsync("DELETE FROM items WHERE id = ?", [id]);
}
