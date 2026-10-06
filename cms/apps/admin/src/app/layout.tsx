import type { ReactNode } from "react";
import { IBM_Plex_Sans } from "next/font/google";
import { NavigationLoader } from "@/components/navigation-loader";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex",
});

export const metadata = {
  title: "DDC Admin",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plex.variable}>
      <body className={plex.className}>
        <NavigationLoader />
        {children}
      </body>
    </html>
  );
}
