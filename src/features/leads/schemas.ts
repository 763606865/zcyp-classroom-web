import { z } from "zod";

export const consultSchema = z.object({
  name: z.string().trim().min(2, "请填写 2～50 个字符的姓名").max(50, "请填写 2～50 个字符的姓名"),
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入正确的中国大陆手机号"),
  city: z.string().trim().min(2, "请填写 2～100 个字符的城市").max(100, "请填写 2～100 个字符的城市"),
  courseKey: z.string().min(1, "请选择或填写意向课程"),
  intended_course: z.string().trim().max(255, "意向课程不超过 255 个字符").optional(),
  source: z.string().trim().max(50).optional(),
}).superRefine((values, context) => {
  if (values.courseKey === "custom" && !values.intended_course) {
    context.addIssue({
      code: "custom",
      path: ["intended_course"],
      message: "请填写意向课程",
    });
  }
});

export type ConsultValues = z.infer<typeof consultSchema>;
