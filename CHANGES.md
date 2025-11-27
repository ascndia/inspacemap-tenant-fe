# InSpaceMap Backend - User Management & Authentication Changes

## Overview

This document outlines the major architectural changes made to the InSpaceMap backend authentication and user management system. The system has been simplified to enforce **single-organization users** with direct user creation by organization tenants.

## Key Changes

### 1. Removed Features

- ❌ **User Invitations**: No more invitation tokens or email-based invites
- ❌ **Multi-Organization Users**: Users can only belong to one organization
- ❌ **Organization Memberships**: Replaced with direct user-organization relationships

### 2. New Architecture

#### User Entity Changes

```go
type User struct {
    BaseEntity
    Email           string      `gorm:"uniqueIndex"`
    PasswordHash    string
    FullName        string
    AvatarURL       string
    IsEmailVerified bool
    // NEW: Direct relationships
    OrganizationID  uuid.UUID   `gorm:"index;not null"`
    Organization    Organization `gorm:"foreignKey:OrganizationID"`
    RoleID          uuid.UUID   `gorm:"index;not null"`
    Role            Role        `gorm:"foreignKey:RoleID"`
}
```

#### Organization Entity Changes

```go
type Organization struct {
    // ...
    Users []User `gorm:"foreignKey:OrganizationID"`
    // Removed: Invitations, Members
}
```

### 3. Authentication Flow

#### Registration

- User registers with email/password + organization name
- Automatically creates organization and assigns user as "Owner"
- No invitation required

#### Login

- Returns user info with single organization context
- JWT token scoped to user's organization

## API Reference

### Authentication Endpoints

#### POST `/api/v1/auth/register`

Register a new user and create their organization.

**Request:**

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "organization_name": "My Company"
}
```

**Response:**

```json
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "expires_in": 86400,
  "user": {
    "id": "user_uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "organization": {
      "organization_id": "org_uuid",
      "name": "My Company",
      "slug": "my-company",
      "role_name": "Owner"
    }
  }
}
```

#### POST `/api/v1/auth/login`

Login with existing credentials.

**Request:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** Same as registration.

### User Management Endpoints

#### POST `/api/v1/orgs/{org_id}/users`

Create a new user in the organization (requires Owner/Admin role).

**Request:**

```json
{
  "full_name": "Jane Smith",
  "email": "jane@company.com",
  "password": "userpassword123",
  "role_id": "role_uuid_here"
}
```

**Response:**

```json
{
  "message": "User created successfully"
}
```

#### GET `/api/v1/orgs/{org_id}/members`

Get all users in the organization.

**Response:**

```json
[
  {
    "user_id": "user_uuid",
    "full_name": "Jane Smith",
    "email": "jane@company.com",
    "role_id": "role_uuid",
    "role_name": "Editor",
    "joined_at": "2025-11-26T10:00:00Z"
  }
]
```

#### PATCH `/api/v1/orgs/{org_id}/members`

Update a user's role in the organization.

**Request:**

```json
{
  "target_user_id": "user_uuid",
  "new_role_id": "new_role_uuid"
}
```

#### DELETE `/api/v1/orgs/{org_id}/members/{user_id}`

Remove a user from the organization (requires Owner role).

## Frontend Integration Guide

### 1. Registration Flow

```javascript
// Register new user
const registerUser = async (userData) => {
  try {
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: userData.fullName,
        email: userData.email,
        password: userData.password,
        organization_name: userData.organizationName,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store tokens
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Store user info
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.href = "/dashboard";
    }
  } catch (error) {
    console.error("Registration failed:", error);
  }
};
```

### 2. Login Flow

```javascript
const loginUser = async (credentials) => {
  try {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      // Store authentication data
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // User will have exactly one organization
      const userOrg = data.user.organization;
      localStorage.setItem("current_org", JSON.stringify(userOrg));

      // Redirect based on role
      redirectBasedOnRole(userOrg.role_name);
    }
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### 3. User Management (For Organization Owners)

```javascript
// Get organization ID from current user context
const currentOrg = JSON.parse(localStorage.getItem("current_org"));
const orgId = currentOrg.organization_id;

// Create new user
const createUser = async (userData) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await fetch(`/api/v1/orgs/${orgId}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        full_name: userData.fullName,
        email: userData.email,
        password: userData.password,
        role_id: userData.roleId,
      }),
    });

    if (response.ok) {
      // Refresh user list
      loadOrganizationUsers();
    }
  } catch (error) {
    console.error("User creation failed:", error);
  }
};

// Load organization users
const loadOrganizationUsers = async () => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await fetch(`/api/v1/orgs/${orgId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const users = await response.json();
    // Update UI with users list
    updateUsersTable(users);
  } catch (error) {
    console.error("Failed to load users:", error);
  }
};

// Update user role
const updateUserRole = async (userId, newRoleId) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await fetch(`/api/v1/orgs/${orgId}/members`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        target_user_id: userId,
        new_role_id: newRoleId,
      }),
    });

    if (response.ok) {
      loadOrganizationUsers(); // Refresh list
    }
  } catch (error) {
    console.error("Role update failed:", error);
  }
};

// Remove user
const removeUser = async (userId) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await fetch(`/api/v1/orgs/${orgId}/members/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      loadOrganizationUsers(); // Refresh list
    }
  } catch (error) {
    console.error("User removal failed:", error);
  }
};
```

### 4. Authentication Middleware

```javascript
// Check if user is authenticated and get current org context
const getAuthContext = () => {
  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));
  const currentOrg = JSON.parse(localStorage.getItem("current_org"));

  return { token, user, currentOrg };
};

// Add auth headers to requests
const authenticatedFetch = (url, options = {}) => {
  const { token } = getAuthContext();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
```

### 5. Role-Based UI Components

```javascript
// Check if current user can manage users
const canManageUsers = () => {
  const { currentOrg } = getAuthContext();
  return ["Owner", "Admin"].includes(currentOrg.role_name);
};

// Conditionally show user management UI
const UserManagement = () => {
  if (!canManageUsers()) {
    return <div>You don't have permission to manage users.</div>;
  }

  return (
    <div>
      <h2>User Management</h2>
      <CreateUserForm onSubmit={createUser} />
      <UsersList
        users={users}
        onRoleUpdate={updateUserRole}
        onUserRemove={removeUser}
      />
    </div>
  );
};
```

## Migration Notes

### For Existing Applications

1. **Remove invitation-related UI**: No more invitation flows
2. **Update user context**: Users now have single organization
3. **Update API calls**: Use new user management endpoints
4. **Update data models**: Remove invitation and membership concepts

### Database Migration

The system will automatically handle schema changes on startup:

- Drops `organization_members` and `user_invitations` tables
- Adds `organization_id` and `role_id` columns to `users` table
- Updates foreign key relationships

## Security Considerations

- **Password Requirements**: Enforce strong passwords on frontend
- **Role Validation**: Always validate user roles on backend
- **Organization Isolation**: Ensure users can only access their organization's data
- **Token Management**: Implement proper token refresh logic

## Testing Checklist

- [ ] User registration creates organization
- [ ] Login returns correct user/org context
- [ ] Organization owners can create users
- [ ] Role-based permissions work correctly
- [ ] Users cannot access other organizations' data
- [ ] Password hashing works properly
- [ ] JWT tokens expire correctly

## Support

For questions about these changes, refer to the backend API documentation or contact the development team.</content>
<parameter name="filePath">c:\kuliahh maseh\mpt\backend\USER_MANAGEMENT_CHANGES.md
