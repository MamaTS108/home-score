import { SiteHeader } from "@/components/layout/SiteHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <ForgotPasswordForm />
      </main>
    </>
  );
}
