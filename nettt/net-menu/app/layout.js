import "./globals.css";

export const metadata = {
  title: "NET Menu",
  description: "NET Caffe & Restaurant · Slemani",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@400;500;600;700&family=Vazirmatn:wght@400;500;700&family=Noto+Kufi+Arabic:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
