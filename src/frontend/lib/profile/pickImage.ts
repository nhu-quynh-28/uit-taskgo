import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export type PickedImage = {
  /** Local file URI for instant preview */
  previewUri: string;
  /** Value safe to send to API later (data URI when base64 available) */
  persistUri: string;
};

/** Backend Joi only accepts jpeg | jpg | png | webp data URIs. */
function kycMimeType(mimeType?: string | null): string {
  const mime = (mimeType ?? "image/jpeg").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "image/jpeg";
  if (mime === "image/png") return "image/png";
  if (mime === "image/webp") return "image/webp";
  return "image/jpeg";
}

function buildDataUri(asset: ImagePicker.ImagePickerAsset): string | null {
  if (!asset.base64) return null;
  const mime = kycMimeType(asset.mimeType);
  return `data:${mime};base64,${asset.base64}`;
}

type PickImageOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
};

const DEFAULT_ID_OPTIONS: PickImageOptions = {
  allowsEditing: true,
  aspect: [16, 10],
  quality: 0.75,
};

async function pickFromLibrary(
  options: PickImageOptions = DEFAULT_ID_OPTIONS,
): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== ImagePicker.PermissionStatus.GRANTED) {
    Alert.alert(
      "Photo access required",
      "Please allow access to your photo library in Settings to upload your ID card.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect,
    quality: options.quality ?? 0.75,
    base64: true,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.uri) return null;

  const dataUri = buildDataUri(asset);
  return {
    previewUri: asset.uri,
    persistUri: dataUri ?? asset.uri,
  };
}

/** Chụp ảnh trực tiếp từ camera (CCCD, giấy tờ). */
export async function takePhotoFromCamera(
  options: PickImageOptions = DEFAULT_ID_OPTIONS,
): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== ImagePicker.PermissionStatus.GRANTED) {
    Alert.alert(
      "Camera access required",
      "Please allow camera access in Settings to photograph your ID card.",
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect,
    quality: options.quality ?? 0.75,
    base64: true,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.uri) return null;

  const dataUri = buildDataUri(asset);
  return {
    previewUri: asset.uri,
    persistUri: dataUri ?? asset.uri,
  };
}

/** Chọn ảnh từ album (CCCD, giấy tờ). */
export async function pickImageFromGallery(
  options: PickImageOptions = DEFAULT_ID_OPTIONS,
): Promise<PickedImage | null> {
  return pickFromLibrary(options);
}

/** Menu: chụp hoặc chọn album — dùng cho upload CCCD. */
export function pickIdImageWithSourceMenu(
  onPicked: (image: PickedImage) => void,
): void {
  Alert.alert("Upload ID photo", "Choose how to add your ID card image", [
    {
      text: "Take photo",
      onPress: () => {
        void takePhotoFromCamera().then((img) => {
          if (img) onPicked(img);
        });
      },
    },
    {
      text: "Choose from album",
      onPress: () => {
        void pickImageFromGallery().then((img) => {
          if (img) onPicked(img);
        });
      },
    },
    { text: "Cancel", style: "cancel" },
  ]);
}
