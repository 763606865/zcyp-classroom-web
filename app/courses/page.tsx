import type { Metadata } from "next";
import { HotCoursesView } from "@/features/classroom/hot-courses";

export const metadata: Metadata = {
  title: "热门课程",
};

export default function HotCoursesPage() {
  return <HotCoursesView />;
}
