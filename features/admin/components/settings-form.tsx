"use client";

import { useActionState } from "react";
import {
  upsertSiteSetting,
  type SettingActionState,
} from "@/features/admin/actions/misc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function SettingsForm() {
  const [state, action, pending] = useActionState<SettingActionState, FormData>(
    upsertSiteSetting,
    {}
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-ink/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
    >
      <h3 className="text-sm font-medium">Site setting (key / value)</h3>
      {state.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-sage-dark">{state.success}</p>
      ) : null}
      <div>
        <Label htmlFor="key">Key</Label>
        <Input
          id="key"
          name="key"
          required
          placeholder="e.g. homepage.banner"
          className="mt-1.5 h-10 border-oak/50 bg-white"
        />
      </div>
      <div>
        <Label htmlFor="value">Value (JSON or plain text)</Label>
        <Textarea
          id="value"
          name="value"
          required
          rows={4}
          className="mt-1.5 border-oak/50 bg-white"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save setting"}
      </Button>
    </form>
  );
}
