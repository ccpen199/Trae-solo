import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.$fullPage ? '100px' : '40px'};
`;

const Spinner = styled.div`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  border: 3px solid #f0f0f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Loading = ({ fullPage = false, size }) => (
  <LoadingContainer $fullPage={fullPage}>
    <Spinner $size={size} />
  </LoadingContainer>
);

export default Loading;
