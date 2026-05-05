// JavaScript示例代码
function searchFiles(query, index) {
  const results = [];
  
  for (const file of index) {
    if (file.content.includes(query)) {
      results.push(file);
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

// 索引生成
function generateIndex(directory) {
  return {
    files: [],
    indexedAt: new Date().toISOString()
  };
}

console.log("搜索功能已就绪");
