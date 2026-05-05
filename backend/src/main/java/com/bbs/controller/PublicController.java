package com.bbs.controller;

import com.bbs.common.PageResult;
import com.bbs.common.Result;
import com.bbs.entity.Article;
import com.bbs.entity.Category;
import com.bbs.service.ArticleService;
import com.bbs.service.CategoryService;
import javax.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {
    
    private final CategoryService categoryService;
    private final ArticleService articleService;
    
    @GetMapping("/categories")
    public Result<List<Category>> getCategories() {
        List<Category> categories = categoryService.getAllCategoriesWithSub();
        return Result.success(categories);
    }
    
    @GetMapping("/articles")
    public Result<PageResult<Article>> getArticles(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long subCategoryId,
            @RequestParam(required = false) String keyword) {
        PageResult<Article> result = articleService.getArticlePage(current, size, categoryId, subCategoryId, keyword);
        return Result.success(result);
    }
    
    @GetMapping("/articles/{id}")
    public Result<Article> getArticle(@PathVariable Long id, HttpServletRequest request) {
        Article article = articleService.getArticleById(id, true, request);
        return Result.success(article);
    }
    
    @GetMapping("/articles/recent")
    public Result<List<Article>> getRecentArticles(@RequestParam(defaultValue = "10") int limit) {
        List<Article> articles = articleService.getRecentArticles(limit);
        return Result.success(articles);
    }
    
    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = articleService.getStatistics();
        return Result.success(stats);
    }
}
