import { createHash, randomBytes } from "node:crypto";
import { verifyTelegramInitData } from "../lib/telegram";

export type TelegramIdentity = {
  telegramUserId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
};

export type AuthSession = {
  userId: string;
  token: string;
  expiresAt: Date;
};

export function authenticateTelegram(initData: string, botToken: string): TelegramIdentity {
  const verified = verifyTelegramInitData(initData, botToken);
  if (!verified) throw new Error("INVALID_TELEGRAM_INIT_DATA");

  const params = new URLSearchParams(initData);
  const rawUser = params.get("user");
  if (!rawUser) throw new Error("TELEGRAM_USER_MISSING");

  const user = JSON.parse(rawUser) as {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  };

  if (!Number.isSafeInteger(user.id)) throw new Error("INVALID_TELEGRAM_USER_ID");

  return {
    telegramUserId: user.id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    languageCode: user.language_code,
  };
}

export function createSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(hours = 24 * 30): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
