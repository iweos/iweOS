import { APP_ICON_VERSION } from "@/lib/app-icon";

export default function LegacyAdminHead() {
  return (
    <>
      <link rel="icon" href={`/icon?v=${APP_ICON_VERSION}`} sizes="512x512" type="image/png" />
      <link rel="shortcut icon" href={`/icon?v=${APP_ICON_VERSION}`} type="image/png" />
      <link rel="apple-touch-icon" href={`/apple-icon?v=${APP_ICON_VERSION}`} />
      <link rel="stylesheet" href="/kaiadmin/assets/css/fonts.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/plugins.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/kaiadmin.min.css" />
      <link rel="stylesheet" href="/kaiadmin/iweos-admin.css" />
    </>
  );
}
