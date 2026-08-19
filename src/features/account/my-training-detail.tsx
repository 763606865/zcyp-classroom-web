"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { MyCourse, MyTraining, Order, TrainingDetail } from "@/entities/classroom";
import { useAuth } from "@/features/auth/auth-provider";
import { getTraining } from "@/features/classroom/api";
import { formatAmount, formatDateTime, payChannelLabel, statusLabel, trainingTypeLabels } from "@/features/classroom/labels";
import { getOrder, payOrder } from "@/features/orders/api";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyCourses, getMyTrainings } from "./api";

export function MyTrainingDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const { toast } = useToast();
  const [enrollment, setEnrollment] = useState<MyTraining>();
  const [training, setTraining] = useState<TrainingDetail>();
  const [order, setOrder] = useState<Order>();
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=/account/trainings/${encodeURIComponent(slug)}`);
  }, [router, slug, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [listResult, trainingResult, coursesResult] = await Promise.allSettled([
            getMyTrainings(),
            getTraining(slug),
            getMyCourses(),
          ]);

          const mine = listResult.status === "fulfilled"
            ? listResult.value.data.data.find((item) => item.training.slug === slug)
            : undefined;
          if (!cancelled) setEnrollment(mine);

          if (trainingResult.status === "fulfilled" && !cancelled) setTraining(trainingResult.value.data);

          const mineCourses = coursesResult.status === "fulfilled" ? coursesResult.value.data.data : [];
          const relatedIds = new Set(
            (trainingResult.status === "fulfilled" ? trainingResult.value.data.courses ?? [] : []).map((item) => item.id),
          );
          if (!cancelled) {
            setCourses(relatedIds.size > 0 ? mineCourses.filter((item) => relatedIds.has(item.course.id)) : mineCourses.filter((item) => item.source === "training"));
          }

          if (mine?.order_no) {
            const orderResult = await getOrder(mine.order_no);
            if (!cancelled) setOrder(orderResult.data);
          }

          if (!mine && trainingResult.status !== "fulfilled") {
            if (!cancelled) setError("未找到该培训报名记录");
          }
        } catch (err) {
          if (!cancelled) setError(getApiErrorMessage(err, "培训详情加载失败"));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, status]);

  async function continuePay() {
    if (!order?.order_no) return;
    setPaying(true);
    try {
      const result = await payOrder(order.order_no, "mock");
      setOrder({ ...order, ...result.data.order, status: result.data.order.status });
      toast({ title: "支付成功", description: result.data.pay?.message ?? "订单已支付，培训已开通。" });
      const list = await getMyTrainings();
      setEnrollment(list.data.data.find((item) => item.training.slug === slug));
    } catch (err) {
      toast({ title: "支付失败", description: getApiErrorMessage(err) });
    } finally {
      setPaying(false);
    }
  }

  if (status === "loading" || status === "anonymous" || loading) {
    return <div className="flex justify-center py-20"><Spinner label="加载我的培训" /></div>;
  }

  if (error && !enrollment && !training) {
    return <EmptyState title="无法打开培训详情" description={error} action={<Link href="/account" className="text-sm text-primary">返回个人中心</Link>} />;
  }

  const title = training?.title ?? enrollment?.training.title ?? "我的培训";
  const cover = training?.cover ?? enrollment?.training.cover;
  const type = training?.type ?? enrollment?.training.type;

  return (
    <article className="grid gap-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-primary">个人中心</Link>
        <span> / 我的培训 / {title}</span>
      </p>

      <CoverImage src={cover} alt="" className="h-56 w-full rounded-2xl" />
      <div>
        <p className="text-sm text-muted-foreground">
          {trainingTypeLabels[type ?? ""] ?? type}
          {training?.category ? ` · ${training.category.name}` : enrollment?.training.category ? ` · ${enrollment.training.category.name}` : ""}
          {training?.location ? ` · ${training.location}` : ""}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        {training?.summary ? <p className="mt-3 text-muted-foreground">{training.summary}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">报名信息</h2>
          {enrollment ? (
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">报名状态</dt><dd>{statusLabel(enrollment.status)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">报名时间</dt><dd>{formatDateTime(enrollment.enrolled_at)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">完成时间</dt><dd>{enrollment.completed_at ? formatDateTime(enrollment.completed_at) : "尚未完成"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">实付金额</dt><dd>{formatAmount(enrollment.paid_amount)}</dd></div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">未找到报名记录。</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">订单信息</h2>
          {order ? (
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">订单号</dt><dd className="break-all">{order.order_no}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">订单状态</dt><dd>{statusLabel(order.status)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">订单金额</dt><dd>{formatAmount(order.amount)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">已支付</dt><dd>{formatAmount(order.paid_amount)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">支付渠道</dt><dd>{payChannelLabel(order.channel)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">支付时间</dt><dd>{order.paid_at ? formatDateTime(order.paid_at) : "未支付"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">下单时间</dt><dd>{formatDateTime(order.created_at)}</dd></div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{enrollment?.order_no ? "订单加载失败" : "暂无关联订单"}</p>
          )}
          {order?.status === "pending" ? (
            <Button className="mt-5 w-full" variant="accent" loading={paying} onClick={() => void continuePay()}>继续支付</Button>
          ) : null}
        </Card>
      </div>

      {training?.courses && training.courses.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-semibold">包含课程</h2>
          <div className="grid gap-3">
            {training.courses.map((course) => {
              const mine = courses.find((item) => item.course.id === course.id);
              return (
                <Card key={course.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {mine ? (
                      <Link href={`/account/courses/${course.id}`} className="font-medium hover:text-primary">{course.title}</Link>
                    ) : (
                      <p className="font-medium">{course.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {course.lesson_count != null ? `${course.lesson_count} 课时` : "课时待定"}
                      {mine ? ` · 进度 ${mine.progress ?? 0}%` : ""}
                    </p>
                  </div>
                  {mine ? (
                    <Link href={`/account/courses/${course.id}`} className="text-sm text-primary">去上课</Link>
                  ) : (
                    <span className="text-sm">待开通</span>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {training?.teachers && training.teachers.length > 0 ? (
        <section>
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

      {training?.description ? (
        <section>
          <h2 className="mb-4 text-xl font-semibold">培训介绍</h2>
          <div className="prose max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: training.description }} />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/account"><Button variant="secondary">返回个人中心</Button></Link>
        <Link href={`/trainings/${slug}`}><Button variant="secondary">查看公开介绍</Button></Link>
      </div>
    </article>
  );
}
