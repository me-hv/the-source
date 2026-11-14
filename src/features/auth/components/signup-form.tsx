"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { signupAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export function SignupForm() {
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignupInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const result = await signupAction(values);
        if (result && !result.success) {
          setServerError(result.error || "Registration failed");
          toast.error(result.error || "Registration failed");
        } else if (result && result.requiresEmailVerification) {
          setIsVerificationSent(true);
          toast.success("Confirmation link sent to your email.");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") {
          return;
        }
        setServerError("An unexpected error occurred. Please try again.");
      }
    });
  };

  if (isVerificationSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium uppercase tracking-wider text-foreground">
            Verification link dispatched
          </h3>
          <p className="text-xs text-muted-foreground">
            We sent an activation link to your inbox. Verify your email to activate your private Source workspace.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="outline" className="w-full text-xs uppercase tracking-wider">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Creative Identity / Artist Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="e.g. Miles, Maya, or Studio Name"
          disabled={isPending}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-[11px] text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          disabled={isPending}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-[11px] text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters with letter & number"
          disabled={isPending}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-[11px] text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="py-1">
        <p className="text-[11px] leading-relaxed text-muted-foreground/80">
          By creating a workspace, you establish an encrypted, private studio. Your thoughts, lyrics, and inspirations remain strictly yours.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full tracking-widest text-xs font-semibold uppercase"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Initializing Workspace...
          </>
        ) : (
          "Create Private Workspace"
        )}
      </Button>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        Already have a Source?{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Enter Studio
        </Link>
      </div>
    </form>
  );
}
