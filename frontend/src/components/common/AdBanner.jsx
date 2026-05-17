import React, { useState } from 'react';
import styled from 'styled-components';

const AdContainer = styled.div`
  background: ${props => props.$bgColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  border-radius: 12px;
  padding: 16px;
  margin: 16px 20px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 1;
  display: block;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255,255,255,0.3);
  }
`;

const AdLabel = styled.span`
  display: inline-block;
  background: rgba(255,255,255,0.2);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 8px;
`;

const AdTitle = styled.h4`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const AdDesc = styled.p`
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  margin: 0;
`;

const AdBanner = ({ ad, onClose }) => {
  const [visible, setVisible] = useState(true);

  if (!visible || !ad) return null;

  const handleClose = (e) => {
    e.stopPropagation();
    setVisible(false);
    if (onClose) onClose(ad.id);
  };

  return (
    <AdContainer $bgColor={ad.bgColor}>
      <CloseButton onClick={handleClose}>×</CloseButton>
      <AdLabel>广告</AdLabel>
      <AdTitle>{ad.title}</AdTitle>
      <AdDesc>{ad.description}</AdDesc>
    </AdContainer>
  );
};

export default AdBanner;
