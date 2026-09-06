import "./globals.css";
import type { Metadata } from "next";
import PushBridge from "./PushBridge";

export const metadata: Metadata = {
  title: "LavoroSubito",
  description: "Marketplace per interventi urgenti."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        {children}
        <PushBridge />
      </body>
    </html>
  );
}
