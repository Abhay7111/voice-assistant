import { useState, useEffect } from 'react';

export const useTheme = () => {
  // LocalStorage या System Preference से शुरुआती वैल्यू लें
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // इन चीजों को एक्सपोर्ट करें ताकि दूसरी फाइल्स में यूज़ हो सकें
  return { isDark, toggleTheme };
};