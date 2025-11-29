// Auto-migrate database on startup
import { prisma } from './prisma'

export async function migrate() {
  try {
    console.log('🔄 Running database migrations...')
    
    // Create tables if not exist (using raw SQL)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CV" (
        "id" TEXT PRIMARY KEY,
        "userEmail" TEXT NOT NULL,
        "name" TEXT DEFAULT '',
        "personalInfo" JSONB,
        "experiences" JSONB,
        "education" JSONB,
        "skills" JSONB,
        "languages" JSONB,
        "template" TEXT DEFAULT 'modern',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "CVHistory" (
        "id" TEXT PRIMARY KEY,
        "cvId" TEXT NOT NULL,
        "userEmail" TEXT NOT NULL,
        "data" JSONB NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT,
        "email" TEXT UNIQUE,
        "emailVerified" TIMESTAMP,
        "image" TEXT
      );

      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        UNIQUE("provider", "providerAccountId")
      );

      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        PRIMARY KEY ("identifier", "token")
      );
    `)
    
    console.log('✅ Database migrations completed')
  } catch (error) {
    console.error('❌ Migration error:', error)
  }
}
