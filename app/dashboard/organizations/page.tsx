import { mockOrganizations } from "@/lib/api";
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

export default function OrganizationPage() {
  // In a real app, we'd fetch the current user's organization
  const org = mockOrganizations[0];

  return (
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
          <GeneralSettings organization={org} />
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
  );
}
