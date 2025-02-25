// app/stop-addic/login/page.tsx
import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <LoginForm
      apiEndpoint="/api/stop-addic/login"
      redirectPath="/stop-addic"
      cookieName="stop-addic-auth"
      title="Stop Addiction Login"
      subtitle="Enter your password to access the tracker"
    />
  );
}
