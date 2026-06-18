import React, { memo, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '../../store/appStore';
import { mockKnowledgeQA } from '../../data/mockPolicies';
import { mockRecommendServices } from '../../data/mockServices';
import type { GovernmentService } from '../../types';

interface Props {
  placeholder?: string;
  showHotKeywords?: boolean;
  onSearch?: (keyword: string) => void;
  onFocus?: () => void;
}

const hotKeywords = ['新生儿落户', '公积金提取', '育儿补贴', '医保报销', '养老认证', '幼儿园报名'];

const SearchBar: React.FC<Props> = memo(({
  placeholder = '搜索办事服务、政策文件、常见问题...',
  showHotKeywords = true,
  onSearch,
  onFocus
}) => {
  const speak = useAppStore(s => s.speak);
  const [keyword, setKeyword] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ type: string; items: { id: string; text: string; sub?: string }[] }[]>([]);

  const handleInput = (value: string) => {
    setKeyword(value);
    if (value.length >= 2) {
      setShowSuggestions(true);
      const serviceMatches = mockRecommendServices
        .filter(s => s.name.includes(value) || s.shortName.includes(value) || s.tags.some(t => t.includes(value)))
        .slice(0, 5)
        .map(s => ({ id: s.id, text: s.name, sub: s.department }));

      const qaMatches = mockKnowledgeQA
        .filter(q => q.question.includes(value) || q.answer.includes(value))
        .slice(0, 3)
        .map(q => ({ id: q.id, text: q.question, sub: '知识库问答' }));

      const result: { type: string; items: { id: string; text: string; sub?: string }[] }[] = [];
      if (serviceMatches.length > 0) result.push({ type: '办事服务', items: serviceMatches });
      if (qaMatches.length > 0) result.push({ type: '知识问答', items: qaMatches });
      setSuggestions(result);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    if (!keyword.trim()) {
      Taro.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    speak(`正在搜索${keyword}`);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(keyword);
    } else {
      Taro.navigateTo({ url: `/pages/chat-qa/index?keyword=${encodeURIComponent(keyword)}` });
    }
  };

  const handleKeywordClick = (word: string) => {
    setKeyword(word);
    handleInput(word);
    speak(`搜索热词${word}`);
  };

  const handleSuggestionClick = (type: string, item: { id: string; text: string }) => {
    speak(item.text);
    setShowSuggestions(false);
    if (type === '办事服务') {
      Taro.navigateTo({ url: `/pages/service-detail/index?id=${item.id}` });
    } else {
      Taro.navigateTo({ url: `/pages/chat-qa/index?keyword=${encodeURIComponent(item.text)}` });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.searchBox}>
        <View className={styles.searchIcon}>
          <Text>🔍</Text>
        </View>
        <Input
          className={styles.searchInput}
          placeholder={placeholder}
          placeholderClass={styles.placeholder}
          value={keyword}
          onInput={(e) => handleInput(e.detail.value)}
          onConfirm={handleSearch}
          onFocus={() => { onFocus?.(); setShowSuggestions(keyword.length >= 2); }}
          confirmType="search"
        />
        {keyword && (
          <View className={styles.clearBtn} onClick={() => { setKeyword(''); setShowSuggestions(false); }}>
            <Text>✕</Text>
          </View>
        )}
        <View className={styles.searchBtn} onClick={handleSearch}>
          <Text>搜索</Text>
        </View>
      </View>

      {showHotKeywords && !keyword && (
        <View className={styles.hotKeywords}>
          <Text className={styles.hotLabel}>🔥 热搜：</Text>
          {hotKeywords.map(word => (
            <View key={word} className={styles.hotTag} onClick={() => handleKeywordClick(word)}>
              <Text>{word}</Text>
            </View>
          ))}
        </View>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View className={styles.suggestionPanel}>
          {suggestions.map(group => (
            <View key={group.type} className={styles.suggestionGroup}>
              <View className={styles.suggestionGroupLabel}>
                <Text>{group.type}</Text>
              </View>
              {group.items.map(item => (
                <View
                  key={item.id}
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(group.type, item)}
                >
                  <View className={styles.suggestionLeft}>
                    <Text className={styles.suggestionText}>{item.text}</Text>
                    {item.sub && <Text className={styles.suggestionSub}>{item.sub}</Text>}
                  </View>
                  <Text className={styles.suggestionArrow}>→</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

export default SearchBar;
