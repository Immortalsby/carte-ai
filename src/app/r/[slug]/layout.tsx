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
    french: "#1d4ed8",
    italian: "#ea580c",
    chinese: "#dc2626",
    japanese: "#7c3aed",
    japanese_fusion: "#8b5cf6",
    korean: "#2563eb",
    thai: "#059669",
    vietnamese: "#16a34a",
    indian: "#d97706",
    lebanese: "#16a34a",
    moroccan: "#ea580c",
    turkish: "#dc2626",
    greek: "#2563eb",
    spanish: "#dc2626",
    mexican: "#e11d48",
    brazilian: "#16a34a",
    peruvian: "#7c3aed",
    caribbean: "#0d9488",
    african: "#b45309",
    mediterranean: "#0891b2",
    american: "#b45309",
    fusion: "#7c3aed",
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
