export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 rounded-lg shadow-lg bg-background dark:bg-background-dark border border-primary/10 dark:border-accent-dark/10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-foreground/70 dark:text-foreground-dark/70">
            A sign in link has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}
