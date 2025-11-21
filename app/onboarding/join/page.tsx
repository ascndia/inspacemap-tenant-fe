"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OnboardingJoinPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mock_orgs");
    setOrgs(stored ? JSON.parse(stored) : []);
  }, []);

  const handleJoin = (orgId: string) => {
    // Mock joining: just set active_org_id
    localStorage.setItem("active_org_id", orgId);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-4">
        Join an existing organization
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Select an organization to join from the list below.
      </p>

      {orgs.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No organizations available to join. You can{" "}
          <Link href="/onboarding/organization" className="underline">
            create one
          </Link>{" "}
          instead.
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div>
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-muted-foreground">{o.slug}</div>
              </div>
              <div>
                <Button onClick={() => handleJoin(o.id)}>Join</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
