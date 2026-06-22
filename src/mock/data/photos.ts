export interface Photo {
  id: string;
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
  format: string;
  aiEnhanced: boolean;
  aiParams?: {
    denoise?: number;
    sharpen?: number;
    colorEnhance?: number;
    upscale?: number;
  };
  privacy: "public" | "private" | "friends";
  uploadedAt: string;
}

export const photos: Photo[] = [
  {
    id: "photo-001",
    url: "https://picsum.photos/seed/photo001/1200/800",
    originalUrl: "https://picsum.photos/seed/photo001/4000/3000",
    thumbnailUrl: "https://picsum.photos/seed/photo001/300/200",
    width: 4000,
    height: 3000,
    size: 2457600,
    format: "jpeg",
    aiEnhanced: true,
    aiParams: {
      denoise: 50,
      sharpen: 30,
      colorEnhance: 40,
      upscale: 2,
    },
    privacy: "private",
    uploadedAt: "2025-06-15 14:30:25",
  },
  {
    id: "photo-002",
    url: "https://picsum.photos/seed/photo002/1200/900",
    originalUrl: "https://picsum.photos/seed/photo002/3600/2700",
    thumbnailUrl: "https://picsum.photos/seed/photo002/300/225",
    width: 3600,
    height: 2700,
    size: 3145728,
    format: "jpeg",
    aiEnhanced: false,
    privacy: "public",
    uploadedAt: "2025-06-14 09:15:42",
  },
  {
    id: "photo-003",
    url: "https://picsum.photos/seed/photo003/1000/1200",
    originalUrl: "https://picsum.photos/seed/photo003/3000/3600",
    thumbnailUrl: "https://picsum.photos/seed/photo003/250/300",
    width: 3000,
    height: 3600,
    size: 4194304,
    format: "png",
    aiEnhanced: true,
    aiParams: {
      denoise: 60,
      sharpen: 45,
      colorEnhance: 50,
    },
    privacy: "friends",
    uploadedAt: "2025-06-13 18:45:10",
  },
  {
    id: "photo-004",
    url: "https://picsum.photos/seed/photo004/1200/800",
    originalUrl: "https://picsum.photos/seed/photo004/5000/3333",
    thumbnailUrl: "https://picsum.photos/seed/photo004/300/200",
    width: 5000,
    height: 3333,
    size: 5767168,
    format: "jpeg",
    aiEnhanced: false,
    privacy: "public",
    uploadedAt: "2025-06-12 11:20:33",
  },
  {
    id: "photo-005",
    url: "https://picsum.photos/seed/photo005/800/1200",
    originalUrl: "https://picsum.photos/seed/photo005/2400/3600",
    thumbnailUrl: "https://picsum.photos/seed/photo005/200/300",
    width: 2400,
    height: 3600,
    size: 2831155,
    format: "heic",
    aiEnhanced: true,
    aiParams: {
      denoise: 30,
      sharpen: 25,
      colorEnhance: 35,
      upscale: 1.5,
    },
    privacy: "private",
    uploadedAt: "2025-06-11 20:05:18",
  },
  {
    id: "photo-006",
    url: "https://picsum.photos/seed/photo006/1200/700",
    originalUrl: "https://picsum.photos/seed/photo006/4200/2450",
    thumbnailUrl: "https://picsum.photos/seed/photo006/300/175",
    width: 4200,
    height: 2450,
    size: 3670016,
    format: "jpeg",
    aiEnhanced: false,
    privacy: "public",
    uploadedAt: "2025-06-10 16:40:55",
  },
  {
    id: "photo-007",
    url: "https://picsum.photos/seed/photo007/1200/1200",
    originalUrl: "https://picsum.photos/seed/photo007/3500/3500",
    thumbnailUrl: "https://picsum.photos/seed/photo007/300/300",
    width: 3500,
    height: 3500,
    size: 4718592,
    format: "png",
    aiEnhanced: true,
    aiParams: {
      denoise: 40,
      sharpen: 50,
      colorEnhance: 60,
      upscale: 2,
    },
    privacy: "friends",
    uploadedAt: "2025-06-09 08:55:47",
  },
  {
    id: "photo-008",
    url: "https://picsum.photos/seed/photo008/1200/800",
    originalUrl: "https://picsum.photos/seed/photo008/4800/3200",
    thumbnailUrl: "https://picsum.photos/seed/photo008/300/200",
    width: 4800,
    height: 3200,
    size: 6291456,
    format: "raw",
    aiEnhanced: false,
    privacy: "private",
    uploadedAt: "2025-06-08 13:25:09",
  },
];
