import { SiteHeader } from "@/components/layout/SiteHeader";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <SignupForm />
      </main>
    </>
  );
}
