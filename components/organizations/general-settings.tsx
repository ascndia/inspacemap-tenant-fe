"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Save, X, Upload, Globe, Mail, Phone } from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";

interface Organization {
  id: string;
  name: string;
  type: string;
  members: number[];
  status: string;
  description?: string;
  email: string;
  phone: string;
  address: string;
  // New schema fields
  slug?: string;
  logoURL?: string;
  website?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
}

interface GeneralSettingsProps {
  organization: Organization;
}

export function GeneralSettings({ organization }: GeneralSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    slug: organization.slug || "",
    logoURL: organization.logoURL || "",
    website: organization.website || "",
    email: organization.email,
    phone: organization.phone,
    address: organization.address,
    isActive: organization.isActive ?? true,
    description: organization.description || "",
  });

  const handleSave = () => {
    // In a real app, make API call to update organization
    console.log("Saving organization:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: organization.name,
      slug: organization.slug || "",
      logoURL: organization.logoURL || "",
      website: organization.website || "",
      email: organization.email,
      phone: organization.phone,
      address: organization.address,
      isActive: organization.isActive ?? true,
      description: organization.description || "",
    });
    setIsEditing(false);
  };

  const handleLogoSelect = (media: any) => {
    setFormData((prev) => ({ ...prev, logoURL: media.url }));
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Organization Details</CardTitle>
              <CardDescription>
                Update your organization's public profile and settings.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <Label>Organization Logo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.logoURL} />
                <AvatarFallback className="text-lg">
                  {formData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <MediaPicker
                  onSelect={handleLogoSelect}
                  trigger={
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Change Logo
                    </Button>
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, at least 200x200px
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="organization-slug"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and must be unique
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description of your organization..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder="https://yourwebsite.com"
            />
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Organization Active</Label>
                <p className="text-sm text-muted-foreground">
                  When disabled, organization members cannot access the system
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              View and manage your organization's public profile and settings.
            </CardDescription>
          </div>
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo and Basic Info */}
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={organization.logoURL} />
            <AvatarFallback className="text-lg">
              {organization.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-xl font-semibold">{organization.name}</h3>
              {organization.slug && (
                <p className="text-sm text-muted-foreground">
                  @{organization.slug}
                </p>
              )}
            </div>
            {organization.description && (
              <p className="text-sm text-muted-foreground">
                {organization.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  organization.isActive !== false ? "default" : "secondary"
                }
              >
                {organization.isActive !== false ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{organization.type}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {organization.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {organization.phone}
                </p>
              </div>
            </div>
          </div>
          {organization.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Website</p>
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {organization.website}
                </a>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="h-4 w-4 mt-0.5 text-muted-foreground">📍</div>
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-muted-foreground">
                {organization.address}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Organization Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Organization Stats</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {organization.members?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Venues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Active Projects</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
