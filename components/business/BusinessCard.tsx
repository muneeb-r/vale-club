import { Link } from "@/lib/navigation";
import { truncate, catName } from "@/lib/utils";
import { MapPin, Star, BadgeCheck, Zap } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface Category {
  name: string;
  nameEn: string;
  nameCa?: string;
  icon: string;
}

interface BusinessCardProps {
  business: {
    name: string;
    slug: string;
    gallery?: string[];
    description: string;
    rating: number;
    reviewCount: number;
    location: { city?: string };
    categories: Category[];
    plan?: "free" | "paid";
    featuredUntil?: string;
  };
  locale: string;
}

export default function BusinessCard({ business, locale }: BusinessCardProps) {
  const categoryName = business.categories[0]
    ? catName(business.categories[0], locale)
    : undefined;

  const grace = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isFeatured =
    business.plan === "paid" &&
    !!business.featuredUntil &&
    new Date(business.featuredUntil) > grace;

  // Cover: first gallery image or null
  const coverImage = business.gallery?.[0] ?? null;

  return (
    <Link href={("/empresa/" + business.slug) as `/empresa/${string}`}>
      <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">

        {/* Cover image — full width square */}
        <div className="aspect-square w-full bg-muted overflow-hidden relative">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CategoryIcon icon={business.categories[0]?.icon ?? ""} size="xl" className="text-muted-foreground/40" />
            </div>
          )}

          {/* Featured badge overlay */}
          {isFeatured && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-900 backdrop-blur-sm">
              <Zap className="w-3 h-3" />
              Destacado
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-heading font-semibold text-foreground text-sm leading-tight line-clamp-1 flex-1">
              {business.name}
            </h3>
            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          </div>

          {business.categories[0] && (
            <span className="text-xs bg-muted text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit">
              <CategoryIcon icon={business.categories[0].icon} size="sm" className="text-primary" />
              {categoryName}
            </span>
          )}

          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
            {truncate(business.description, 80)}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            {business.reviewCount > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {business.rating.toFixed(1)}
                <span className="text-muted-foreground/60">({business.reviewCount})</span>
              </span>
            ) : (
              <span />
            )}
            {business.location.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {business.location.city}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
