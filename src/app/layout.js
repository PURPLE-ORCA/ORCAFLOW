import "./globals.css";

export const metadata = {
  title: "ORCAFLOW",
  description: "A minimal, modern web app for small team project management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
