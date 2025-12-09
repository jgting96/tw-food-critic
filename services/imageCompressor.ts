/**
 * Compresses an image file client-side before upload.
 * @param file The image file to compress.
 * @param quality The quality of the resulting JPEG image (0.0 to 1.0).
 * @param maxWidth The maximum width of the resulting image.
 * @returns A promise that resolves with the compressed image as a Base64 data URL.
 */
export const compressImage = (
  file: File,
  quality: number = 0.7,
  maxWidth: number = 1024
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("FileReader did not successfully read the file."));
      }
      
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        let width = img.width;
        let height = img.height;

        // Calculate the new dimensions
        if (width > maxWidth) {
          const scale = maxWidth / width;
          width = maxWidth;
          height = height * scale;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Get the data URL for the resized image
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
