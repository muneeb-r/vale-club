import { Icon } from "@iconify/react";

interface CategoryIconProps {
  icon: string; // Iconify name e.g. "mdi:home"
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 36,
};

export default function CategoryIcon({ icon, size = "md", className = "" }: CategoryIconProps) {
  if (!icon) return <span>🏢</span>;

  // Iconify icons use "collection:name" format
  if (icon.includes(":")) {
    return <Icon icon={icon} width={SIZE_MAP[size]} height={SIZE_MAP[size]} className={className} />;
  }

  // CSS class icon (e.g. custom icon font)
  return <i className={`${icon} ${className}`} style={{ fontSize: SIZE_MAP[size] }} aria-hidden="true" />;
}
