"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCountdown } from "@/hooks";
import { applyApiFieldErrors, getApiErrorMessage } from "@/lib/forms";
import { isApiError } from "@/lib/http";
import { getClassroomHome } from "@/features/classroom/api";
import { createLead } from "./api";
import { consultSchema, type ConsultValues } from "./schemas";

export function ConsultForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const countdown = useCountdown();
  const [formError, setFormError] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const source = (searchParams.get("source") || "homepage").slice(0, 50);
  const presetCourse = searchParams.get("course")?.trim() ?? "";

  const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<ConsultValues>({
    resolver: zodResolver(consultSchema),
    defaultValues: {
      name: "",
      phone: "",
      city: "",
      courseKey: "custom",
      intended_course: presetCourse,
      source,
    },
  });

  useEffect(() => {
    let cancelled = false;
    void getClassroomHome()
      .then((result) => {
        if (cancelled) return;
        setCourses(result.data.featured_courses.map((course) => ({ id: course.id, title: course.title })));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    const body = values.courseKey !== "custom"
      ? { name: values.name, phone: values.phone, city: values.city, course_id: Number(values.courseKey), source: values.source }
      : { name: values.name, phone: values.phone, city: values.city, intended_course: values.intended_course, source: values.source };
    try {
      const result = await createLead(body);
      setSubmitted(true);
      toast({ title: "提交成功", description: result.data.message });
    } catch (error) {
      if (isApiError(error) && error.status === 429) {
        countdown.start(60);
        setFormError(getApiErrorMessage(error, "请求过于频繁，请稍后再试"));
        return;
      }
      if (!applyApiFieldErrors(error, setError)) setFormError(getApiErrorMessage(error, "提交失败，请稍后重试"));
    }
  });

  if (submitted) {
    return (
      <div className="py-6 text-center">
        <h2 className="text-xl font-semibold">咨询已提交</h2>
        <p className="mt-3 text-sm text-muted-foreground">我们会尽快与你联系，请保持手机畅通。</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 bg-white"
      noValidate
      style={{
        width: 656,
        maxHeight: 499,
        padding: "34px 37px 25px",
        borderRadius: 12,
        boxShadow: "1px 5px 12px 0px rgba(0,0,0,0.1)",
      }}
    >
      {formError ? <Alert>{formError}</Alert> : null}
      <div className="grid grid-cols-2 gap-5">
        <FormField id="name" label="姓名" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="请输入真实姓名" {...register("name")} />
        </FormField>
        <FormField id="phone" label="手机号" error={errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="请输入手机号" {...register("phone")} />
        </FormField>
      </div>
      <FormField id="city" label="所在城市" error={errors.city?.message}>
        <Input id="city" autoComplete="address-level2" placeholder="请选择" {...register("city")} />
      </FormField>
      <FormField id="courseKey" label="意向课程" error={errors.courseKey?.message}>
        <Controller
          name="courseKey"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="courseKey"><SelectValue placeholder="请选择" /></SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>{course.title}</SelectItem>
                ))}
                <SelectItem value="custom">其他 / 自行填写</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <FormField id="intended_course" label="课程名称(未选到列表课程是填写)" error={errors.intended_course?.message}>
        <Input id="intended_course" placeholder="请输入课程名称" {...register("intended_course")} />
      </FormField>
      <Button type="submit" variant="accent" className="w-full rounded-[20px] bg-[#0F62FE] text-white" loading={isSubmitting} disabled={countdown.isRunning}>
        {countdown.isRunning ? `${countdown.remaining}s 后可再提交` : "提交咨询"}
      </Button>
    </form>
  );
}
