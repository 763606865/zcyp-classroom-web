import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { Card } from "@/components/ui/card";
import type { CourseCard } from "@/entities/classroom";
import { formatPrice, trainingTypeLabels } from "@/features/classroom/labels";

function durationText(minutes?: number | null) {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} 小时`;
}

export function CourseCardItem({ course }: { course: CourseCard }) {
  const duration = durationText(course.duration_minutes);
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <CoverImage src={course.cover} alt="" className="h-40 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{trainingTypeLabels[course.type] ?? course.type}</span>
          {course.is_featured ? <span className="text-primary">推荐</span> : null}
          {course.lesson_count ? <span>· {course.lesson_count} 课时</span> : null}
          {duration ? <span>· {duration}</span> : null}
        </div>
        <h3 className="text-lg font-semibold leading-snug">{course.title}</h3>
        {course.summary ? <p className="line-clamp-2 text-sm text-muted-foreground">{course.summary}</p> : null}
        {course.teacher ? (
          <p className="text-sm text-muted-foreground">{[course.teacher.name, course.teacher.title].filter(Boolean).join(" · ")}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-3 text-sm">
          <span className="font-medium text-primary">{formatPrice(course.is_free, course.price)}</span>
          <Link href={`/consult?source=hot-course&course=${course.id}`} className="text-sm font-medium text-primary">咨询课程</Link>
        </div>
      </div>
    </Card>
  );
}
