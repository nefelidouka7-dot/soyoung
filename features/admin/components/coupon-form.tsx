"use client";

import { useActionState } from "react";
import {
  createCoupon,
  type CouponActionState,
} from "@/features/admin/actions/misc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CouponForm() {
  const [state, action, pending] = useActionState<CouponActionState, FormData>(
    createCoupon,
    {}
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-sm border border-oak/40 bg-white p-4"
    >
      <h3 className="text-sm font-medium">Create coupon</h3>
      {state.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            required
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
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed</option>
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
            className="mt-1.5 h-10 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="minOrder">Min order</Label>
          <Input
            id="minOrder"
            name="minOrder"
            type="number"
            step="0.01"
            min="0"
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
        Active
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create coupon"}
      </Button>
    </form>
  );
}
