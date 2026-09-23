import type { FormEvent } from "react";

/** Briefly shake a field to draw attention to a validation error. */
export function triggerFieldShake(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.classList.remove("animate-field-shake");
  // Restart CSS animation even if the class was already present.
  void el.offsetWidth;
  el.classList.add("animate-field-shake", "border-coral");
  el.setAttribute("aria-invalid", "true");

  const clear = () => {
    el.classList.remove("animate-field-shake");
    el.removeEventListener("animationend", clear);
  };
  el.addEventListener("animationend", clear);
}

/** Shake every invalid control in a form; focus the first one. */
export function shakeInvalidFormFields(form: HTMLFormElement) {
  const invalid = [
    ...form.querySelectorAll<HTMLElement>(
      "input:invalid, textarea:invalid, select:invalid"
    ),
  ];
  if (invalid.length === 0) return false;

  for (const el of invalid) triggerFieldShake(el);
  const first = invalid[0];
  first.scrollIntoView({ behavior: "smooth", block: "center" });
  first.focus({ preventScroll: true });
  return true;
}

/** Shake fields by id (for controlled flows that don't use native submit). */
export function shakeFieldsById(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return;

  for (const id of unique) {
    triggerFieldShake(document.getElementById(id));
  }
  const first = document.getElementById(unique[0]!);
  first?.scrollIntoView({ behavior: "smooth", block: "center" });
  first?.focus({ preventScroll: true });
}

/** Call from form onSubmit before a server action — blocks submit when invalid. */
export function guardRequiredForm(event: FormEvent<HTMLFormElement>) {
  const form = event.currentTarget;
  if (form.checkValidity()) return true;
  event.preventDefault();
  event.stopPropagation();
  shakeInvalidFormFields(form);
  return false;
}
