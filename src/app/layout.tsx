import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FridgeMatch – Good food. Less waste.",
    template: "%s · FridgeMatch",
  },
  description:
    "Find recipes for what's in your fridge. FridgeMatch ranks recipes by the ingredients you already have and tracks what is about to expire.",
};

export const viewport: Viewport = {
  themeColor: "#f8f3ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
