import type { Metadata } from "next";
import { TeachersListView } from "@/features/classroom/teachers-list";

export const metadata: Metadata = {
  title: "师资力量",
};

export default function TeachersPage() {
  return <TeachersListView />;
}
