'use client';


export const ThemeStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    :root {
      --bg: #09090b;
      --bg-secondary: #000000;
      --card: rgba(24, 24, 27, 0.85);
      --card-solid: #18181b;
      --card-muted: rgba(39, 39, 42, 0.5);
      --text: #f4f4f5;
      --text-secondary: #d4d4d8;
      --text-muted: #a1a1aa;
      --border: #27272a;
      --border-hover: #3f3f46;
      --primary: #FF8C00;
      --primary-hover: #ea580c;
      --primary-muted: rgba(255, 140, 0, 0.15);
      --hover-bg: rgba(255, 255, 255, 0.05);
      --shadow-color: rgba(0, 0, 0, 0.3);
      --danger: #ef4444;
      --danger-muted: rgba(239, 68, 68, 0.1);
      --success: #22c55e;
      --success-muted: rgba(34, 197, 94, 0.1);
      --info: #3b82f6;
      --info-muted: rgba(59, 130, 246, 0.1);
    }
    
    .light-theme {
      --bg: #F8F9FA;
      --bg-secondary: #E9ECEF;
      --card: rgba(255, 255, 255, 0.9);
      --card-solid: #FFFFFF;
      --card-muted: rgba(248, 249, 250, 0.8);
      --text: #212529;
      --text-secondary: #495057;
      --text-muted: #868E96;
      --border: #DEE2E6;
      --border-hover: #CED4DA;
      --primary: #FF8C00;
      --primary-hover: #ea580c;
      --primary-muted: rgba(255, 140, 0, 0.1);
      --hover-bg: rgba(0, 0, 0, 0.04);
      --shadow-color: rgba(0, 0, 0, 0.06);
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      transition: background-color 0.4s ease, color 0.4s ease;
    }

    .app-drag-region { -webkit-app-region: drag; user-select: none; }
    .app-no-drag { -webkit-app-region: no-drag; }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 10px; }
    
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .flip-card .card-inner { transform: rotateY(180deg); }
    
    @keyframes float { 
      0%, 100% { transform: translateY(0px); } 
      50% { transform: translateY(-8px); } 
    }
    
    @keyframes subtleGlow { 
      0%, 100% { opacity: 0.3; transform: scale(0.9); filter: blur(30px); } 
      50% { opacity: 0.6; transform: scale(1.1); filter: blur(40px); } 
    }
    
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-subtle-glow { animation: subtleGlow 4s ease-in-out infinite; }

    @keyframes eq { 
      0% { height: 4px; } 
      50% { height: 16px; } 
      100% { height: 4px; } 
    }
    .animate-eq-1 { animation: eq 0.8s ease-in-out infinite; }
    .animate-eq-2 { animation: eq 1.2s ease-in-out infinite 0.2s; }
    .animate-eq-3 { animation: eq 0.9s ease-in-out infinite 0.4s; }
    
    @keyframes blob { 
      0% { transform: translate(0px, 0px) scale(1); } 
      33% { transform: translate(30px, -50px) scale(1.1); } 
      66% { transform: translate(-20px, 20px) scale(0.9); } 
      100% { transform: translate(0px, 0px) scale(1); } 
    }
    .animate-blob { animation: blob 10s infinite alternate; }
    .animation-delay-2000 { animation-delay: 2s; }
    
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    
    @keyframes taskComplete {
      0% { transform: scale(1); opacity: 1; }
      40% { transform: scale(1.05); opacity: 1; color: var(--success); }
      100% { transform: translateX(50px) scale(0.9); opacity: 0; filter: blur(2px); }
    }
    .animate-todo-complete { animation: taskComplete 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; pointer-events: none; }
  `}} />
);
