import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata = {
  title: "ORCAFLOW",
  description: "A minimal, modern web app for small team project management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-white font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
