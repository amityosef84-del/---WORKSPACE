import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketLens AI — מחקר שוק ומתחרים אוטומטי",
  description: "מערכת AI לניתוח שוק ומתחרים מעמיק ב-7 שלבים עוקבים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-charcoal">
        {children}
      </body>
    </html>
  );
}
