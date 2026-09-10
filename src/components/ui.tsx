import { Fence } from "lucide-react";
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function HorsePortrait({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  return (
    <div
      className={"horse-portrait " + (large ? "large" : "")}
      role="img"
      aria-label={name + " photo placeholder"}
    >
      <Fence size={large ? 62 : 42} strokeWidth={1} />
      <span>{name}</span>
      <small>Photo to be added</small>
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
