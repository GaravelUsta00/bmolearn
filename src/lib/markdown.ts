export const renderMarkdown = (text: string) => {
  const html = text
    .replace(/</g, "&lt;").replace(/>/g, "&gt;") 
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--primary); font-weight: bold;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: var(--text-muted); font-style: italic;">$1</em>')
    .replace(/^- (.*)$/gm, '<li style="margin-left: 1rem; list-style-type: disc; margin-bottom: 0.25rem;">$1</li>')
    .replace(/#{3}\s(.*)$/gm, '<h3 style="font-size: 1.125rem; font-weight: bold; color: var(--text); margin-top: 1rem; margin-bottom: 0.5rem;">$1</h3>')
    .replace(/#{2}\s(.*)$/gm, '<h2 style="font-size: 1.25rem; font-weight: bold; color: var(--primary); margin-top: 1.25rem; margin-bottom: 0.75rem;">$1</h2>')
    .replace(/#{1}\s(.*)$/gm, '<h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text); margin-top: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">$1</h1>')
    .replace(/\n/g, '<br />');
  return { __html: html };
};
