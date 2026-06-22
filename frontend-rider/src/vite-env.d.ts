/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_SW: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_ADMIN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
