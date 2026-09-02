import type { Metadata } from "next";
import { ClassSchedulesView } from "@/features/classroom/class-schedules";

export const metadata: Metadata = {
  title: "开班计划",
};

export default function SchedulePage() {
  return <ClassSchedulesView />;
}
