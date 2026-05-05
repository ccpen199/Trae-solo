package com.bbs.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bbs.entity.Article;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import java.util.List;

@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
    
    @Update("UPDATE articles SET view_count = view_count + 1 WHERE id = #{articleId}")
    int incrementViewCount(@Param("articleId") Long articleId);
    
    @Select("SELECT COUNT(*) FROM articles WHERE deleted = false")
    long countTotalArticles();
    
    @Select("SELECT SUM(view_count) FROM articles WHERE deleted = false")
    Long sumTotalViews();
    
    @Select("SELECT a.*, c.category_name, sc.sub_category_name, u.username as author_name, u.nickname as author_nickname " +
            "FROM articles a " +
            "LEFT JOIN categories c ON a.category_id = c.id " +
            "LEFT JOIN sub_categories sc ON a.sub_category_id = sc.id " +
            "LEFT JOIN users u ON a.user_id = u.id " +
            "WHERE a.id = #{id} AND a.deleted = false")
    Article selectArticleWithDetails(@Param("id") Long id);
    
    @Select("SELECT a.*, c.category_name, sc.sub_category_name, u.username as author_name, u.nickname as author_nickname " +
            "FROM articles a " +
            "LEFT JOIN categories c ON a.category_id = c.id " +
            "LEFT JOIN sub_categories sc ON a.sub_category_id = sc.id " +
            "LEFT JOIN users u ON a.user_id = u.id " +
            "WHERE a.deleted = false " +
            "ORDER BY a.is_top DESC, a.created_at DESC " +
            "LIMIT #{limit}")
    List<Article> selectRecentArticles(@Param("limit") int limit);
}
