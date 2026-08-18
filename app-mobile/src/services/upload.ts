// Secure upload via backend: App -> Backend (authenticated) -> Cloudinary
import { authService } from './auth';
import { API_BASE_URL } from '@/src/config/api';
import type { ImagePickerAsset } from 'expo-image-picker';

function getUploadName(asset: ImagePickerAsset): string {
  if (asset.fileName) return asset.fileName;
  const extension = asset.mimeType?.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  return `avatar.${extension}`;
}

export async function uploadImageAsync(asset: ImagePickerAsset): Promise<string> {
  const token = await authService.getStoredToken();
  if (!token) throw new Error('Usuário não autenticado.');
  if (!API_BASE_URL) throw new Error('API não configurada.');

  const form = new FormData();
  if (asset.file) {
    // Browsers expose the selected image as a File.
    form.append('avatar', asset.file, getUploadName(asset));
  } else {
    // React Native reads the local file URI while serializing the multipart body.
    // Fetching a file:// URI first is unreliable and results in "Network request failed".
    form.append('avatar', {
      uri: asset.uri,
      name: getUploadName(asset),
      type: asset.mimeType ?? 'image/jpeg',
    } as any);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/profile/avatar`, {
      method: 'POST',
      body: form,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(`Não foi possível conectar ao servidor (${API_BASE_URL}). Verifique se o celular e o computador estão na mesma rede.`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(data?.error?.message ?? `Falha no upload (HTTP ${response.status}).`);
  }

  const data = await response.json() as { avatarUrl?: string };
  if (!data.avatarUrl) throw new Error('O servidor não retornou a URL do avatar.');
  return data.avatarUrl;
}

export default uploadImageAsync;
