import axios from "axios";

export const mockOrganizations = [
  {
    id: "1",
    name: "Acme Corp",
    type: "business",
    members: [1, 2, 3],
    status: "active",
    description: "Leading provider of coyote-catching equipment.",
    email: "contact@acme.com",
    phone: "+1 (555) 123-4567",
    address: "123 Desert Road, Arizona, USA",
    // New schema fields
    slug: "acme-corp",
    logoURL: "/placeholder-logo.png",
    website: "https://acme.com",
    isActive: true,
    settings: {
      theme: "light",
      notifications: true,
      language: "en",
    },
  },
  {
    id: "2",
    name: "Global Retail",
    type: "company",
    members: [1, 2, 3, 4, 5],
    status: "active",
    slug: "global-retail",
    logoURL: "/placeholder-logo.png",
    website: "https://globalretail.com",
    isActive: true,
    settings: {},
  },
];

export const mockVenues = [
  {
    id: "1",
    name: "Grand Plaza Mall",
    address: "123 Market St, San Francisco, CA",
    status: "published",
    coverImageId: "1",
    floors: [
      {
        id: "f1",
        name: "Ground Floor",
        level: 0,
        areas: [
          { id: "a1", name: "Main Entrance", category: "entrance" },
          { id: "a2", name: "Food Court", category: "dining" },
        ],
      },
      {
        id: "f2",
        name: "Second Floor",
        level: 1,
        areas: [{ id: "a3", name: "Cinema", category: "entertainment" }],
      },
    ],
    location: { lat: 37.7749, lng: -122.4194 },
  },
  {
    id: "2",
    name: "Tech Hub Office",
    address: "456 Innovation Dr, San Jose, CA",
    status: "draft",
    coverImageId: "4",
    floors: [
      {
        id: "f3",
        name: "Lobby",
        level: 0,
        areas: [{ id: "a4", name: "Reception", category: "service" }],
      },
    ],
    location: { lat: 37.3382, lng: -121.8863 },
  },
  {
    id: "3",
    name: "City Center Hotel",
    address: "789 Downtown Ave, Los Angeles, CA",
    status: "published",
    coverImageId: "5",
    floors: [],
    location: { lat: 34.0522, lng: -118.2437 },
  },
];

export const mockMedia = [
  {
    id: "1",
    name: "lobby_360.jpg",
    type: "image",
    size: "4.2 MB",
    url: "/placeholder.svg",
  },
  {
    id: "2",
    name: "hallway_A.jpg",
    type: "image",
    size: "3.1 MB",
    url: "/placeholder.svg",
  },
  {
    id: "3",
    name: "intro_video.mp4",
    type: "video",
    size: "24.5 MB",
    url: "/placeholder.svg",
  },
  {
    id: "4",
    name: "storefront_01.jpg",
    type: "image",
    size: "2.8 MB",
    url: "/placeholder.svg",
  },
  {
    id: "5",
    name: "atrium_view.jpg",
    type: "image",
    size: "5.6 MB",
    url: "/placeholder.svg",
  },
];

export const mockMembers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@acme.com",
    role: "Admin",
    status: "Active",
    lastActive: "2 mins ago",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@acme.com",
    role: "Editor",
    status: "Active",
    lastActive: "1 hour ago",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@acme.com",
    role: "Viewer",
    status: "Invited",
    lastActive: "-",
  },
];

export const mockAuditLogs = [
  {
    id: 1,
    user: "John Doe",
    action: "Updated Venue",
    resource: "Grand Plaza Mall",
    date: "2023-10-25 14:30",
    ip: "192.168.1.1",
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "Uploaded Media",
    resource: "lobby_360.jpg",
    date: "2023-10-25 11:15",
    ip: "192.168.1.2",
  },
  {
    id: 3,
    user: "John Doe",
    action: "Invited Member",
    resource: "bob@acme.com",
    date: "2023-10-24 09:45",
    ip: "192.168.1.1",
  },
  {
    id: 4,
    user: "System",
    action: "Backup Created",
    resource: "Daily Backup",
    date: "2023-10-24 00:00",
    ip: "localhost",
  },
  {
    id: 5,
    user: "Jane Smith",
    action: "Deleted Venue",
    resource: "Old Warehouse",
    date: "2023-10-23 16:20",
    ip: "192.168.1.2",
  },
];

// Buat instance Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor untuk menyisipkan Token & Tenant ID otomatis
api.interceptors.request.use((config) => {
  // Ambil dari LocalStorage atau NextAuth Session
  const token = localStorage.getItem("access_token");
  const activeOrgID = localStorage.getItem("active_org_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Header wajib untuk Multi-tenant backend kita
  if (activeOrgID) {
    config.headers["X-Tenant-ID"] = activeOrgID;
  }

  return config;
});

export default api;
