import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Room",
  description: "Real-time multi-user text editor with rooms.",
  openGraph: {
    title: "Room",
    description: "Real-time multi-user text editor with rooms.",
    url: "https://room.webark.in",
    siteName: "Room",
    images: [
      {
          url: "https://room.webark.in/og-image.png",
          width: 1500,
          height: 768,
          alt: "Room",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
