import { cn } from "@/lib/utils/cn";

export function CoverImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted text-sm text-muted-foreground", className)}
        aria-hidden
      >
        暂无封面
      </div>
    );
  }

  return (
    // 封面来自后端存储域名，使用原生 img 避免逐一配置远程白名单。
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={cn("object-cover", className)} />
  );
}
