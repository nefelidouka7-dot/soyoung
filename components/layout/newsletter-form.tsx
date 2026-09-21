"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/use-translation";

export function NewsletterForm() {
  const { dict } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error(dict.newsletter.invalidEmail);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    setEmail("");
    toast.success(dict.newsletter.success);
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex w-full gap-2">
      <Input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dict.newsletter.placeholder}
        aria-label={dict.newsletter.placeholder}
        required
        className="min-w-0 flex-1"
      />
      <Button type="submit" size="md" className="shrink-0" disabled={loading}>
        {loading ? "..." : dict.newsletter.join}
      </Button>
    </form>
  );
}
