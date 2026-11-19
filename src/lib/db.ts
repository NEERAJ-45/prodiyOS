import mongoose from 'mongoose';

type ConnectionEntry = {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
  lastUsed: number;
};

const globalWithMongoose = global as typeof globalThis & {
  mongooseCache?: Map<string, ConnectionEntry>;
};

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = new Map();
}
const connectionsCache = globalWithMongoose.mongooseCache;

const MAX_CACHED_CONNECTIONS = 32;

export function resolveMongoUri(mode?: string): string | null {
  if (mode === 'OFFICE') {
    return process.env.MONGODB_URI_OFFICE || process.env.MONGODB_URI || null;
  }
  return process.env.MONGODB_URI_HOME || process.env.MONGODB_URI || null;
}

function isDefaultUri(uri: string): boolean {
  return [process.env.MONGODB_URI, process.env.MONGODB_URI_HOME, process.env.MONGODB_URI_OFFICE].some(
    (value) => value === uri
  );
}

function evictIdleConnections() {
  if (connectionsCache.size <= MAX_CACHED_CONNECTIONS) return;

  const candidates = Array.from(connectionsCache.entries())
    .filter(([uri]) => !isDefaultUri(uri))
    .sort((a, b) => a[1].lastUsed - b[1].lastUsed);

  for (const [uri, entry] of candidates) {
    if (connectionsCache.size <= MAX_CACHED_CONNECTIONS) break;
    connectionsCache.delete(uri);
    if (entry.conn) void entry.conn.close().catch(() => {});
  }
}

export async function connectToDatabase(customUri?: string) {
  let uri: string | undefined = customUri;

  if (!uri) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const mode = cookieStore.get('mode')?.value;
      uri = resolveMongoUri(mode) || undefined;
    } catch {
      uri = process.env.MONGODB_URI || undefined;
    }
  }

  if (!uri) {
    return null;
  }

  const cached = connectionsCache.get(uri);
  if (cached?.conn) {
    cached.lastUsed = Date.now();
    return cached.conn;
  }

  let entry = cached;
  if (!entry) {
    entry = { conn: null, promise: null, lastUsed: Date.now() };
    connectionsCache.set(uri, entry);
  }

  if (!entry.promise) {
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: customUri ? 5 : 20,
    };

    if (customUri) {
      entry.promise = mongoose.createConnection(uri, opts).asPromise();
    } else {
      entry.promise = mongoose.connect(uri, opts).then(() => mongoose.connection);
    }
  }

  try {
    entry.conn = await entry.promise;
    entry.lastUsed = Date.now();
    evictIdleConnections();
  } catch (e) {
    entry.promise = null;
    connectionsCache.delete(uri);
    throw e;
  }

  return entry.conn;
}
