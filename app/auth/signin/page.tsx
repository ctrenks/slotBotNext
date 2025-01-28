import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignInButtons from "./SignInButtons";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 rounded-lg shadow-lg bg-background dark:bg-background-dark border border-primary/10 dark:border-accent-dark/10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Sign in to your account
          </h2>
        </div>
        <SignInButtons />
      </div>
    </div>
  );
}
