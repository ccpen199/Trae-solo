package com.guizhou.platform.ticket.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.ticket.dto.request.KnowledgeDTO;
import com.guizhou.platform.ticket.entity.KnowledgeArticle;
import com.guizhou.platform.ticket.mapper.KnowledgeArticleMapper;
import com.guizhou.platform.ticket.service.KnowledgeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "知识库管理", description = "知识库文章的创建、查询、搜索、推荐")
@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    @Resource
    private KnowledgeService knowledgeService;

    @Resource
    private KnowledgeArticleMapper articleMapper;

    @Operation(summary = "创建知识库文章")
    @PostMapping("/create")
    public Result<String> createArticle(@Valid @RequestBody KnowledgeDTO dto) {
        return Result.success(knowledgeService.createArticle(dto));
    }

    @Operation(summary = "更新知识库文章")
    @PutMapping("/{id}")
    public Result<Void> updateArticle(@PathVariable Long id, @Valid @RequestBody KnowledgeDTO dto) {
        knowledgeService.updateArticle(id, dto);
        return Result.success();
    }

    @Operation(summary = "删除知识库文章")
    @DeleteMapping("/{id}")
    public Result<Void> deleteArticle(@PathVariable Long id) {
        knowledgeService.deleteArticle(id);
        return Result.success();
    }

    @Operation(summary = "获取知识库文章详情")
    @GetMapping("/{id}")
    public Result<KnowledgeArticle> getArticle(@PathVariable Long id) {
        return Result.success(knowledgeService.getArticle(id));
    }

    @Operation(summary = "搜索知识库")
    @GetMapping("/search")
    public Result<List<KnowledgeArticle>> searchArticles(@RequestParam String keyword,
                                                          @RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(knowledgeService.searchArticles(keyword, limit));
    }

    @Operation(summary = "根据内容推荐知识库文章")
    @PostMapping("/recommend")
    public Result<List<KnowledgeArticle>> recommendArticles(@RequestParam String content) {
        return Result.success(knowledgeService.recommendArticles(content));
    }

    @Operation(summary = "同步文章到ES")
    @PostMapping("/{id}/sync-es")
    public Result<Void> syncToElasticsearch(@PathVariable Long id) {
        knowledgeService.syncToElasticsearch(id);
        return Result.success();
    }

    @Operation(summary = "分页查询知识库文章")
    @GetMapping("/page")
    public Result<Page<KnowledgeArticle>> pageArticles(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String category) {
        LambdaQueryWrapper<KnowledgeArticle> wrapper = new LambdaQueryWrapper<>();
        if (category != null) {
            wrapper.eq(KnowledgeArticle::getCategory, category);
        }
        wrapper.eq(KnowledgeArticle::getArticleStatus, 1)
                .orderByDesc(KnowledgeArticle::getViewCount);
        return Result.success(articleMapper.selectPage(new Page<>(pageNum, pageSize), wrapper));
    }
}
