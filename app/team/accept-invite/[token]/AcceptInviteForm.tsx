"use client";
import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteResult } from "@/app/actions/team/acceptInvite";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AcceptInviteForm({ token, label, failureLabel, pendingLabel, planLimitLabel }: { token: string; label: string; failureLabel: string; pendingLabel: string; planLimitLabel: string }) {
  const [result, submit, pending] = useActionState<AcceptInviteResult | null, FormData>(
    async () => acceptInviteAction(token), null,
  );
  return <form action={submit} className="mt-6 space-y-4">
    {result && !result.ok && (
      <Alert variant="destructive">{result.error === "limite_do_plano" ? planLimitLabel : failureLabel}</Alert>
    )}
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  </form>;
}
