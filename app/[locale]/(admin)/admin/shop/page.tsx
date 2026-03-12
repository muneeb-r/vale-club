import { connectDB } from "@/lib/db";
import { ShopService } from "@/models/ShopService";
import { ShopCategory } from "@/models/ShopCategory";
import ShopServiceManager from "@/components/admin/ShopServiceManager";

interface AdminShopPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  return { title: "Vale Shop — Admin" };
}

export default async function AdminShopPage({ params }: AdminShopPageProps) {
  await params;
  await connectDB();

  const [rawCategories, rawServices] = await Promise.all([
    ShopCategory.find({}).sort({ order: 1 }).lean(),
    ShopService.find({}).populate("category").sort({ order: 1 }).lean(),
  ]);

  const categories = JSON.parse(JSON.stringify(rawCategories));
  const services = JSON.parse(JSON.stringify(rawServices));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Vale Shop</h1>
      <ShopServiceManager categories={categories} services={services} />
    </div>
  );
}
