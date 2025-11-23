"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authService } from "@/lib/services/auth-service";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agreed) return setError("You must agree to the Terms of Service.");
    if (!fullName || !email || !password || !organizationName)
      return setError("Please fill all fields.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const response = await authService.register({
        full_name: fullName,
        email,
        password,
        organization_name: organizationName,
      });

      login(response.access_token, response.user);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "Failed to register";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <form onSubmit={handleSubmit} className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to get started
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Your Company Name"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(v: any) => setAgreed(Boolean(v))}
                required
                disabled={loading}
              />
              <Label htmlFor="terms" className="text-sm font-normal">
                I agree to the{" "}
                <Link href="/terms" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </form>
      </div>

      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
          <div className="space-y-4 max-w-lg">
            <h2 className="text-4xl font-bold tracking-tight">
              Focus on your space, not setup
            </h2>
            <p className="text-lg text-muted-foreground">
              Start mapping your venues today. After sign up you'll be guided to
              create or join an organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
