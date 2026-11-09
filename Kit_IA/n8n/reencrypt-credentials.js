const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const key = process.env.N8N_ENCRYPTION_KEY;
const source = process.argv[2];
const target = process.argv[3];
const legacyKey = 'super-secret-key';

if (!key || !source || !target) {
  console.error('Uso: node reencrypt-credentials.js <origem> <destino>');
  process.exit(1);
}

fs.mkdirSync(target, { recursive: true });

function keyAndIv(salt, password) {
  const material = Buffer.concat([Buffer.from(password, 'binary'), salt]);
  const hash1 = crypto.createHash('md5').update(material).digest();
  const hash2 = crypto.createHash('md5').update(Buffer.concat([hash1, material])).digest();
  const iv = crypto.createHash('md5').update(Buffer.concat([hash2, material])).digest();
  return [Buffer.concat([hash1, hash2]), iv];
}

function decrypt(data, password) {
  const input = Buffer.from(data, 'base64');
  const salt = input.subarray(8, 16);
  const [derivedKey, iv] = keyAndIv(salt, password);
  const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
  return Buffer.concat([decipher.update(input.subarray(16)), decipher.final()]).toString('utf8');
}

function encrypt(plain, password) {
  const salt = crypto.randomBytes(8);
  const [derivedKey, iv] = keyAndIv(salt, password);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([Buffer.from('Salted__'), salt, encrypted]).toString('base64');
}

function plaintext(data) {
  try {
    const text = decrypt(data, key);
    JSON.parse(text);
    return text;
  } catch {
    const text = decrypt(data, legacyKey);
    JSON.parse(text);
    return text;
  }
}

for (const file of fs.readdirSync(source).filter((name) => name.endsWith('.json'))) {
  const credential = JSON.parse(fs.readFileSync(path.join(source, file), 'utf8'));
  const plain = plaintext(credential.data);
  credential.data = encrypt(plain, key);
  fs.writeFileSync(path.join(target, file), JSON.stringify(credential));
  console.log('Credencial recifrada:', credential.name);
}
