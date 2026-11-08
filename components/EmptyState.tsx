import Link from "next/link";
export function EmptyState({
  title,
  text,
  label = "Conoce la metodología",
  href = "/metodologia",
}: {
  title: string;
  text: string;
  label?: string;
  href?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">
        ↗
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="text-link" href={href}>
        {label} →
      </Link>
    </div>
  );
}
