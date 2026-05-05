const indexStore = require('./indexStore');

class SearchEngine {
  constructor() {
    this.currentIndex = null;
  }

  async _ensureIndex() {
    if (!this.currentIndex) {
      this.currentIndex = await indexStore.getIndex();
    }
    return this.currentIndex;
  }

  tokenize(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const tokens = query
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length >= 1);

    return [...new Set(tokens)];
  }

  calculateScore(file, tokens) {
    let score = 0;
    const filenameLower = file.filename.toLowerCase();
    const keywords = file.keywords || [];

    tokens.forEach(token => {
      const tokenLower = token.toLowerCase();
      
      if (filenameLower.includes(tokenLower)) {
        const position = filenameLower.indexOf(tokenLower);
        score += 50 - position;
        score += token.length * 2;
      }

      const exactMatch = keywords.includes(tokenLower);
      if (exactMatch) {
        score += 20;
      }

      const partialMatches = keywords.filter(kw => kw.includes(tokenLower));
      score += partialMatches.length * 5;

      if (file.contentPreview) {
        const contentLower = file.contentPreview.toLowerCase();
        if (contentLower.includes(tokenLower)) {
          score += 15;
        }
      }
    });

    const recentTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const modifiedTime = new Date(file.modifiedTime).getTime();
    if (modifiedTime > recentTime) {
      score += 10;
    }

    return score;
  }

  findHighlights(content, tokens, maxSnippets = 3) {
    if (!content || !tokens || tokens.length === 0) {
      return [];
    }

    const highlights = [];
    const contentLower = content.toLowerCase();
    const snippetSize = 100;

    tokens.forEach(token => {
      const tokenLower = token.toLowerCase();
      let position = contentLower.indexOf(tokenLower);

      while (position !== -1 && highlights.length < maxSnippets) {
        const start = Math.max(0, position - snippetSize / 2);
        const end = Math.min(content.length, position + token.length + snippetSize / 2);
        
        let snippet = content.substring(start, end);
        
        if (start > 0) {
          snippet = '...' + snippet;
        }
        if (end < content.length) {
          snippet = snippet + '...';
        }

        tokens.forEach(t => {
          const regex = new RegExp(`(${this.escapeRegex(t)})`, 'gi');
          snippet = snippet.replace(regex, '|||HIGHLIGHT|||$1|||/HIGHLIGHT|||');
        });

        highlights.push({
          snippet,
          position,
          length: token.length,
        });

        position = contentLower.indexOf(tokenLower, position + token.length);
      }
    });

    return highlights.slice(0, maxSnippets);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async search(query, options = {}) {
    const index = await this._ensureIndex();
    
    if (!index || !index.files || index.files.length === 0) {
      return {
        success: false,
        error: '索引不存在或为空，请先生成索引',
        results: [],
        total: 0,
      };
    }

    const tokens = this.tokenize(query);
    
    if (tokens.length === 0) {
      return {
        success: false,
        error: '搜索词无效',
        results: [],
        total: 0,
      };
    }

    const { limit = 100, offset = 0, sortBy = 'relevance' } = options;
    
    const results = [];
    
    for (const file of index.files) {
      const score = this.calculateScore(file, tokens);
      
      if (score > 0) {
        const highlights = this.findHighlights(
          file.contentPreview || file.filename,
          tokens
        );

        results.push({
          ...file,
          score,
          highlights,
        });
      }
    }

    if (sortBy === 'relevance') {
      results.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'name') {
      results.sort((a, b) => a.filename.localeCompare(b.filename));
    } else if (sortBy === 'date') {
      results.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    } else if (sortBy === 'size') {
      results.sort((a, b) => b.size - a.size);
    }

    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    const formattedResults = paginatedResults.map(result => {
      const formattedHighlights = result.highlights.map(h => ({
        snippet: h.snippet
          .replace(/\|\|\|HIGHLIGHT\|\|\|/g, '<mark>')
          .replace(/\|\|\|\/HIGHLIGHT\|\|\|/g, '</mark>'),
      }));

      return {
        id: result.id,
        filename: result.filename,
        path: result.path,
        directory: result.directory,
        extension: result.extension,
        size: result.size,
        modifiedTime: result.modifiedTime,
        score: result.score,
        highlights: formattedHighlights,
        hasContent: result.hasContent,
      };
    });

    return {
      success: true,
      query: query,
      tokens: tokens,
      results: formattedResults,
      total: total,
      limit: limit,
      offset: offset,
      sortBy: sortBy,
    };
  }

  async refreshIndex() {
    this.currentIndex = null;
    await this._ensureIndex();
    return true;
  }
}

module.exports = new SearchEngine();
