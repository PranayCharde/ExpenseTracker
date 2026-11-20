/**
 * Cloudinary Receipt Upload Service (Web)
 * Uploads receipt images to Cloudinary via Unsigned Upload Preset.
 * Returns the secure HTTPS URL to be stored in the transaction record.
 */

export const CLOUDINARY_CONFIG = {
  // Read from Vite environment variables or fallback to user credentials
  cloudName: import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'dib2hgavs',
  uploadPreset: import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'Speendwise',
  folder: 'spendwise/receipts'
};

/**
 * Configure Cloudinary runtime credentials if needed
 */
export const configureCloudinary = (cloudName, uploadPreset) => {
  if (cloudName) CLOUDINARY_CONFIG.cloudName = cloudName;
  if (uploadPreset) CLOUDINARY_CONFIG.uploadPreset = uploadPreset;
};

/**
 * Upload receipt image to Cloudinary
 * @param {File|Blob|string} fileOrBase64 - File object, Blob, or base64 data URL
 * @returns {Promise<{ success: boolean, url?: string, publicId?: string, error?: string }>}
 */
export const uploadReceiptToCloudinary = async (fileOrBase64) => {
  if (!fileOrBase64) {
    return { success: false, error: 'No file or image provided for upload.' };
  }

  try {
    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    if (CLOUDINARY_CONFIG.folder) {
      formData.append('folder', CLOUDINARY_CONFIG.folder);
    }
    formData.append('tags', 'spendwise,receipt');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    const data = await response.json();

    if (response.ok && data.secure_url) {
      console.log('[Cloudinary] Successfully uploaded receipt:', data.secure_url);
      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format
      };
    } else {
      const errorMsg = data.error?.message || `Cloudinary upload failed (HTTP ${response.status})`;
      console.warn('[Cloudinary] Upload response error:', errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    console.warn('[Cloudinary] Upload exception:', err);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Upload timed out' : (err.message || 'Network error')
    };
  }
};

