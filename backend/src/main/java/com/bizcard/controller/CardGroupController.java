package com.bizcard.controller;

import com.bizcard.dto.ApiResponse;
import com.bizcard.entity.CardGroup;
import com.bizcard.entity.BusinessCard;
import com.bizcard.entity.User;
import com.bizcard.service.CardGroupService;
import com.bizcard.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class CardGroupController {
    
    private final CardGroupService groupService;
    private final UserService userService;
    
    public CardGroupController(CardGroupService groupService, UserService userService) {
        this.groupService = groupService;
        this.userService = userService;
    }
    
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username);
    }
    
    @GetMapping
    public ApiResponse<List<CardGroup>> listGroups() {
        User user = getCurrentUser();
        List<CardGroup> groups = groupService.listGroups(user);
        return ApiResponse.success(groups);
    }
    
    @GetMapping("/{id}")
    public ApiResponse<CardGroup> getGroup(@PathVariable Long id) {
        try {
            CardGroup group = groupService.getGroupById(id);
            return ApiResponse.success(group);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping
    public ApiResponse<CardGroup> createGroup(@RequestBody CardGroup group) {
        User user = getCurrentUser();
        try {
            CardGroup savedGroup = groupService.createGroup(group, user);
            return ApiResponse.success("分组创建成功", savedGroup);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ApiResponse<CardGroup> updateGroup(@PathVariable Long id, @RequestBody CardGroup group) {
        User user = getCurrentUser();
        try {
            CardGroup updatedGroup = groupService.updateGroup(id, group, user);
            return ApiResponse.success("分组更新成功", updatedGroup);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteGroup(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            groupService.deleteGroup(id, user);
            return ApiResponse.success("分组删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @GetMapping("/{groupId}/cards")
    public ApiResponse<Page<BusinessCard>> getCardsInGroup(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BusinessCard> cards = groupService.getCardsInGroup(groupId, pageable);
        return ApiResponse.success(cards);
    }
    
    @PostMapping("/{groupId}/cards/{cardId}")
    public ApiResponse<String> addCardToGroup(
            @PathVariable Long groupId,
            @PathVariable Long cardId) {
        User user = getCurrentUser();
        try {
            groupService.addCardToGroup(cardId, groupId, user);
            return ApiResponse.success("已添加到分组", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/{groupId}/cards/{cardId}")
    public ApiResponse<String> removeCardFromGroup(
            @PathVariable Long groupId,
            @PathVariable Long cardId) {
        User user = getCurrentUser();
        try {
            groupService.removeCardFromGroup(cardId, groupId, user);
            return ApiResponse.success("已从分组移除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
