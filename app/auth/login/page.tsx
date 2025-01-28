import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignInForm from "./SignInForm";

export default async function LoginPage() {
  const session = await auth();

  // Redirect to home if already signed in
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
