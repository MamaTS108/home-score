import { SiteHeader } from "@/components/layout/SiteHeader";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <ResetPasswordForm />
      </main>
    </>
  );
}
