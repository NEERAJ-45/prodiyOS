import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local
const envPath = join(__dirname, '..', '.env.local');
const env = {};
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
}

// Find URIs
const uris = [];
if (env.MONGODB_URI_HOME) uris.push({ name: 'MONGODB_URI_HOME', uri: env.MONGODB_URI_HOME });
if (env.MONGODB_URI_OFFICE) uris.push({ name: 'MONGODB_URI_OFFICE', uri: env.MONGODB_URI_OFFICE });
if (env.MONGODB_URI) uris.push({ name: 'MONGODB_URI', uri: env.MONGODB_URI });
if (process.env.MONGODB_URI) uris.push({ name: 'process.env.MONGODB_URI', uri: process.env.MONGODB_URI });

if (uris.length === 0) {
  console.error('No MongoDB URI found in env.');
  process.exit(1);
}

// Remove duplicates
const uniqueUris = [];
const seen = new Set();
for (const u of uris) {
  if (!seen.has(u.uri)) {
    seen.add(u.uri);
    uniqueUris.push(u);
  }
}

async function run() {
  for (const item of uniqueUris) {
    console.log(`Connecting to ${item.name}...`);
    try {
      const conn = await mongoose.createConnection(item.uri).asPromise();
      console.log(`Connected successfully. Clearing 'activities' collection...`);
      const collections = await conn.db.listCollections({ name: 'activities' }).toArray();
      if (collections.length > 0) {
        const deleted = await conn.db.collection('activities').deleteMany({});
        console.log(`Deleted ${deleted.deletedCount} documents from 'activities' collection.`);
      } else {
        console.log(`Collection 'activities' does not exist.`);
      }
      await conn.close();
    } catch (err) {
      console.error(`Failed to clear activities for ${item.name}:`, err.message);
    }
  }
  process.exit(0);
}

run();
