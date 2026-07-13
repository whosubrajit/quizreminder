import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AppBoot from "@/components/AppBoot";
import NebulaFlow from "@/components/lightswind/nebula-flow";

export const metadata: Metadata = {
  title: "Quiz Reminder",
  description: "Never miss a quiz or assignment deadline",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Quiz Reminder", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // apply saved dark mode before first paint to avoid a flash
          dangerouslySetInnerHTML={{
            __html: `try{if(JSON.parse(localStorage.getItem("qr.settings")||"{}").darkMode)document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body>
        <div className="fixed inset-0 -z-20">
          <NebulaFlow 
            colors={["#001d3d", "#003566", "#00b4d8"]} 
            interactive={true} 
            backdropBlurAmount="none" 
          />
        </div>
        <div className="bg-glass-gradient pointer-events-none" />
        <AppBoot />
        <div className="mx-auto max-w-2xl px-4 pb-24 pt-4 sm:pb-8 sm:pt-4">
          <Nav />
          <main className="mt-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
