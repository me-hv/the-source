"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { signupAction, enterLocalStudioAction } from "@/features/auth/actions";
import { isLocalDataMode } from "@/lib/config/data-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Zap } from "lucide-react";

export function SignupForm() {
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = React.useState(false);
  const isLocal = isLocalDataMode();

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

  const handleEnterLocal = () => {
    setServerError(null);
    startTransition(async () => {
      try {
        await enterLocalStudioAction();
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") {
          return;
        }
        setServerError("Failed to enter local studio.");
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
      {isLocal && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Local Development Mode</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Running without Supabase. You can initialize your local studio immediately with zero remote services.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full text-xs font-medium border border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
            onClick={handleEnterLocal}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
            ) : (
              <Zap className="h-3 w-3 mr-1.5 text-amber-400" />
            )}
            Enter Studio Directly (Local Mode)
          </Button>
        </div>
      )}

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
