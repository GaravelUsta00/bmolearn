interface LogoProps {
  className?: string;
}

// Metin logo: "Be" düz, marka bordosu + "Learn" italik, mürekkep (docs/DESIGN.md §5).
export const Logo = ({ className = '' }: LogoProps) => (
  <span className={`font-serif text-ink tracking-tight ${className}`} translate="no">
    <span className="text-brand">Be</span>
    <em className="italic">Learn</em>
  </span>
);
