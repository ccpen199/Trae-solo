package com.retail.admin.service;

import com.retail.admin.dto.LoginDTO;
import com.retail.admin.vo.LoginVO;
import com.retail.admin.vo.MenuVO;

import java.util.List;

public interface AuthService {

    LoginVO login(LoginDTO loginDTO);

    void logout();

    List<MenuVO> getUserMenus(Long userId);

    List<String> getUserPermissions(Long userId);
}
