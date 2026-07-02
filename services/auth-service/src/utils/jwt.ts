import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const privateKey: Secret = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem');
const publicKey:  Secret = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH  || './keys/public.pem');

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  institutionId?: string;
}

export function signAccessToken(payload: TokenPayload): string {
  const opts: SignOptions = {
    algorithm: 'RS256',
    expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as SignOptions['expiresIn'],
    issuer: 'eduintel-ai',
    jwtid: uuidv4(),   // unique per issuance so rapid re-signing produces distinct tokens
  };
  return jwt.sign(payload as object, privateKey, opts);
}

export function signRefreshToken(userId: string): string {
  const opts: SignOptions = {
    algorithm: 'RS256',
    expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as SignOptions['expiresIn'],
    issuer: 'eduintel-ai',
  };
  return jwt.sign({ userId, type: 'refresh' }, privateKey, opts);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'eduintel-ai',
  }) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string; type: string } {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'eduintel-ai',
  }) as { userId: string; type: string };
}
