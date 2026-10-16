import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const INITIAL_DATA_FILE = path.join(__dirname, '../src/data/initialData.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = {};

// Load database from file or initialize from initialData.json
export function initDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      console.log('Loaded database from', DB_FILE);
      return;
    } catch (err) {
      console.error('Error loading db.json, falling back to initialData:', err);
    }
  }

  // Fallback to initialData.json
  if (fs.existsSync(INITIAL_DATA_FILE)) {
    const raw = fs.readFileSync(INITIAL_DATA_FILE, 'utf-8');
    db = JSON.parse(raw);
    saveDB();
    console.log('Initialized new database from initialData.json');
  } else {
    db = {};
  }
}

// Persist database to disk
export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

// Get all collections or a single collection
export function getCollection(name) {
  if (!db[name]) {
    db[name] = [];
  }
  return db[name];
}

export function getAll(collectionName) {
  return getCollection(collectionName);
}

export function getById(collectionName, id) {
  const collection = getCollection(collectionName);
  return collection.find((item) => item.id === id || String(item.id) === String(id));
}

export function insert(collectionName, item) {
  const collection = getCollection(collectionName);
  const newItem = {
    id: item.id || 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    created_date: item.created_date || new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...item
  };
  collection.unshift(newItem);
  saveDB();
  return newItem;
}

export function update(collectionName, id, updates) {
  const collection = getCollection(collectionName);
  const index = collection.findIndex((item) => item.id === id || String(item.id) === String(id));
  if (index === -1) return null;

  collection[index] = {
    ...collection[index],
    ...updates,
    updated_date: new Date().toISOString()
  };
  saveDB();
  return collection[index];
}

export function remove(collectionName, id) {
  const collection = getCollection(collectionName);
  const index = collection.findIndex((item) => item.id === id || String(item.id) === String(id));
  if (index === -1) return false;

  collection.splice(index, 1);
  saveDB();
  return true;
}

export function getFullDB() {
  return db;
}

