import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory, WriteFileResult, ReaddirResult } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export type SavedPhoto = {
  filepath: string;
  webviewPath?: string | null;
};

async function base64FromCameraPhoto(photo: Photo): Promise<string | undefined> {
  if ((photo as any).base64String) return (photo as any).base64String;
  if (photo.webPath) {
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return undefined;
}

export async function takePhotoAndSave(): Promise<SavedPhoto | null> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 90,
    });

    const base64Data = await base64FromCameraPhoto(photo);
    if (!base64Data) return null;

    const fileName = `photo_${new Date().getTime()}.jpeg`;
    const filePath = `photos/${fileName}`;

    const writeResult: WriteFileResult = await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Data,
    });

    let webviewPath: string | null = null;
    try {
      if (Capacitor.getPlatform() === 'web') {
        webviewPath = `data:image/jpeg;base64,${base64Data}`;
      } else {
        const uri = await Filesystem.getUri({ directory: Directory.Data, path: filePath });
        webviewPath = uri.uri;
      }
    } catch (e) {
      webviewPath = null;
    }

    return { filepath: writeResult.uri ?? filePath, webviewPath } as SavedPhoto;
  } catch (e) {
    console.error('takePhotoAndSave error', e);
    return null;
  }
}

export async function listSavedPhotos(): Promise<SavedPhoto[]> {
  try {
    const dir: ReaddirResult = await Filesystem.readdir({ directory: Directory.Data, path: 'photos' });
    const items: SavedPhoto[] = [];
    for (const f of dir.files) {
      const path = `photos/${f}`;
      let uri: string | null = null;
      try {
        const fileUri = await Filesystem.getUri({ directory: Directory.Data, path });
        uri = fileUri.uri;
      } catch {
        uri = null;
      }
      items.push({ filepath: path, webviewPath: uri });
    }
    return items;
  } catch (e) {
    return [];
  }
}

export default { takePhotoAndSave, listSavedPhotos };
