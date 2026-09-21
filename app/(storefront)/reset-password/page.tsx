import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-16 text-center text-sm text-ink-muted">
          …
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
