import { Link } from "@/lib/navigation";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { catName } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  nameEn: string;
  nameCa?: string;
  icon: string;
  slug: string;
}

interface CategoryGridProps {
  categories: Category[];
  locale: string;
}

export default function CategoryGrid({ categories, locale }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat._id}
          href={(cat.slug === "vale-shop" ? "/shop" : "/search?category=" + cat._id) as "/search"}
          className="group"
        >
          <div className="bg-card rounded-2xl p-4 flex flex-col items-center gap-2 border border-border hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer">
            <CategoryIcon icon={cat.icon} size="lg" className="text-foreground" />
            <span className="text-sm font-medium text-foreground text-center leading-tight group-hover:text-primary transition-colors">
              {catName(cat, locale)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
