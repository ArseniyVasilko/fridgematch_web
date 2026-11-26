import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FridgeMatch",
    short_name: "FridgeMatch",
    description: "Find recipes for the ingredients you already have.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F3EC",
    theme_color: "#F8F3EC",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}