"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createOrganizationUser, getRoles } from "@/lib/api";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberCreated: () => void;
}

export default function CreateMemberDialog({
  open,
  onOpenChange,
  onMemberCreated,
}: CreateMemberDialogProps) {
  const { getCurrentOrg } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const currentOrg = getCurrentOrg();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const rolesData = await getRoles();
      const rolesArray = Array.isArray(rolesData)
        ? rolesData
        : (rolesData as any)?.data || [];
      setRoles(rolesArray);
    } catch (error) {
      console.error("Failed to load roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !password || !roleId || !currentOrg) return;

    setIsSubmitting(true);
    try {
      await createOrganizationUser(currentOrg.organization_id, {
        full_name: fullName,
        email,
        password,
        role_id: roleId,
      });

      toast.success("Member created successfully");
      onOpenChange(false);
      onMemberCreated();

      // Reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setRoleId("");
    } catch (error: any) {
      console.error("Failed to create member:", error);
      const message =
        error.response?.data?.message || "Failed to create member";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFullName("");
      setEmail("");
      setPassword("");
      setRoleId("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Create a new user account for your organization. They will receive
            login credentials via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={roleId}
              onValueChange={setRoleId}
              disabled={loadingRoles}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingRoles ? "Loading roles..." : "Select a role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !fullName ||
              !email ||
              !password ||
              !roleId ||
              isSubmitting ||
              loadingRoles
            }
          >
            {isSubmitting ? "Creating..." : "Create Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
