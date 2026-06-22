import jwt from 'jsonwebtoken';

export const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    (process.env.JWT_SECRET as string) || 'fallback-secret-key',
    { expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d' }
  );
};
