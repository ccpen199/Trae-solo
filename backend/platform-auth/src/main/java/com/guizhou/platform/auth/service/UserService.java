package com.guizhou.platform.auth.service;

import com.guizhou.platform.auth.entity.SysUser;
import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.auth.dto.UserDTO;
import com.guizhou.platform.auth.vo.UserInfoVO;
import com.guizhou.platform.common.base.PageResult;

public interface UserService extends IService<SysUser> {

    Long createUser(UserDTO dto);

    void updateUser(UserDTO dto);

    void deleteUser(Long userId);

    UserInfoVO getUserInfo(Long userId);

    PageResult<UserInfoVO> pageUsers(Integer pageNum, Integer pageSize, String username, String phone, Integer status);

    void resetPassword(Long userId, String newPassword);

    void updateStatus(Long userId, Integer status);

    void assignRoles(Long userId, java.util.List<Long> roleIds);
}
