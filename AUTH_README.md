# Authentication System

This document explains how to use the authentication system implemented in the Inspacemap Tenant Portal.

## Overview

The authentication system provides:

- JWT-based authentication
- Automatic token refresh
- Protected routes
- Role-based access control
- Persistent login state

## Components

### Auth Store (`lib/stores/auth-store.ts`)

Zustand store for managing authentication state with persistence.

```typescript
import { useAuthStore } from "@/lib/stores/auth-store";

const { user, token, login, logout, hasPermission } = useAuthStore();
```

### Auth Service (`lib/services/auth-service.ts`)

API service for authentication endpoints.

```typescript
import { authService } from "@/lib/services/auth-service";

// Login
const response = await authService.login({ email, password });

// Register
const response = await authService.register({
  full_name: "John Doe",
  email: "john@example.com",
  password: "password123",
  organization_name: "My Company",
});
```

### Protected Routes (`components/auth/protected-route.tsx`)

Component to protect authenticated routes.

```typescript
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### Permission Guard (`components/auth/permission-guard.tsx`)

Component for role-based access control.

```typescript
import { PermissionGuard } from "@/components/auth/permission-guard";

<PermissionGuard permission="venue:create">
  <CreateVenueButton />
</PermissionGuard>;
```

### Auth Hook (`lib/hooks/use-auth.ts`)

Hook for authentication state and token validation.

```typescript
import { useAuth } from "@/lib/hooks/use-auth";

function MyComponent() {
  const { user, token, logout } = useAuth();
  // Component logic
}
```

### API Hook (`lib/hooks/use-api.ts`)

Hook for making authenticated API calls with loading/error states.

```typescript
import { useApi } from "@/lib/hooks/use-api";

function MyComponent() {
  const { data, loading, error, execute } = useApi(() => api.get("/venues"));

  const handleFetch = () => execute();

  // Component logic
}
```

## Usage Examples

### Login Flow

```typescript
// pages/login.tsx
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authService } from "@/lib/services/auth-service";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login({ email, password });
      login(response.access_token, response.user);
      // Redirect to dashboard
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Protected Component

```typescript
// components/ProtectedComponent.tsx
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PermissionGuard } from "@/components/auth/permission-guard";

function AdminPanel() {
  return (
    <ProtectedRoute>
      <PermissionGuard
        permission="admin:access"
        fallback={<div>Access denied</div>}
      >
        <div>Admin content</div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
```

### API Call with Hook

```typescript
// components/VenueList.tsx
import { useApi } from "@/lib/hooks/use-api";
import api from "@/lib/api";

function VenueList() {
  const {
    data: venues,
    loading,
    error,
    execute,
  } = useApi(() => api.get("/venues"));

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {venues?.map((venue) => (
        <div key={venue.id}>{venue.name}</div>
      ))}
      <button onClick={execute}>Refresh</button>
    </div>
  );
}
```

## Environment Variables

Make sure to set the correct API base URL in `.env`:

```
NEXT_PUBLIC_API_BASE_URL="http://localhost:8081/api/v1"
```

## Backend Integration

The authentication system expects the backend to provide:

### Login Response

```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "full_name": "User Name",
      "organization_id": "org-id",
      "role": "owner|editor|viewer",
      "permissions": [
        "venue:create",
        "venue:read",
        "venue:update",
        "venue:delete"
      ]
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Testing

Use the seeded users from the backend:

- Admin: `admin@inspacemap.dev` / `admin123`
- Editor: `editor@inspacemap.dev` / `editor123`
- Viewer: `viewer@inspacemap.dev` / `viewer123`
