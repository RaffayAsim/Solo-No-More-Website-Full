/**
 * Browser-only helper: shrinks a photo/screenshot before it is sent to the server.
 *
 * Server Actions reject request bodies over ~1 MB, and phone screenshots are
 * routinely 2–6 MB, so every upload goes through this first. The result is a JPEG
 * data URL that is normally 100–400 KB.
 */
export async function compressImageFile(
  file: File,
  options: { maxDimension?: number; maxBytes?: number } = {}
): Promise<string> {
  const maxDimension = options.maxDimension ?? 1400;
  const maxBytes = options.maxBytes ?? 600 * 1024;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG or PNG screenshot).");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("That image is too large. Please choose one under 15 MB.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("That file could not be opened as an image."));
    el.src = dataUrl;
  });

  let scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  let quality = 0.82;
  let output = dataUrl;

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    // White backing so transparent PNG screenshots don't turn black as JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    output = canvas.toDataURL("image/jpeg", quality);

    // base64 is ~4/3 the size of the bytes it encodes
    const approxBytes = Math.ceil((output.length - output.indexOf(",") - 1) * 0.75);
    if (approxBytes <= maxBytes) break;
    quality = Math.max(0.5, quality - 0.1);
    scale *= 0.8;
  }

  return output;
}
