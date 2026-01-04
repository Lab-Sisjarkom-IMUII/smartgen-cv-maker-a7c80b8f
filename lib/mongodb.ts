// MongoDB completely disabled for static deployment
// This prevents any MongoDB connection attempts during build

console.warn('MongoDB disabled - aplikasi berjalan tanpa database')

// Always export null to prevent connection attempts
export default Promise.resolve(null)

// Legacy code commented out to prevent build errors
/*
import { MongoClient } from 'mongodb'

// Jika tidak ada DATABASE_URL, return null instead of throwing error
// Ini memungkinkan aplikasi berjalan tanpa database untuk deployment
if (!process.env.DATABASE_URL) {
  console.warn('MongoDB not configured - aplikasi akan berjalan tanpa database')
  // Export null client for static deployment
  export default Promise.resolve(null)
} else {
  const uri = process.env.DATABASE_URL
  const options = {}

  let client: MongoClient
  let clientPromise: Promise<MongoClient>

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  // Export a module-scoped MongoClient promise. By doing this in a
  // separate module, the client can be shared across functions.
  export default clientPromise
}
*/
