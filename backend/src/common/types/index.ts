export enum ContentType {
  NEWS = 'news',
  PRODUCT = 'product',
  DOCUMENT = 'document',
  DOWNLOAD = 'download',
  IMAGE = 'image',
  VIDEO = 'video',
  PAGE = 'page',
}

export enum PublishStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  RECYCLED = 'recycled',
}

export enum SiteType {
  MAIN = 'main',
  SUB = 'sub',
}

export enum DomainType {
  DIRECTORY = 'directory',
  SUBDOMAIN = 'subdomain',
  INDEPENDENT = 'independent',
}

export enum RoleType {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  CUSTOM = 'custom',
}

export enum PermissionModule {
  SITE = 'site',
  CATEGORY = 'category',
  CONTENT = 'content',
  TEMPLATE = 'template',
  USER = 'user',
  ROLE = 'role',
  COMMENT = 'comment',
  VOTE = 'vote',
  ATTACHMENT = 'attachment',
  SYSTEM = 'system',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  EXPORT = 'export',
  IMPORT = 'import',
  MANAGE = 'manage',
}
