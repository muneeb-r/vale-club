"use client";

import { useRouter, usePathname } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import RadiusSlider from "@/components/business/RadiusSlider";
import { CityFilterInput } from "@/components/forms/PlacesAutocomplete";
import {
  SlidersHorizontal,
  Star,
  Zap,
  LocateFixed,
  Loader2,
  X,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { catName } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  nameEn: string;
  nameCa?: string;
  icon: string;
  parentCategory?: string;
}

interface BusinessFiltersProps {
  categories: {
    parents: Category[];
    subcategories: Category[];
  };
  locale: string;
}

export default function BusinessFilters({
  categories,
  locale,
}: BusinessFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("search");
  const [open, setOpen] = useState(false);
const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setSearchValue(searchParams.get("q") ?? "");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen, searchParams]);

  function submitSearch(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    setSearchOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  }

  const radius = parseInt(searchParams.get("radius") || "0");
  const hasCoords = !!searchParams.get("lat") && !!searchParams.get("lng");
  const hasCity = !!searchParams.get("city");
  const canUseRadius = hasCoords || hasCity;

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "0") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname],
  );

  const handleCityPlaceChange = useCallback(
    (city: string, lat: number, lng: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("city", city);
      params.set("lat", String(lat));
      params.set("lng", String(lng));
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname],
  );

  const handleCityChange = useCallback(
    (city: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (city) {
        params.set("city", city);
      } else {
        params.delete("city");
        params.delete("lat");
        params.delete("lng");
        params.delete("radius");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname],
  );

  const handleUseMyLocation = useCallback(() => {
    // Toggle: if GPS coords are already active (no city), clear them
    if (hasCoords && !hasCity) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("lat");
      params.delete("lng");
      params.delete("radius");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", String(latitude));
        params.set("lng", String(longitude));
        params.delete("city"); // clear city when using GPS
        if (!params.get("radius")) params.set("radius", "10"); // default 10km
        params.delete("page");
        setLocating(false);
        router.push(`${pathname}?${params.toString()}`);
      },
      () => {
        setLocating(false);
        setLocationError(true);
      },
      { timeout: 8000 },
    );
  }, [router, searchParams, pathname]);

  const handleRadiusCommit = useCallback(
    (km: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("radius", String(km));
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname],
  );

  // Count active filters (excluding q and page)
  const activeCount = [
    "category",
    "city",
    "radius",
    "minRating",
    "featured",
  ].filter((k) => searchParams.get(k)).length;

  const filterBody = (
    <div className="space-y-4 pt-4 md:pt-0">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("filter_category")}
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full rounded-xl h-9 text-sm border border-input bg-background px-3 flex items-center justify-between gap-2 hover:bg-accent/50 transition-colors"
            >
              <span className="truncate text-left">
                {(() => {
                  const sel = searchParams.get("category");
                  if (!sel) return t("all_categories");
                  const parent = categories.parents.find((p) => p._id === sel);
                  if (parent) return catName(parent, locale);
                  const sub = categories.subcategories.find((s) => s._id === sel);
                  return sub ? catName(sub, locale) : t("all_categories");
                })()}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem
              onSelect={() => updateFilter("category", "all")}
              className="flex items-center justify-between"
            >
              {t("all_categories")}
              {!searchParams.get("category") && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {categories.parents.map((parent) => {
              const subs = categories.subcategories.filter(
                (s) => s.parentCategory === parent._id,
              );
              const isParentSelected = searchParams.get("category") === parent._id;

              if (subs.length === 0) {
                return (
                  <DropdownMenuItem
                    key={parent._id}
                    onSelect={() => updateFilter("category", parent._id)}
                    className="flex items-center justify-between font-medium"
                  >
                    {catName(parent, locale)}
                    {isParentSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                );
              }

              return (
                <DropdownMenuSub key={parent._id}>
                  <DropdownMenuSubTrigger
                    className={`font-medium ${isParentSelected ? "text-primary" : ""}`}
                    onClick={() => updateFilter("category", parent._id)}
                  >
                    {catName(parent, locale)}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() => updateFilter("category", parent._id)}
                      className="flex items-center justify-between"
                    >
                      {t("all_in_category", { category: catName(parent, locale) })}
                      {isParentSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {subs.map((sub) => {
                      const isSubSelected = searchParams.get("category") === sub._id;
                      return (
                        <DropdownMenuItem
                          key={sub._id}
                          onSelect={() => updateFilter("category", sub._id)}
                          className="flex items-center justify-between"
                        >
                          {catName(sub, locale)}
                          {isSubSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Location: city input + GPS button */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("filter_city")}
        </Label>
        <div className="flex gap-2">
          <CityFilterInput
            value={searchParams.get("city") || ""}
            placeholder="Guatemala City..."
            className="flex-1 rounded-xl h-9 text-sm"
            onChange={handleCityChange}
            onPlaceChange={handleCityPlaceChange}
          />
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            title={t("use_my_location")}
            className={`h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center transition-colors ${
              hasCoords && !hasCity
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-muted hover:border-primary text-muted-foreground hover:text-foreground"
            }`}
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
          </button>
        </div>
        {locationError && (
          <p className="text-xs text-destructive">{t("location_denied")}</p>
        )}
      </div>

      {/* Radius slider — enabled once coords are available */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("filter_radius")}
        </Label>
        {canUseRadius ? (
          <RadiusSlider
            initialValue={radius || 10}
            onCommit={handleRadiusCommit}
          />
        ) : (
          <div className="space-y-2 opacity-40 pointer-events-none">
            <RadiusSlider initialValue={10} onCommit={() => {}} />
            <p className="text-xs text-muted-foreground opacity-100 pointer-events-auto">
              {t("radius_needs_city")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("filter_rating")}
        </Label>
        <Select
          defaultValue={searchParams.get("minRating") || "0"}
          onValueChange={(val) => updateFilter("minRating", val)}
        >
          <SelectTrigger className="w-full rounded-xl h-9 text-sm">
            <SelectValue placeholder={t("any_rating")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("any_rating")}</SelectItem>
            <SelectItem value="3">
              <span className="flex items-center gap-1.5">
                3+ <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </span>
            </SelectItem>
            <SelectItem value="4">
              <span className="flex items-center gap-1.5">
                4+ <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </span>
            </SelectItem>
            <SelectItem value="4.5">
              <span className="flex items-center gap-1.5">
                4.5+{" "}
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("filter_plan")}
        </Label>
        <Select
          defaultValue={searchParams.get("featured") || "all"}
          onValueChange={(val) => updateFilter("featured", val)}
        >
          <SelectTrigger className="w-full rounded-xl h-9 text-sm">
            <SelectValue placeholder={t("plan_all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("plan_all")}</SelectItem>
            <SelectItem value="1">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-500" />
                {t("plan_featured")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: drawer trigger button */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 px-4 h-10 rounded-full border border-border bg-card text-sm font-medium shadow-sm w-full">
          {/* Search icon — opens search dialog */}
          <button
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label={t("search_placeholder")}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-border shrink-0" />

          {/* Filters trigger — takes remaining space */}
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-between flex-1 min-w-0"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              {t("filters")}
              {activeCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {activeCount}
                </span>
              )}
            </span>
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search dialog */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="sm:max-w-md gap-0 p-4" showCloseButton={false}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch(searchValue);
                  if (e.key === "Escape") setSearchOpen(false);
                }}
                placeholder={t("search_placeholder")}
                className="w-full h-10 rounded-full border border-border bg-background pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setSearchOpen(false)}
                className="px-4 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => submitSearch(searchValue)}
                className="px-4 py-1.5 rounded-full text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {t("search_action")}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Drawer open={open} onOpenChange={setOpen} direction="bottom">
          <DrawerContent className="max-h-[85vh] flex flex-col">
            <DrawerHeader className="border-b border-border px-5 py-4 flex flex-row items-center justify-between gap-4 shrink-0">
              <DrawerTitle className="flex items-center gap-2">
                {t("filters")}
                {activeCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none">
                    {activeCount}
                  </span>
                )}
              </DrawerTitle>
              <DrawerClose asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </DrawerClose>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {filterBody}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: always-visible sidebar */}
      <div className="hidden md:block bg-card rounded-2xl p-4 border border-border sticky top-24">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-1">
          {t("filters")}
        </h3>
        {filterBody}
      </div>
    </>
  );
}
