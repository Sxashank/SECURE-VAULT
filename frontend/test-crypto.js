import CryptoJS from 'crypto-js';
const ENCRYPTION_KEY = 'default-secure-vault-e2e-key';

let content = "raw unencrypted text data";
let decrypted = '';
try {
  const bytes = CryptoJS.AES.decrypt(content, ENCRYPTION_KEY);
  decrypted = bytes.toString(CryptoJS.enc.Utf8);
  console.log("Decrypted inside try:", decrypted);
  if (!decrypted) {
      console.log("Fallback triggered!");
      decrypted = content;
  }
} catch (e) {
  console.log("Catch triggered!");
  decrypted = content;
}
console.log("Final:", decrypted);
