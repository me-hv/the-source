"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { loginAction, enterLocalStudioAction } from "@/features/auth/actions";
import { isLocalDataMode } from "@/lib/config/data-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

export function LoginForm() {
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const isLocal = isLocalDataMode();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const result = await loginAction(values);
        if (result && !result.success) {
          setServerError(result.error || "Authentication failed");
          toast.error(result.error || "Authentication failed");
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isLocal && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Local Development Mode</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Running without Supabase. You can enter directly as the sovereign local creator.
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={isPending}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-[11px] text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full tracking-widest text-xs font-semibold uppercase"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Entering Studio...
          </>
        ) : (
          "Enter Studio"
        )}
      </Button>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        Don&apos;t have a workspace yet?{" "}
        <Link
          href="/signup"
          className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Claim your Source
        </Link>
      </div>
    </form>
  );
}
