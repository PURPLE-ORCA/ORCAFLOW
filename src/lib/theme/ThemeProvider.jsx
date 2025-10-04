"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}