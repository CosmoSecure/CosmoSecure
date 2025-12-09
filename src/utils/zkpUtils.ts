/**
 * Zero-Knowledge Proof Utilities
 * 
 * This module provides cryptographic functions for true ZKP authentication
 * using encrypted canary values instead of storing password hashes.
 * 
 * The canary approach:
 * 1. Client encrypts a known value (canary) with master password-derived key
 * 2. Server stores only encrypted canary + salt (never sees actual password)
 * 3. Client-side verification: decrypt canary and check against known value
 * 4. Server never verifies or knows the actual password
 */

// Known canary value for verification
export const CANARY_VALUE = "COSMOSECURE_ZKP_CANARY";

/**
 * Derive a cryptographic key from password using PBKDF2
 * @param password - Master password/PIN
 * @param salt - Random salt (hex string)
 * @returns CryptoKey for AES-GCM encryption/decryption
 */
export const deriveKeyFromPassword = async (
    password: string,
    salt: string
): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive key using PBKDF2 with 100,000 iterations
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    return key;
};

/**
 * Encrypt canary value with derived key for ZKP setup
 * @param canary - Known canary string
 * @param key - Derived CryptoKey
 * @returns Hex-encoded string containing IV + encrypted data
 */
export const encryptCanary = async (
    canary: string,
    key: CryptoKey
): Promise<string> => {
    const encoder = new TextEncoder();
    const canaryBuffer = encoder.encode(canary);

    // Generate random 12-byte IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt canary with AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        canaryBuffer
    );

    // Combine IV + encrypted data into single buffer
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to hex string for storage
    return Array.from(combined)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * Decrypt canary value to verify master password correctness
 * @param encryptedCanaryHex - Hex-encoded encrypted canary from server
 * @param key - Derived CryptoKey from user input
 * @returns Decrypted canary string, or null if decryption fails
 */
export const decryptCanary = async (
    encryptedCanaryHex: string,
    key: CryptoKey
): Promise<string | null> => {
    try {
        // Convert hex string back to Uint8Array
        const combined = new Uint8Array(
            encryptedCanaryHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );

        // Extract IV (first 12 bytes) and encrypted data
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

        // Decrypt with AES-GCM
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encryptedData
        );

        // Convert decrypted buffer to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        console.error('Canary decryption failed:', error);
        return null;
    }
};

/**
 * Verify master password by decrypting canary and comparing to known value
 * @param password - User-entered master password
 * @param encryptedCanary - Encrypted canary from server
 * @param salt - Salt from server
 * @returns true if password is correct, false otherwise
 */
export const verifyMasterPassword = async (
    password: string,
    encryptedCanary: string,
    salt: string
): Promise<boolean> => {
    try {
        // Derive key from entered password
        const key = await deriveKeyFromPassword(password, salt);

        // Decrypt canary
        const decryptedCanary = await decryptCanary(encryptedCanary, key);

        // Compare with known canary value
        return decryptedCanary === CANARY_VALUE;
    } catch (error) {
        console.error('Master password verification failed:', error);
        return false;
    }
};

/**
 * Hash master password with SHA-256 for backward compatibility
 * Used for encrypting stored passwords (not for authentication)
 * @param password - Master password
 * @returns Hex-encoded SHA-256 hash
 */
export const hashMasterPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
