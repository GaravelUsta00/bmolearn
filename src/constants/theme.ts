// CSS token'larının (src/app/globals.css) CSS değişkeni kullanılamayan yerler için
// kopyası: <meta name="theme-color">, PWA manifest. globals.css ile senkron tutulmalı.
export const THEME_COLORS = {
  light: { paper: '#E8E6DD', page: '#F4F2EB', ink: '#26231F', ribbon: '#8F2D2D' },
  dark: { paper: '#141210', page: '#1D1A17', ink: '#ECE6DA', ribbon: '#D2604A' },
} as const;

export const THEME_STORAGE_KEY = 'bmo_theme';

// <head> içinde, ilk boyamadan önce çalışır (FOUC önleme). Kayıtlı seçim yoksa
// işletim sistemi tercihi kullanılır; tercih kaydedilmez (kullanıcı seçene kadar OS'u izler).
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}var d=document.documentElement;d.setAttribute('data-theme',t);d.style.colorScheme=t}catch(e){}})()`;
