package com.bbs.controller;

import com.bbs.common.Result;
import com.bbs.dto.ArticleDTO;
import com.bbs.entity.Article;
import com.bbs.security.UserDetailsImpl;
import com.bbs.service.ArticleService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {
    
    private final ArticleService articleService;
    
    @PostMapping
    public Result<Article> createArticle(
            @Valid @RequestBody ArticleDTO dto,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return Result.unauthorized("请先登录");
        }
        Article article = articleService.createArticle(dto, userDetails.getUserId());
        return Result.success("发帖成功", article);
    }
    
    @PutMapping("/{id}")
    public Result<Article> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody ArticleDTO dto,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return Result.unauthorized("请先登录");
        }
        dto.setId(id);
        boolean isAdmin = isAdminUser(userDetails);
        Article article = articleService.updateArticle(dto, userDetails.getUserId(), isAdmin);
        return Result.success("修改成功", article);
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> deleteArticle(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return Result.unauthorized("请先登录");
        }
        boolean isAdmin = isAdminUser(userDetails);
        articleService.deleteArticle(id, userDetails.getUserId(), isAdmin);
        return Result.success();
    }
    
    private boolean isAdminUser(UserDetailsImpl userDetails) {
        return userDetails.getRoleCodes() != null && 
               userDetails.getRoleCodes().stream().anyMatch(r -> 
                   "SUPER_ADMIN".equals(r) || "ADMIN".equals(r) || "MODERATOR".equals(r));
    }
}
