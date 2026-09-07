import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "DDC Admin",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
