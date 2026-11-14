import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login — THE SOURCE",
  description: "Sign in to your private creative knowledge workspace.",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-base font-medium tracking-tight text-foreground">
          Enter Your Studio
        </h1>
        <p className="text-xs text-muted-foreground">
          Access your notes, lyrics, recordings, and archives
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
