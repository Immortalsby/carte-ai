import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/queries/tenants";

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) notFound();

  // Inject cuisine theme color via CSS variable
  const cuisineColors: Record<string, string> = {
    chinese: "#dc2626",
    japanese: "#7c3aed",
    japanese_fusion: "#8b5cf6",
    italian: "#ea580c",
    french: "#1d4ed8",
    indian: "#d97706",
    thai: "#059669",
    mexican: "#e11d48",
    korean: "#2563eb",
    vietnamese: "#16a34a",
    mediterranean: "#0891b2",
    american: "#b45309",
    other: "#6b7280",
    default: "#10b981",
  };

  const themeColor =
    cuisineColors[tenant.cuisine_type ?? "default"] ?? cuisineColors.default;

  return (
    <div
      className="min-h-screen"
      style={{ "--cuisine-color": themeColor } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
