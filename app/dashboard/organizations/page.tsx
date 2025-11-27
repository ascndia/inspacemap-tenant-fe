"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MembersTable } from "@/components/organizations/members-table";
import { GeneralSettings } from "@/components/organizations/general-settings";
import { RoleGuard } from "@/components/auth/role-guard";
import { InsufficientAuthority } from "@/components/auth/insufficient-authority";

export default function OrganizationPage() {
  const { getCurrentOrg } = useAuthStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const currentOrg = getCurrentOrg();

  const handleOrganizationUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Convert current org to the format expected by GeneralSettings
  const org = currentOrg
    ? {
        id: currentOrg.organization_id,
        name: currentOrg.name,
        slug: currentOrg.slug,
        type: "organization", // Default type
        members: [], // We'll get this from the members table
        status: "active",
        description: "",
        email: "",
        phone: "",
        address: "",
        logoURL: "",
        website: "",
        isActive: true,
      }
    : null;

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading organization...</p>
      </div>
    );
  }

  return (
    <RoleGuard
      role={["Owner", "Admin"]}
      fallback={
        <InsufficientAuthority
          title="Organization Management Access Required"
          description="Only organization owners and administrators can manage organization settings, members, and billing information."
          requiredRole={["Owner", "Admin"]}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">
            Organization Settings
          </h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings
              organization={org}
              onOrganizationUpdated={handleOrganizationUpdated}
              key={refreshKey}
            />
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle>Members</CardTitle>
                  <CardDescription>
                    Manage who has access to your organization.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <MembersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Plans</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Billing information would go here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
