import * as FileSystem from "expo-file-system/legacy";
import type { PickedImage } from "./pickImage";

/** Must match backend submitKycSchema DATA_IMAGE_BASE64 */
const DATA_IMAGE_BASE64 =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function normalizeDataImagePrefix(uri: string): string {
  return uri.replace(/^data:image\/jpg;/i, "data:image/jpeg;");
}

/**
 * Ensures a CCCD image is a Joi-valid data URI before POST /users/me/kyc.
 */
export async function toBackendKycDataUri(image: PickedImage): Promise<string> {
  const raw = image.persistUri.trim();

  if (DATA_IMAGE_BASE64.test(raw)) {
    return normalizeDataImagePrefix(raw);
  }

  if (raw.startsWith("file://") || raw.startsWith("content://")) {
    const base64 = await FileSystem.readAsStringAsync(raw, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  }

  throw new Error(
    "ID photo must be uploaded again (missing base64). Try Take photo or Choose from album.",
  );
}
