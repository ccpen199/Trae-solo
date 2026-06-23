import { Plugin, PluginCategoryItem } from '@/types/plugin';
import { mockPlugins, mockPluginCategories, mockMyInstalledPlugins } from '@/data/mockPlugin';

export const pluginService = {
  async getCategories(): Promise<PluginCategoryItem[]> {
    console.log('[PluginService] Get categories');
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPluginCategories;
  },

  async getPluginList(params: {
    category?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: Plugin[]; total: number }> {
    console.log('[PluginService] Get plugin list:', params);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { category, keyword, page = 1, pageSize = 10 } = params;
    
    let list = [...mockPlugins].filter(p => p.status !== 'unpublished');
    
    if (category && category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(lowerKeyword) ||
        p.description.toLowerCase().includes(lowerKeyword) ||
        p.developer.toLowerCase().includes(lowerKeyword)
      );
    }
    
    return {
      list: list.slice((page - 1) * pageSize, page * pageSize),
      total: list.length
    };
  },

  async getPluginDetail(pluginId: string): Promise<Plugin> {
    console.log('[PluginService] Get plugin detail:', pluginId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const plugin = mockPlugins.find(p => p.id === pluginId);
    if (!plugin) throw new Error('应用不存在');
    return plugin;
  },

  async getMyInstalledPlugins(): Promise<Plugin[]> {
    console.log('[PluginService] Get my installed plugins');
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMyInstalledPlugins;
  },

  async getFavoritePlugins(): Promise<Plugin[]> {
    console.log('[PluginService] Get favorite plugins');
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPlugins.filter(p => p.isFavorite);
  },

  async installPlugin(pluginId: string): Promise<void> {
    console.log('[PluginService] Install plugin:', pluginId);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const plugin = mockPlugins.find(p => p.id === pluginId);
    if (!plugin) throw new Error('应用不存在');
    
    const requiredPermissions = plugin.permissions.filter(p => p.required);
    if (requiredPermissions.length > 0) {
      console.log('[PluginService] Required permissions:', requiredPermissions.map(p => p.name));
    }
  },

  async uninstallPlugin(pluginId: string): Promise<void> {
    console.log('[PluginService] Uninstall plugin:', pluginId);
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  async toggleFavorite(pluginId: string): Promise<boolean> {
    console.log('[PluginService] Toggle favorite:', pluginId);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const plugin = mockPlugins.find(p => p.id === pluginId);
    if (plugin) {
      plugin.isFavorite = !plugin.isFavorite;
      return plugin.isFavorite;
    }
    return false;
  },

  async openPlugin(pluginId: string): Promise<{ h5Url: string; ssoToken: string }> {
    console.log('[PluginService] Open plugin:', pluginId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const plugin = mockPlugins.find(p => p.id === pluginId);
    if (!plugin) throw new Error('应用不存在');
    
    const ssoToken = 'sso_token_' + Date.now();
    const separator = plugin.h5Url.includes('?') ? '&' : '?';
    const finalUrl = `${plugin.h5Url}${separator}ssoToken=${ssoToken}`;
    
    return {
      h5Url: finalUrl,
      ssoToken
    };
  },

  async checkOfflineUpdate(pluginId: string): Promise<{ hasUpdate: boolean; version?: string; size?: number; isMandatory?: boolean }> {
    console.log('[PluginService] Check offline update:', pluginId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const plugin = mockPlugins.find(p => p.id === pluginId);
    if (!plugin || !plugin.offlinePackage) {
      return { hasUpdate: false };
    }
    
    return {
      hasUpdate: true,
      version: plugin.offlinePackage.version,
      size: plugin.offlinePackage.packageSize,
      isMandatory: plugin.offlinePackage.isMandatory
    };
  },

  async downloadOfflinePackage(pluginId: string): Promise<{ progress: number; status: 'downloading' | 'completed' | 'failed' }> {
    console.log('[PluginService] Download offline package:', pluginId);
    
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('[PluginService] Download progress:', i + '%');
    }
    
    return { progress: 100, status: 'completed' };
  },

  async getOfflinePackages(): Promise<{ pluginId: string; pluginName: string; version: string; size: number; lastUpdate: string }[]> {
    console.log('[PluginService] Get offline packages');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockPlugins
      .filter(p => p.offlineEnabled && p.offlinePackage)
      .map(p => ({
        pluginId: p.id,
        pluginName: p.name,
        version: p.offlinePackage!.version,
        size: p.offlinePackage!.packageSize,
        lastUpdate: p.offlinePackage!.publishTime
      }));
  },

  async clearOfflineCache(pluginId?: string): Promise<void> {
    console.log('[PluginService] Clear offline cache:', pluginId || 'all');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
};

export default pluginService;
