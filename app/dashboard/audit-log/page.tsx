import { mockAuditLogs } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/auth/role-guard";
import { InsufficientAuthority } from "@/components/auth/insufficient-authority";

export default function AuditLogPage() {
  return (
    <RoleGuard
      role={["owner", "admin"]}
      fallback={
        <InsufficientAuthority
          title="Audit Log Access Required"
          description="Only organization administrators can view and monitor audit logs to ensure security and compliance."
          requiredRole={["owner", "admin"]}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">Audit Log</h1>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.date}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </RoleGuard>
  );
}
