// app/eisenhower-matrix/login/page.tsx
import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <LoginForm
      apiEndpoint="/api/eisenhower-matrix/login"
      redirectPath="/eisenhower-matrix"
      cookieName="matrix-auth"
      title="Eisenhower Matrix Login"
      subtitle="Enter your password to manage your tasks"
    />
  );
}
