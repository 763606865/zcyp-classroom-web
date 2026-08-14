import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { Card } from "@/components/ui/card";
import type { TrainingCard } from "@/entities/classroom";
import { formatPrice, trainingTypeLabels } from "@/features/classroom/labels";

export function TrainingCardItem({ training }: { training: TrainingCard }) {
  return (
    <Link href={`/trainings/${training.slug}`} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:border-primary">
        <CoverImage src={training.cover} alt="" className="h-40 w-full" />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{trainingTypeLabels[training.type] ?? training.type}</span>
            {training.category ? <span>· {training.category.name}</span> : null}
            {training.location ? <span>· {training.location}</span> : null}
          </div>
          <h3 className="text-lg font-semibold leading-snug">{training.title}</h3>
          {training.summary ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{training.summary}</p>
          ) : null}
          <div className="mt-auto flex items-center justify-between pt-3 text-sm">
            <span className="font-medium text-primary">{formatPrice(training.is_free, training.price)}</span>
            {training.enroll_count != null ? (
              <span className="text-muted-foreground">{training.enroll_count} 人已报名</span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
