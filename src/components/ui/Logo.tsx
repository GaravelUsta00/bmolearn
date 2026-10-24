interface LogoProps {
  className?: string;
}

// Metin logo: "Be" düz + "Learn" italik (docs/DESIGN.md §5).
export const Logo = ({ className = '' }: LogoProps) => (
  <span className={`font-serif text-ink tracking-tight ${className}`} translate="no">
    Be<em className="italic">Learn</em>
  </span>
);
