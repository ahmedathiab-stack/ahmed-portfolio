import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

const password = process.argv[2];
const email = process.argv[3];
if (!password || !email) {
  console.error('Usage: node scripts/make-admin-secrets.mjs "StrongPassword" "admin@example.com"');
  process.exit(1);
}
const passwordHash = await bcrypt.hash(password, 12);
const totpSecret = authenticator.generateSecret();
const otpauth = authenticator.keyuri(email, 'Huda Site Admin', totpSecret);

console.log('\nAdd these values to Vercel Environment Variables (never commit them):\n');
console.log(`ADMIN_EMAIL=${email.trim().toLowerCase()}`);
console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
console.log(`ADMIN_TOTP_SECRET=${totpSecret}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(48).toString('base64url')}`);
console.log('\nAuthenticator setup URI (use a QR generator locally):\n' + otpauth);
