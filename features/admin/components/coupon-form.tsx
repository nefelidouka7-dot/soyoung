"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createCoupon,
  type CouponActionState,
} from "@/features/admin/actions/misc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CouponForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<CouponActionState, FormData>(
    createCoupon,
    {}
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-ink">
          Create coupon
        </h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Codes are case-insensitive at checkout.
        </p>
      </div>
      {state.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-sage-dark">{state.success}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            required
            placeholder="WELCOME10"
            className="mt-1.5 h-10 border-oak/50 bg-white uppercase"
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            className="mt-1.5 flex h-10 w-full border border-oak/50 bg-white px-3 text-sm"
            defaultValue="PERCENTAGE"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed (€)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="10"
            className="mt-1.5 h-10 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="maxDiscount">Max discount (€)</Label>
          <Input
            id="maxDiscount"
            name="maxDiscount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Optional"
            className="mt-1.5 h-10 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="minOrder">Min order (€)</Label>
          <Input
            id="minOrder"
            name="minOrder"
            type="number"
            step="0.01"
            min="0"
            placeholder="Optional"
            className="mt-1.5 h-10 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="usageLimit">Usage limit</Label>
          <Input
            id="usageLimit"
            name="usageLimit"
            type="number"
            min="1"
            placeholder="Unlimited"
            className="mt-1.5 h-10 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="startsAt">Starts at</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            className="mt-1.5 h-10 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="expiresAt">Expires at</Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            className="mt-1.5 h-10 border-oak/50 bg-white"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked
          className="accent-sage"
        />
        Active (usable at checkout)
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create coupon"}
      </Button>
    </form>
  );
}
