import "./globals.css";

export const metadata = {
  title: "SA Casino Review Agent",
  description: "SEO-optimised casino reviews for South Africa, powered by Claude AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
