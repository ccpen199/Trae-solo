export type PluginStatus = 'published' | 'unpublished' | 'maintaining';
export type PluginCategory = 'oa' | 'erp' | 'finance' | 'hr' | 'safety' | 'production' | 'other';

export interface Plugin {
  id: string;
  name: string;
  code: string;
  icon: string;
  category: PluginCategory;
  categoryName: string;
  description: string;
  version: string;
  developer: string;
  h5Url: string;
  status: PluginStatus;
  installCount: number;
  rating: number;
  isInstalled: boolean;
  isFavorite: boolean;
  sort: number;
  publishTime: string;
  updateTime: string;
  permissions: PluginPermission[];
  dataScope: 'all' | 'province' | 'city' | 'team';
  offlineEnabled: boolean;
  offlinePackage?: OfflinePackage;
}

export interface PluginPermission {
  code: string;
  name: string;
  description: string;
  required: boolean;
}

export interface OfflinePackage {
  id: string;
  pluginId: string;
  version: string;
  packageUrl: string;
  packageSize: number;
  md5: string;
  minAppVersion: string;
  publishTime: string;
  isMandatory: boolean;
}

export interface PluginInstallRecord {
  id: string;
  pluginId: string;
  pluginName: string;
  userId: string;
  installTime: string;
  lastUseTime: string;
  useCount: number;
}

export interface PluginCategoryItem {
  id: string;
  code: PluginCategory;
  name: string;
  icon: string;
  count: number;
}
