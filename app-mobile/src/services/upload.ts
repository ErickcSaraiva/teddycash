// Simple Cloudinary upload helper. Configure the following env vars in Expo:
// EXPO_PUBLIC_CLOUDINARY_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
export async function uploadImageAsync(uri: string): Promise<string> {
  const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_NAME;
  const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary não configurado. Defina EXPO_PUBLIC_CLOUDINARY_NAME e EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  // Fetch the local file as a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const form = new FormData();
  // @ts-ignore - React Native FormData accepts blob
  form.append('file', blob);
  form.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form as any,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Upload falhou: ${res.status} ${txt}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

export default uploadImageAsync;
