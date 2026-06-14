import type { PickedImage } from "./pickImage";
import { pickImageFromGallery } from "./pickImage";

export type PickedAvatar = PickedImage;

/**
 * Open the device photo library for a square profile avatar.
 * Returns preview + persistable URIs, or null when cancelled.
 */
export async function pickAvatarFromGallery(): Promise<PickedAvatar | null> {
  return pickImageFromGallery({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.65,
  });
}

export { takePhotoFromCamera } from "./pickImage";
