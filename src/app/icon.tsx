import { ImageResponse } from "next/og";
import { AppIconArtwork } from "@/lib/app-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppIconArtwork size={512} radius={120} glyphSize={248} />, size);
}
