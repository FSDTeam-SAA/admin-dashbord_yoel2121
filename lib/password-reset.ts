export const passwordResetStorageKey = "zentrofix-password-reset";

export type PasswordResetSession = {
  email: string;
  otp: string;
};

export function savePasswordResetSession(value: PasswordResetSession) {
  window.sessionStorage.setItem(passwordResetStorageKey, JSON.stringify(value));
}

export function readPasswordResetSession(value: string): PasswordResetSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PasswordResetSession>;
    if (typeof parsed.email !== "string" || typeof parsed.otp !== "string") return null;
    if (!/^\d{4}$/.test(parsed.otp)) return null;
    return { email: parsed.email, otp: parsed.otp };
  } catch {
    return null;
  }
}

export function clearPasswordResetSession() {
  window.sessionStorage.removeItem(passwordResetStorageKey);
}
