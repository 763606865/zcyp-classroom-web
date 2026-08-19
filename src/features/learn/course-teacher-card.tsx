"use client";

import { Card } from "@/components/ui/card";
import type { Teacher } from "@/entities/classroom";

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      // 头像来自后端存储域名
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="size-12 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name.slice(0, 1)}
    </div>
  );
}

export function CourseTeacherCard({ teachers }: { teachers: Teacher[] }) {
  const list = teachers.length > 0 ? teachers : [];

  return (
    <Card className="flex h-full min-h-0 flex-col justify-center p-4">
      <p className="text-xs font-medium text-muted-foreground">主讲老师</p>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">师资介绍即将公布</p>
      ) : (
        <div className="mt-2 grid gap-3">
          {list.slice(0, 2).map((teacher) => (
            <div key={teacher.id} className="flex gap-3">
              <Avatar name={teacher.name} src={teacher.avatar} />
              <div className="min-w-0">
                <p className="font-semibold leading-5">{teacher.name}</p>
                <p className="mt-0.5 truncate text-xs text-primary">
                  {[teacher.title, teacher.organization].filter(Boolean).join(" · ") || "讲师"}
                </p>
                {teacher.expertise ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{teacher.expertise}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
