import { createHmac, timingSafeEqual } from 'node:crypto';

export type TelegramInitData = {
  authDate: number;
  hash: string;
  user?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  };
};

function hexHmac(key: Buffer | string, data: string) {
  return createHmac('sha256', key).update(data).digest('hex');
}

export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSeconds = 86400): TelegramInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('Telegram initData hash is missing');

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) throw new Error('Telegram auth_date is invalid');
  if (Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) throw new Error('Telegram initData has expired');

  const pairs = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = hexHmac(secretKey, pairs);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(hash, 'hex');
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new Error('Telegram initData signature is invalid');
  }

  const userRaw = params.get('user');
  const user = userRaw ? JSON.parse(userRaw) : undefined;
  return { authDate, hash, user };
}
