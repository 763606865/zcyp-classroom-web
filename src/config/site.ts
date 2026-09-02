export const siteConfig = {
  name: "中测培训",
  description: "面向计量与检测从业者的在线培训平台，提供公开课、线下班和混合式培训。",
  nav: [
    { href: "/", label: "首页" },
    { label: "中测易聘", ecosystem: true },
    { href: "/courses", label: "热门课程" },
    { href: "/schedule", label: "开班计划" },
    { href: "/teachers", label: "师资力量" },
    { href: "/consult", label: "课程咨询" },
    { href: "/trainings", label: "培训项目" },
    { href: "/account", label: "个人中心" },
  ],
} as const;
