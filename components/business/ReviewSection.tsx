"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ReviewForm from "@/components/forms/ReviewForm";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { X } from "lucide-react";

interface ReviewSectionProps {
  businessId: string;
  canReview: boolean;
  loginMessage: string;
}

export default function ReviewSection({
  businessId,
  canReview,
  loginMessage,
}: ReviewSectionProps) {
  const t = useTranslations("reviews");
  const [open, setOpen] = useState(false);

  if (!canReview) {
    return (
      <p className="text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3">
        {loginMessage}
      </p>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-full bg-primary text-primary-foreground"
      >
        {t("write_review")}
      </Button>

      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="border-b border-border px-5 py-4 flex flex-row items-center justify-between gap-4 shrink-0">
            <DrawerTitle>{t("write_review")}</DrawerTitle>
            <DrawerClose asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="max-w-3xl mx-auto">
              <ReviewForm
                businessId={businessId}
                onSuccess={() => setOpen(false)}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
