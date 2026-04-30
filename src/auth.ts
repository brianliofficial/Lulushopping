import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/admin-allowlist";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async signIn({ profile, account }) {
      if (account?.provider !== "google") return false;
      if (!isAdminEmail(profile?.email)) return false;
      return true;
    },
  },
});
