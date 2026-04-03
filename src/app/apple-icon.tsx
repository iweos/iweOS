import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #163022 0%, #2f6b3f 58%, #c78932 100%)",
          borderRadius: 42,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 24% 20%, rgba(255,255,255,0.18), transparent 34%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12), transparent 26%)",
          }}
        />
        <div
          style={{
            display: "flex",
            width: 136,
            height: 136,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 38,
            background: "rgba(255,255,255,0.08)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <svg width="84" height="84" viewBox="0 -64 512 512" fill="#ffffff">
            <g transform="translate(0 384) scale(1 -1)">
              <path d="M288 280.8V308.9C259.8 345.2 240.9 388.2 233.9 434.1C231.8 447.6 214.9 452.9 206.1 442.4C185 417.5 168.4 388.3 157.2 355.9C191.4 317.6 237.2 291.3 288 280.8zM400 384C355.8 384 320 348.1 320 303.9V244.5C215.6 250.7 127 315 87 406.2C81.5 418.7 63.8 419.4 58 407.1C41.4 372 32 332.8 32 291.4C32 220.6 66.1 154.5 117.1 105.5C130.3 92.8 143.2 82.3 156 72.7L12.1 36.7C1.4 34 -3.4 21.6 2.6 12.3C20 -14.6 63 -60.2 155.8 -64C163.8 -64.3 171.8 -61.4 177.9 -56.1L243.1 0H320C408.4 0 480 71.5 480 159.9V320L512 384H400zM400 287.9C391.2 287.9 384 295.1 384 303.9S391.2 319.9 400 319.9S416 312.7 416 303.9S408.8 287.9 400 287.9z" />
            </g>
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
