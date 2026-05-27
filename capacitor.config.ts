import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.thescholarr.app",
  appName: "Scholarr",
  webDir: "dist",
  server: {
    url: "https://63bd0e4f-b68e-4f02-ae04-4d5d045bd90e.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
};

export default config;
