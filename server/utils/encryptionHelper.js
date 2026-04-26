/**
 * encryptionHelper.js
 * Specialized utility for AES-256-CBC encryption of sensitive credentials.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-f81d4fae-7dec-11d0-a765-00a0c91e6bf6'; // 32 characters
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a text string using AES-256-CBC.
 * @param {string} text 
 * @returns {string} - Combined IV and encrypted text
 */
function encrypt(text) {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        console.error('[Encryption] Encrypt failed:', err.message);
        return text; // Fallback to plain text for resilience if key is invalid (logged as error)
    }
}

/**
 * Decrypts a combined IV and encrypted text string.
 * @param {string} text 
 * @returns {string} 
 */
function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        console.error('[Encryption] Decrypt failed (bad key or format):', err.message);
        return text; // Return original if decryption fails (e.g. wasn't encrypted)
    }
}

module.exports = { encrypt, decrypt };
