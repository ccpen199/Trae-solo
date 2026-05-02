package com.retail.engine.auth;

public interface OrgAuthEngine {

    boolean checkDataPermission(Long userId, Long targetOrgId);

    boolean checkFunctionPermission(Long userId, String permission);

    String getUserDataScope(Long userId);

    Long[] getUserAccessibleOrgIds(Long userId);

    void refreshUserPermissions(Long userId);
}
