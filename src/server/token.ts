export function generateToken(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return token;
}
