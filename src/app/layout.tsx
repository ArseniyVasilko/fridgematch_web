import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NoticeProvider } from "@/components/CenterNotice";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: {
    default: "FridgeMatch – Good food. Less waste.",
    template: "%s · FridgeMatch",
  },
  description:
    "Find recipes for what's in your fridge. FridgeMatch ranks recipes by the ingredients you already have and tracks what is about to expire.",
  icons: {
    apple: [{ url: "/pwa/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f3ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <RegisterServiceWorker />
        <Header />
        <main id="main" className="flex-1">
          <NoticeProvider>{children}</NoticeProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
