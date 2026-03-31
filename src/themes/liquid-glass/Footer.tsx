import { siteConfig } from "@/src/core/config";

export default function Footer() {
  const year = new Date().getFullYear();
  const { copyright } = siteConfig.footer;

  return (
    <footer className="lgl-navbar border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-muted">
        © {year} {copyright} · Powered by Walle
      </div>
    </footer>
  );
}
