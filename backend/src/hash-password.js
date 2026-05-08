// Utilidad: genera el bcrypt hash de un password para usar en ADMIN_PASSWORD_HASH.
// Uso:
//   npm run hash-password -- "MiPasswordSeguro123"

import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run hash-password -- "tupassword"');
  process.exit(1);
}
if (password.length < 10) {
  console.error('⚠️  Password muy corto. Usá al menos 10 caracteres.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nHash generado (pegá esto en Render como ADMIN_PASSWORD_HASH):\n');
console.log(hash);
console.log('');
