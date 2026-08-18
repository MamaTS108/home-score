"use client";

import { useState } from "react";
import { RoomIllustration } from "./RoomIllustration";

export function PhotoOrIllustration({
  src,
  alt,
  variant,
}: {
  src: string;
  alt: string;
  variant: "before" | "after";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <RoomIllustration variant={variant} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
  );
}
