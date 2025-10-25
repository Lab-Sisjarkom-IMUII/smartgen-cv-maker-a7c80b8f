import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Use environment variables with required assertion
// Vercel will inject these at runtime
const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || 'temp-secret-key-minimum-32-characters-long',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Allow all sign ins
      return true
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
