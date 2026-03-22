import ResultsThemeBridge from "@/app/results/ResultsThemeBridge";

export default function AppPrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/kaiadmin/assets/css/fonts.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/plugins.min.css" />
      <link rel="stylesheet" href="/kaiadmin/assets/css/kaiadmin.min.css" />
      <link rel="stylesheet" href="/kaiadmin/iweos-admin.css" />
      <ResultsThemeBridge />
      <div className="min-vh-100" style={{ background: "#f4f7fb" }}>
        {children}
      </div>
    </>
  );
}

