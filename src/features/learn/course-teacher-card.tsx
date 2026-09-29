"use client";

import { useToast } from "@/components/ui/toast";
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
  const { toast } = useToast();
  const teacher = teachers[0];

  return (
    <div className="rounded-lg bg-white" style={{ padding: "16px 16px 18px" }}>
      {!teacher ? (
        <p style={{ fontSize: 14, color: "#999" }}>师资介绍即将公布</p>
      ) : (
        <div className="flex items-center gap-3">
          <Avatar name={teacher.name} src={teacher.avatar} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium" style={{ fontSize: 16, color: "#222" }}>
              {teacher.name}
            </p>
            <p className="mt-1 truncate" style={{ fontSize: 14, color: "#555" }}>
              主讲老师
            </p>
          </div>
          <button
            type="button"
            className="flex-shrink-0 rounded transition hover:opacity-80"
            style={{ padding: "5px 14px", fontSize: 14, color: "#0F62FE", border: "1px solid #0F62FE" }}
            onClick={() => toast({ title: "功能开发中", description: "关注能力即将上线，敬请期待" })}
          >
            + 关注
          </button>
        </div>
      )}
    </div>
  );
}
