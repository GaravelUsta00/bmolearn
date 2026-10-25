// Çalışma ekranı paketi (P3). Landing'de kullanıcı bir şeye odaklanınca ya da imleci üzerine getirince
// önceden indirilir: ilk boyamayı yavaşlatmaz, "Aç"a basıldığında da çoğu zaman hazırdır.
let started: Promise<unknown> | null = null;

export const loadStudyScreen = () => import('@/components/layout/StudyScreen');

export const preloadStudyScreen = () => {
  started ??= loadStudyScreen();
};
