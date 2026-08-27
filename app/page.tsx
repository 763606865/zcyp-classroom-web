import { Suspense } from "react";
import { ClassroomHomeView } from "@/features/classroom/home-page";
import { EcosystemTicketSync } from "@/features/auth/ecosystem-ticket-sync";

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={null}>
        <EcosystemTicketSync />
      </Suspense>
      <ClassroomHomeView />
    </main>
  );
}
