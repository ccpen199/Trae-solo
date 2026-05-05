package com.bizcard.controller;

import com.bizcard.dto.ApiResponse;
import com.bizcard.entity.BusinessCard;
import com.bizcard.entity.User;
import com.bizcard.service.BusinessCardService;
import com.bizcard.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class BusinessCardController {
    
    private final BusinessCardService cardService;
    private final UserService userService;
    
    public BusinessCardController(BusinessCardService cardService, UserService userService) {
        this.cardService = cardService;
        this.userService = userService;
    }
    
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username);
    }
    
    @GetMapping
    public ApiResponse<Page<BusinessCard>> listCards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        User user = getCurrentUser();
        
        Page<BusinessCard> cards;
        if (keyword != null && !keyword.trim().isEmpty()) {
            cards = cardService.searchCards(user, keyword, pageable);
        } else {
            cards = cardService.listCards(user, pageable);
        }
        
        return ApiResponse.success(cards);
    }
    
    @GetMapping("/{id}")
    public ApiResponse<BusinessCard> getCard(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            BusinessCard card = cardService.getCardById(id, user);
            return ApiResponse.success(card);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping
    public ApiResponse<BusinessCard> createCard(@RequestBody BusinessCard card) {
        User user = getCurrentUser();
        try {
            BusinessCard savedCard = cardService.createCard(card, user);
            return ApiResponse.success("名片创建成功", savedCard);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ApiResponse<BusinessCard> updateCard(@PathVariable Long id, @RequestBody BusinessCard card) {
        User user = getCurrentUser();
        try {
            BusinessCard updatedCard = cardService.updateCard(id, card, user);
            return ApiResponse.success("名片更新成功", updatedCard);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteCard(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            cardService.deleteCard(id, user);
            return ApiResponse.success("名片删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/batch")
    public ApiResponse<String> deleteCards(@RequestBody List<Long> ids) {
        User user = getCurrentUser();
        try {
            cardService.deleteCards(ids, user);
            return ApiResponse.success("批量删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/{cardId}/merge/{contactId}")
    public ApiResponse<BusinessCard> mergeToContact(
            @PathVariable Long cardId,
            @PathVariable Long contactId) {
        User user = getCurrentUser();
        try {
            BusinessCard card = cardService.mergeToContact(cardId, contactId, user);
            return ApiResponse.success("已关联到同一人物", card);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @GetMapping("/contact/{contactId}")
    public ApiResponse<List<BusinessCard>> getCardsByContact(@PathVariable Long contactId) {
        List<BusinessCard> cards = cardService.getCardsByContact(contactId);
        return ApiResponse.success(cards);
    }
    
    @GetMapping("/companies")
    public ApiResponse<List<String>> getCompanies() {
        User user = getCurrentUser();
        List<String> companies = cardService.getDistinctCompanies(user);
        return ApiResponse.success(companies);
    }
    
    @GetMapping("/departments")
    public ApiResponse<List<String>> getDepartments() {
        User user = getCurrentUser();
        List<String> departments = cardService.getDistinctDepartments(user);
        return ApiResponse.success(departments);
    }
}
