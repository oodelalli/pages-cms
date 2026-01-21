import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { useConfig } from "@/contexts/config-context";

const inter = Inter({ subsets: ["latin"] });
const { config } = useConfig();

export const metadata: Metadata = {
  title: {
    template: "%s | Pages CMS",
    default: "Pages CMS",
  },
  description: "The No-Hassle CMS for GitHub",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	return (
    <html lang="en" suppressHydrationWarning>
		<head>
			<link rel="stylesheet" href="/custom.css" />
			{config?.object?.custom_css_url && (
				<link rel="stylesheet" href={config.object.custom_css_url} />
			)}
			<script src="/custom.js" defer></script>
		</head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        {children}
        <Toaster/>
      </body>
    </html>
  );
}