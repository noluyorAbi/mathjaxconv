import Head from 'next/head';
import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Head>
        <link rel="prefetch" href="/eisenhower-matrix" />
        <link rel="preload" href="/eisenhower-matrix" as="document" />
      </Head>
      <LoginForm
        apiEndpoint="/api/eisenhower-matrix/login"
        redirectPath="/eisenhower-matrix"
        cookieName="matrix-auth"
        title="Eisenhower Matrix Login"
        subtitle="Enter your password to manage your tasks"
      />
    </>
  );
}
