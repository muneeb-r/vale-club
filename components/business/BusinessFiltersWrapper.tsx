import BusinessFilters from "./BusinessFilters";

interface Category {
  _id: string;
  name: string;
  nameEn: string;
  nameCa?: string;
  icon: string;
  parentCategory?: string;
}

interface BusinessFiltersWrapperProps {
  categories: {
    parents: Category[];
    subcategories: Category[];
  };
  locale: string;
}

// Wrapper that provides the Suspense boundary for BusinessFilters
// (BusinessFilters uses useSearchParams which needs Suspense)
export default function BusinessFiltersWrapper({
  categories,
  locale,
}: BusinessFiltersWrapperProps) {
  return (
    <BusinessFilters categories={categories} locale={locale} />
  );
}
