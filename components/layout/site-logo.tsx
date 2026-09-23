import Image from "next/image";
import Link from "next/link";
import { STORE_NAME, cn } from "@/lib/utils";

const LOGO_SRC = "/images/soyoung_logo.png";
const LOGO_WIDTH = 412;
const LOGO_HEIGHT = 92;

type Props = {
  href?: string;
  className?: string;
  /** Intrinsic height hint for Next/Image sizing (CSS can still scale). */
  height?: number;
  priority?: boolean;
};

export function SiteLogo({
  href = "/",
  className,
  height = 28,
  priority = false,
}: Props) {
  const width = Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT);

  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label={`${STORE_NAME} home`}
    >
      <Image
        src={LOGO_SRC}
        alt={STORE_NAME}
        width={width}
        height={height}
        className="h-6 md:h-7"
        style={{ width: "auto" }}
        priority={priority}
      />
    </Link>
  );
}
