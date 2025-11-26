"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Shield,
  Search,
  UserPlus,
  UserMinus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getOrganizationMembers, removeOrganizationMember } from "@/lib/api";
import { toast } from "sonner";
import CreateMemberDialog from "./create-member-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function MembersTable() {
  const { getCurrentOrg } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);

  const currentOrg = getCurrentOrg();

  useEffect(() => {
    if (currentOrg) {
      loadMembers();
    }
  }, [currentOrg]);

  const loadMembers = async () => {
    if (!currentOrg) return;

    try {
      setLoading(true);
      const membersData = await getOrganizationMembers(
        currentOrg.organization_id
      );
      // Handle both array and object responses
      const membersArray = Array.isArray(membersData)
        ? membersData
        : membersData?.data || [];
      setMembers(membersArray);
    } catch (error) {
      console.error("Failed to load members:", error);
      toast.error("Failed to load organization members");
    } finally {
      setLoading(false);
    }
  };

  // Filter members based on search and filters
  const filteredMembers = members.filter((member) => {
    const memberName = member.full_name || member.name || "";
    const memberEmail = member.email || "";
    const memberRole = member.role_name || member.role || "";

    const matchesSearch =
      memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memberEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      memberRole.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === "all"; // For now, assume all are active

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRemoveMember = (member: any) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !currentOrg) return;

    const memberId = memberToRemove.user_id || memberToRemove.id;

    try {
      await removeOrganizationMember(currentOrg.organization_id, memberId);
      toast.success("Member removed successfully");
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      loadMembers(); // Refresh the list
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredMembers.length} of {members.length} members
        </span>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  {loading
                    ? "Loading members..."
                    : "No members found matching your criteria."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => {
                const memberId = member.user_id || member.id;
                const memberName = member.full_name || member.name || "";
                const memberEmail = member.email || "";
                const memberRole = member.role_name || member.role || "";
                const joinedAt = member.joined_at || member.created_at;

                return (
                  <TableRow key={memberId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`/placeholder-user-${memberId}.jpg`}
                          />
                          <AvatarFallback>
                            {memberName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{memberName}</span>
                          <span className="text-xs text-muted-foreground">
                            {memberEmail}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span>{memberRole}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {joinedAt
                        ? new Date(joinedAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit Role</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member)}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Member Dialog */}
      <CreateMemberDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onMemberCreated={loadMembers}
      />

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {memberToRemove?.full_name || memberToRemove?.name}
              </strong>{" "}
              from the organization? This action cannot be undone and they will
              lose access to all organization resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
