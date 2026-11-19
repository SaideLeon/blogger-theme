import sharp from "sharp";

const b64 = (b: Uint8Array) => Buffer.from(b).toString("base64");

/** Logo: PNG até 160 px com fundo transparente, embutido no XML. */
export async function logoDataUrl(buf: Buffer): Promise<string> {
  const out = await sharp(buf)
    .resize(160, 160, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return `data:image/png;base64,${b64(out)}`;
}

/** Banner do tema gerado: 1280x720, JPEG comprimido (< ~110 KB). */
export async function bannerDataUrl(buf: Buffer): Promise<string> {
  let out: Uint8Array = new Uint8Array(0);
  for (const q of [62, 55, 48]) {
    out = await sharp(buf).resize(1280, 720, { fit: "cover" }).jpeg({ quality: q, progressive: true }).toBuffer();
    if (out.length < 110_000) break;
  }
  return `data:image/jpeg;base64,${b64(out)}`;
}

/** Imagem de um tema pronto: cobre e corta ao centro no tamanho exacto. */
export async function coverDataUrl(buf: Buffer, size: [number, number], quality = 82): Promise<string> {
  const out = await sharp(buf).resize(size[0], size[1], { fit: "cover" }).jpeg({ quality, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${b64(out)}`;
}
