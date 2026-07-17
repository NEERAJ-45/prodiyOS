"use client";

import { cn } from "@/lib/utils";
import React from "react";

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) {
  return (
    <div className={cn("rounded-lg", containerClassName)}>
      <div className={cn("rounded-lg bg-[#0a0a0a]", className)}>
        {children}
      </div>
    </div>
  );
}
