import type { Metadata } from "next";
import "./globals.css";
import { BarnProvider } from "@/components/provider";
import { Shell } from "@/components/shell";
import { ranchDate } from "@/lib/dates";
export const metadata: Metadata = {
  title: "Dreamscape CareHub",
  description: "Daily horse care at Dreamscape Ranch",
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <BarnProvider today={ranchDate()}>
          <Shell>{children}</Shell>
        </BarnProvider>
      </body>
    </html>
  );
}
