"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/media/media-picker";
import Link from "next/link";

export default function OnboardingOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [logoId, setLogoId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !slug) return setError("Name and slug are required");

    setLoading(true);
    try {
      // Mock org creation: store in localStorage
      const stored = localStorage.getItem("mock_orgs");
      const orgs = stored ? JSON.parse(stored) : [];
      const newOrg = {
        id: Date.now().toString(),
        name,
        slug,
        website,
        logoId,
      };
      orgs.push(newOrg);
      localStorage.setItem("mock_orgs", JSON.stringify(orgs));
      // Set active org
      localStorage.setItem("active_org_id", newOrg.id);
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create your organization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This organization will contain your venues and members. You can also
          join an existing one.
        </p>
      </div>

      <form onSubmit={handleCreate} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="org-name">Name</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Inc."
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="org-slug">Slug</Label>
          <Input
            id="org-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-inc"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="org-website">Website</Label>
          <Input
            id="org-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div>
          <Label>Logo (choose from media)</Label>
          <div className="mt-2">
            <MediaPicker
              onSelect={(media: any) => setLogoId(media.id)}
              selectedMediaId={logoId}
              multiple={false}
              acceptTypes={["image"]}
            />
          </div>
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div className="flex gap-2 items-center">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create organization"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Skip for now
          </Button>
        </div>
      </form>

      <div className="mt-8 text-sm text-muted-foreground">
        Already have an organization?{" "}
        <Link href="/onboarding/join" className="underline">
          Join existing organization
        </Link>
      </div>
    </div>
  );
}
