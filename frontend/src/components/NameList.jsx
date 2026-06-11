import React from 'react';

function NameList({ names, selectedName, onSelect }) {
  if (!names || names.length === 0) return null;

  return (
    <div className="name-list">
      {names.map((name) => (
        <div 
          key={name.id}
          className={`name-item ${selectedName?.id === name.id ? 'selected' : ''}`}
          onClick={() => onSelect(name)}
        >
          <div className="name-header">
            <span className="name-text">
              {name.rank}. {name.fullName}
            </span>
            <span className="name-score">
              {name.analysis?.totalScore || 0}分
            </span>
          </div>
          <div className="name-meta">
            <span>五行: {name.analysis?.wuxingBalance?.score || 0}分</span>
            <span>五格: {name.analysis?.wuge?.score || 0}分</span>
            <span>{name.analysis?.fayinTone?.pattern || ''}</span>
            {name.analysis?.gua?.benGua && (
              <span>{name.analysis.gua.benGua.jixiong}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NameList;
