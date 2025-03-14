import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { timingSafeEqual, randomBytes, scryptSync, createCipheriv, createDecipheriv, generateKeyPair, generateKeyPairSync, publicEncrypt, privateDecrypt, sign, createSign, createVerify } from 'crypto';
import { Network, Alchemy } from "alchemy-sdk";

dotenv.config();
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: process.env.ALCHEMY_NETWORK as Network, // Replace with your network.
};

const alchemy = new Alchemy(settings);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, key] = hashedPassword.split(':');
  const keyBuffer = scryptSync(password, salt, 64);
  const storedKeyBuffer = Buffer.from(key, 'hex');
  
  if (keyBuffer.length !== storedKeyBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(keyBuffer, storedKeyBuffer);
}

const password = '123456';
const hashedPassword = hashPassword(password);
console.log('Hashed password:', hashedPassword);

const isValid = verifyPassword(password, hashedPassword);
console.log('Password valid:', isValid);

const message = 'Hello, world!';
const key = randomBytes(32);
const iv = randomBytes(16);
const cipher = createCipheriv('aes-256-cbc', key, iv);

const encrypted = cipher.update(message, 'utf8', 'hex');
const final = cipher.final('hex');
console.log('Encrypted message:', encrypted + final);


const decipher = createDecipheriv('aes-256-cbc', key, iv);
const decrypted = decipher.update(encrypted + final, 'hex', 'utf8');
const finalDecrypted = decipher.final('utf8');
console.log('Decrypted message:', decrypted + finalDecrypted);


const {privateKey, publicKey} = generateKeyPairSync('rsa',{
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
     format: 'pem'
  }
});



const encryptedData = publicEncrypt(publicKey,Buffer.from(message));
console.log('Encrypted Data:', encryptedData.toString('hex'));

const decryptedData = privateDecrypt(privateKey,encryptedData);
console.log('Decrypted Data:', decryptedData.toString('utf8'));

const signer = createSign('rsa-sha256');
const signature = signer.update(message).sign(privateKey,'hex');



const verifier = createVerify('rsa-sha256');
const verified = verifier.update(message).verify(publicKey,signature,'hex');
console.log('Verified:', verified);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());


// Basic health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, async() => {
  
  console.log(`Server running on port ${port}`);
}); 