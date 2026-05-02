package com.retailpos.controller;

import com.retailpos.entity.Users;
import com.retailpos.entity.Store;
import com.retailpos.mapper.UsersMapper;
import com.retailpos.mapper.StoreMapper;
import com.retailpos.util.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsersMapper usersMapper;
    private final StoreMapper storeMapper;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");

        Users user = usersMapper.selectOne(
            new LambdaQueryWrapper<Users>()
                .eq(Users::getUsername, username)
                .eq(Users::getStatus, "ACTIVE")
        );

        if (user == null) {
            return Result.fail("用户不存在");
        }

        if (!PasswordEncoder.matches(password, user.getPasswordHash())) {
            return Result.fail("密码错误");
        }

        Store store = storeMapper.selectById(user.getStoreId());

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("realName", user.getRealName());
        result.put("role", user.getRole());
        result.put("storeId", user.getStoreId());
        result.put("storeName", store != null ? store.getStoreName() : null);

        log.info("用户登录成功: username={}, role={}", username, user.getRole());

        return Result.success(result);
    }

    @PostMapping("/logout")
    public Result<String> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        return Result.success("退出登录成功");
    }
}
