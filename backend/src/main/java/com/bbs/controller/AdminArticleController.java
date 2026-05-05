package com.bbs.controller;

import com.bbs.common.PageResult;
import com.bbs.common.Result;
import com.bbs.entity.Article;
import com.bbs.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/articles")
@RequiredArgsConstructor
public class AdminArticleController {
    
    private final ArticleService articleService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<PageResult<Article>> getArticles(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long subCategoryId,
            @RequestParam(required = false) String keyword) {
        PageResult<Article> result = articleService.getArticlePage(current, size, categoryId, subCategoryId, keyword);
        return Result.success(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<Article> getArticle(@PathVariable Long id) {
        Article article = articleService.getArticleById(id, false, null);
        return Result.success(article);
    }
    
    @PutMapping("/{id}/lock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<Article> lockArticle(@PathVariable Long id, @RequestParam boolean locked) {
        Article article = articleService.lockArticle(id, locked);
        return Result.success(locked ? "锁定成功" : "解锁成功", article);
    }
    
    @PutMapping("/{id}/top")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<Article> topArticle(@PathVariable Long id, @RequestParam boolean isTop) {
        Article article = articleService.topArticle(id, isTop);
        return Result.success(isTop ? "置顶成功" : "取消置顶成功", article);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR')")
    public Result<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id, null, true);
        return Result.success();
    }
}
