import "./globals.css";
import Nav from "../components/Nav";
import DevToolbar from "../components/DevToolbar";
import LiveTicker from "../components/LiveTicker";
import { Fraunces, Space_Grotesk } from "next/font/google";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export const metadata = {
  title: "Main St AI",
  description: "Business OS + Owner Cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const showDevTools = process.env.NEXT_PUBLIC_SHOW_DEVTOOLS === "true";

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <div className="page-shell">
          <div className="page-glow" aria-hidden="true" />
          <div className="page-grid" aria-hidden="true" />
          <Nav />
          {showDevTools && <DevToolbar />}
          <LiveTicker />
          <main className="container main">{children}</main>
        </div>
      </body>
    </html>
  );
}
