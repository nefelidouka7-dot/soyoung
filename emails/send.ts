type OrderEmailItem = {
  productName: string;
  quantity: number;
  howToUse: string | null;
};

type OrderEmail = {
  to: string;
  orderNumber: string;
  total: number;
  items?: OrderEmailItem[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  sensitive?: boolean;
}) {
  const from = process.env.EMAIL_FROM ?? "SoYoung <noreply@soyoung.example>";
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production" && input.sensitive) {
      throw new Error(
        "Email is not configured. Set RESEND_API_KEY before sending sensitive mail in production."
      );
    }
    // Never log bodies that may contain reset tokens or PII-rich HTML.
    console.info("[email]", {
      from,
      to: input.to,
      subject: input.subject,
      sensitive: Boolean(input.sensitive),
      logged: true,
    });
    return { queued: false, logged: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      // Resend explains the reason in the body (e.g. unverified "from" domain).
      const reason = (await res.text().catch(() => "")).slice(0, 500);
      console.error("[email] Resend rejected the email", {
        status: res.status,
        subject: input.subject,
        from,
        reason,
      });
    }
    return { queued: res.ok, logged: false };
  } catch (error) {
    console.error("[email] failed to send", input.subject, error);
    return { queued: false, logged: false };
  }
}

function buildUsageSection(items: OrderEmailItem[]) {
  const withInstructions = items.filter(
    (item) => item.howToUse && item.howToUse.trim().length > 0
  );
  if (withInstructions.length === 0) return "";

  const blocks = withInstructions
    .map(
      (item) => `
      <div style="margin:0 0 20px;">
        <p style="margin:0 0 6px;font-weight:600;">${escapeHtml(item.productName)}${
          item.quantity > 1 ? ` × ${item.quantity}` : ""
        }</p>
        <p style="margin:0;color:#5c5650;line-height:1.6;">${formatMultiline(
          item.howToUse!.trim()
        )}</p>
      </div>`
    )
    .join("");

  return `
    <hr style="border:none;border-top:1px solid #e8d9c8;margin:28px 0;" />
    <h2 style="margin:0 0 14px;font-size:18px;">Οδηγίες χρήσης</h2>
    ${blocks}
  `;
}

export async function sendOrderConfirmationEmail(payload: OrderEmail) {
  const items = payload.items ?? [];
  const lineList =
    items.length > 0
      ? `<ul style="padding-left:18px;margin:12px 0 0;">${items
          .map(
            (item) =>
              `<li style="margin:0 0 6px;">${escapeHtml(item.productName)} × ${
                item.quantity
              }</li>`
          )
          .join("")}</ul>`
      : "";

  return sendEmail({
    to: payload.to,
    subject: `Επιβεβαίωση παραγγελίας · ${payload.orderNumber}`,
    html: `
      <p>Σας ευχαριστούμε για την παραγγελία σας <strong>${escapeHtml(
        payload.orderNumber
      )}</strong>.</p>
      <p>Σύνολο: €${payload.total.toFixed(2)}</p>
      ${lineList}
      ${buildUsageSection(items)}
      <p style="margin-top:28px;color:#5c5650;font-size:13px;">SoYoung</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Επαναφορά κωδικού SoYoung",
    sensitive: true,
    html: `<p>Λάβαμε αίτημα για επαναφορά του κωδικού σας.</p><p><a href="${escapeHtml(
      resetUrl
    )}">Ορισμός νέου κωδικού</a></p><p>Ο σύνδεσμος λήγει σε 1 ώρα. Αν δεν κάνατε εσείς το αίτημα, αγνοήστε αυτό το email.</p>`,
  });
}
