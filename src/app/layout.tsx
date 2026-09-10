import type { Metadata } from "next";
import "./globals.css";
import { BarnSession } from "@/components/barn-session";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: "Dreamscape CareHub",
  description: "Daily horse care at Dreamscape Ranch",
};
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
        <BarnSession>
          <Shell>{children}</Shell>
        </BarnSession>
      </body>
    </html>
  );
}
