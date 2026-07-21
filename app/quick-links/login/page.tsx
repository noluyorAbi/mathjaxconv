import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <LoginForm
      apiEndpoint="/api/quick-links/login"
      redirectPath="/quick-links"
      cookieName="quicklinks-auth"
      title="Quick Links"
      subtitle="Enter PIN to access"
    />
  );
}
