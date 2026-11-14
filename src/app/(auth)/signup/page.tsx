import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Create Workspace — THE SOURCE",
  description: "Create your private creative knowledge universe.",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-base font-medium tracking-tight text-foreground">
          Initialize Workspace
        </h1>
        <p className="text-xs text-muted-foreground">
          Establish your private creative vault
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
