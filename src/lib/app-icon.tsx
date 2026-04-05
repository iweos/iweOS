type AppIconArtworkProps = {
  size: number;
  radius: number;
  glyphSize: number;
};

export const APP_ICON_VERSION = "20260405b";

const DOVE_PATH =
  "M277.85 314.76v-28.1c-28.2-36.3-47.1-79.3-54.1-125.2-2.1-13.5-19-18.8-27.8-8.3-21.1 24.9-37.7 54.1-48.9 86.5 34.2 38.3 80 64.6 130.8 75.1Zm112-103.2c-44.2 0-80 35.9-80 80.1v59.4c-104.4-6.2-193-70.5-233-161.7-5.5-12.5-23.2-13.2-29-.9-16.6 35.1-26 74.3-26 115.7 0 70.8 34.1 136.9 85.1 185.9 13.2 12.7 26.1 23.2 38.9 32.8L2 558.7c-10.7 2.7-15.5 15.1-9.5 24.4 17.4 26.9 60.4 72.5 153.2 76.3 8 .3 16-2.6 22.1-7.9l65.2-56.1h76.9c88.4 0 160-71.5 160-159.9v-160l32-64h-112Zm0 96.1c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16Z";

export function AppIconArtwork({ size, radius, glyphSize }: AppIconArtworkProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        borderRadius: radius,
        background:
          "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.22), transparent 28%), linear-gradient(150deg, #3d8450 0%, #2f6b3f 50%, #224d30 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.12), transparent 48%, rgba(0,0,0,0.12) 100%)",
        }}
      />
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 512 512"
        fill="none"
        aria-hidden="true"
        style={{
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 10px 18px rgba(18, 38, 24, 0.22))",
        }}
      >
        <path d={DOVE_PATH} fill="#ffffff" />
      </svg>
    </div>
  );
}
