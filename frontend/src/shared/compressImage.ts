/**
 * Réduit une photo avant envoi : un cliché de téléphone pèse plusieurs Mo.
 * Un fichier que le navigateur ne sait pas décoder est refusé plutôt que perdu en silence.
 */
export function compressImage(file: File, maxSide = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Image illisible."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image illisible."));
    };
    img.src = objectUrl;
  });
}
