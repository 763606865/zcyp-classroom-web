"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { TrainingDetail } from "@/entities/classroom";
import { useAuth } from "@/features/auth/auth-provider";
import { createTrainingOrder, payOrder } from "@/features/orders/api";
import { getApiErrorMessage } from "@/lib/forms";
import { getTraining } from "./api";
import { formatDateTime, formatPrice, trainingTypeLabels } from "./labels";

export function TrainingDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const { toast } = useToast();
  const [training, setTraining] = useState<TrainingDetail>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getTraining(slug)
      .then((result) => {
        if (!cancelled) setTraining(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "培训详情加载失败"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function enroll() {
    if (status !== "authenticated") {
      router.push(`/login?next=/trainings/${encodeURIComponent(slug)}`);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTrainingOrder(slug, "auto");
      if (!created.data.paid) {
        await payOrder(created.data.order.order_no, "mock");
      }
      toast({ title: "报名成功", description: "可在个人中心查看我的培训。" });
      const refreshed = await getTraining(slug);
      setTraining(refreshed.data);
    } catch (err) {
      toast({ title: "报名失败", description: getApiErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner label="加载培训详情" /></div>;
  }

  if (error || !training) {
    return <EmptyState title="培训不存在或未上架" description={error} />;
  }

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <CoverImage src={training.cover} alt="" className="mb-6 h-64 w-full rounded-2xl" />
        <p className="text-sm text-muted-foreground">
          {trainingTypeLabels[training.type] ?? training.type}
          {training.category ? ` · ${training.category.name}` : ""}
          {training.location ? ` · ${training.location}` : ""}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{training.title}</h1>
        {training.summary ? <p className="mt-4 text-lg text-muted-foreground">{training.summary}</p> : null}
        {training.description ? (
          <div className="prose mt-8 max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: training.description }} />
        ) : null}
        {training.teachers && training.teachers.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">授课老师</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {training.teachers.map((teacher) => (
                <Card key={teacher.id}>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[teacher.title, teacher.organization, teacher.expertise].filter(Boolean).join(" · ")}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
        {training.courses && training.courses.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">包含课程</h2>
            <div className="grid gap-3">
              {training.courses.map((course) => (
                <Card key={course.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.lesson_count != null ? `${course.lesson_count} 课时` : "课时待定"}
                      {course.teacher ? ` · ${course.teacher.name}` : ""}
                    </p>
                  </div>
                  <span className="text-sm">{formatPrice(course.is_free, course.price)}</span>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <aside>
        <Card className="sticky top-24 grid gap-4">
          <p className="text-2xl font-semibold text-primary">{formatPrice(training.is_free, training.price)}</p>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">开班时间</dt><dd>{formatDateTime(training.start_at)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">结束时间</dt><dd>{formatDateTime(training.end_at)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">报名人数</dt><dd>{training.enroll_count ?? 0}{training.max_students ? ` / ${training.max_students}` : ""}</dd></div>
          </dl>
          {training.enrolled ? <Alert>你已报名该培训</Alert> : null}
          <Button loading={submitting} disabled={training.enrolled} onClick={() => void enroll()}>
            {training.enrolled ? "已报名" : status === "authenticated" ? "立即报名" : "登录后报名"}
          </Button>
        </Card>
      </aside>
    </article>
  );
}
