import mongoose from 'mongoose';

let globalWithMongoose = global as typeof globalThis & {
  mongooseCache?: Record<string, { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null }>;
};

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = {};
}
const connectionsCache = globalWithMongoose.mongooseCache;

export function resolveMongoUri(mode?: string): string | null {
  if (mode === 'OFFICE') {
    return process.env.MONGODB_URI_OFFICE || process.env.MONGODB_URI || null;
  }
  return process.env.MONGODB_URI_HOME || process.env.MONGODB_URI || null;
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

  if (!connectionsCache[uri]) {
    connectionsCache[uri] = { conn: null, promise: null };
  }

  const cached = connectionsCache[uri];

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
    };

    if (customUri) {
      cached.promise = mongoose.createConnection(uri, opts).asPromise();
    } else {
      cached.promise = mongoose.connect(uri, opts).then(() => mongoose.connection);
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
