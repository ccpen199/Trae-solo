import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Shield, Users, Edit, Calendar, BarChart3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PermissionKey, AgencyRole } from '@/store/useAgencyStore';
import { PERMISSION_LABELS, ROLE_PERMISSION_PRESETS } from '@/store/useAgencyStore';

const permissionIcons: Record<PermissionKey, React.ReactNode> = {
  viewArtists: <Users className="w-4 h-4" />,
  editArtists: <Edit className="w-4 h-4" />,
  publishCastings: <Calendar className="w-4 h-4" />,
  viewAnalytics: <BarChart3 className="w-4 h-4" />,
  manageTeam: <Shield className="w-4 h-4" />,
  viewContactInfo: <Eye className="w-4 h-4" />,
};

export interface PermissionMatrixProps {
  currentPermissions: PermissionKey[];
  currentRole: AgencyRole;
  onPermissionChange: (permission: PermissionKey, checked: boolean) => void;
  onRoleChange: (role: AgencyRole) => void;
  disabled?: boolean;
  className?: string;
}

const roles: AgencyRole[] = ['Owner', 'Admin', 'Casting Manager', 'Talent Scout', 'Viewer'];

export function PermissionMatrix({
  currentPermissions,
  currentRole,
  onPermissionChange,
  onRoleChange,
  disabled = false,
  className,
}: PermissionMatrixProps) {
  const permissions: PermissionKey[] = [
    'viewArtists',
    'editArtists',
    'publishCastings',
    'viewAnalytics',
    'manageTeam',
    'viewContactInfo',
  ];

  return (
    <Card variant="default" className={cn(className)}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-midnight-700/50">
                <th className="text-left p-4 text-sm font-medium text-midnight-300 w-48">权限 / 角色</th>
                {roles.map((role) => (
                  <th key={role} className="p-4 text-center">
                    <button
                      onClick={() => !disabled && onRoleChange(role)}
                      disabled={disabled}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                        currentRole === role
                          ? 'bg-gradient-primary text-white shadow-button'
                          : 'text-midnight-300 hover:text-white hover:bg-midnight-600/50',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {role}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission} className="border-t border-midnight-700/50 hover:bg-midnight-700/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-midnight-700 flex items-center justify-center text-rose-400">
                        {permissionIcons[permission]}
                      </span>
                      <span className="text-sm font-medium text-white">{PERMISSION_LABELS[permission]}</span>
                    </div>
                  </td>
                  {roles.map((role) => {
                    const roleHasPermission = ROLE_PERMISSION_PRESETS[role].includes(permission);
                    const isCurrentRole = currentRole === role;
                    return (
                      <td key={role} className="p-4 text-center">
                        {isCurrentRole ? (
                          <div className="inline-flex items-center justify-center">
                            <Checkbox
                              checked={currentPermissions.includes(permission)}
                              onCheckedChange={(checked) =>
                                !disabled && onPermissionChange(permission, checked as boolean)
                              }
                              disabled={disabled}
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'inline-flex items-center justify-center w-5 h-5 rounded-lg border-2 transition-all',
                              roleHasPermission
                                ? 'bg-rose-500/30 border-rose-500/50 text-rose-400'
                                : 'border-midnight-600 text-midnight-500'
                            )}
                          >
                            {roleHasPermission && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionMatrix;
