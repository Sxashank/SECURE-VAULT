import axios from 'axios';
import CryptoJS from 'crypto-js';

async function testUpload() {
  try {
    const rawContent = "This is a test document content";
    const encrypted = CryptoJS.AES.encrypt(rawContent, 'default-secure-vault-e2e-key').toString();

    const loginRes = await axios.post('http://127.0.0.1:5001/api/auth/login', {
      email: 'admin@securevault.local',
      password: 'admin'
    });
    const token = loginRes.data.token;

    const uploadRes = await axios.post('http://127.0.0.1:5001/api/documents/upload', {
      title: 'test_crypto_upload.txt',
      encrypted_path: 'vault/test.enc',
      content: encrypted,
      category: 'General',
      scope_type: 'TEAM',
      assigned_users: []
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Upload Success:", uploadRes.data);
    const docId = uploadRes.data.documentId;

    const fetchRes = await axios.get(`http://127.0.0.1:5001/api/documents/${docId}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const fetchedContent = fetchRes.data.content;
    const decrypted = CryptoJS.AES.decrypt(fetchedContent, 'default-secure-vault-e2e-key').toString(CryptoJS.enc.Utf8);
    console.log("Fetched and Decrypted:", decrypted);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
testUpload();
