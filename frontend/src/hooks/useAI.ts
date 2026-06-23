import { useState, useCallback } from 'react';
import { propertyAPI, customerAPI } from '@/services/api';
import type { AITagResponse } from '@/types';

interface UseAIResult {
  isGenerating: boolean;
  tags: string[];
  confidence: number;
  generateTags: (text: string, type: 'property' | 'customer') => Promise<string[]>;
  resetTags: () => void;
}

const useAI = (): UseAIResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);

  const generateTags = useCallback(
    async (text: string, type: 'property' | 'customer'): Promise<string[]> => {
      if (!text.trim()) {
        setTags([]);
        setConfidence(0);
        return [];
      }

      setIsGenerating(true);
      try {
        let response: AITagResponse;
        if (type === 'property') {
          response = await propertyAPI.generateAITags(text);
        } else {
          response = await customerAPI.generateAITags(text);
        }
        setTags(response.tags);
        setConfidence(response.confidence);
        return response.tags;
      } catch (error) {
        console.error('AI tag generation error:', error);
        setTags([]);
        setConfidence(0);
        return [];
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const resetTags = useCallback(() => {
    setTags([]);
    setConfidence(0);
  }, []);

  return {
    isGenerating,
    tags,
    confidence,
    generateTags,
    resetTags,
  };
};

export default useAI;
