import { cn } from "@/lib/utils";

export function Card({ children, className }) {
  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }) {
  return (
    <div className="px-6 py-4 border-b border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}
