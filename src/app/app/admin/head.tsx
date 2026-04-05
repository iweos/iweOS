import { APP_ICON_VERSION } from "@/lib/app-icon";

export default function AdminHead() {
  return (
    <>
      <link rel="icon" href={`/favicon-dove-white.svg?v=${APP_ICON_VERSION}`} type="image/svg+xml" />
      <link rel="shortcut icon" href={`/favicon-dove-white.svg?v=${APP_ICON_VERSION}`} type="image/svg+xml" />
      <link rel="apple-touch-icon" href={`/apple-icon?v=${APP_ICON_VERSION}`} />
      <link rel="stylesheet" href="/kaiadmin/assets/css/fonts.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/plugins.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/kaiadmin.min.css" />
      <link rel="stylesheet" href="/kaiadmin/iweos-admin.css" />
    </>
  );
}
