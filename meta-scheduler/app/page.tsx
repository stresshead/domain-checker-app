import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    auth_denied: "Facebook login was cancelled.",
    invalid_state: "Login request was invalid. Please try again.",
    auth_failed: "Login failed. Please try again.",
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold">Meta Group Scheduler</h1>
          <p className="mt-2 text-gray-600">
            Schedule posts to your Facebook groups ahead of time.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessages[error] ?? "An error occurred."}
          </div>
        )}

        <a
          href="/api/auth"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continue with Facebook
        </a>

        <p className="text-xs text-gray-500">
          Requires <code>publish_to_groups</code> permission on your Meta App.
        </p>
      </div>
    </main>
  );
}
