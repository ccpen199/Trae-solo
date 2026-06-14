import { Request, Response, NextFunction } from 'express';

const defaultSensitiveWords: string[] = [
  '敏感词1',
  '敏感词2',
  '敏感词3'
];

interface SensitiveFilterOptions {
  words?: string[];
  replacement?: string;
}

const filterSensitiveWords = (text: string, words: string[], replacement: string): string => {
  let filteredText = text;
  words.forEach((word) => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, replacement);
  });
  return filteredText;
};

const containsSensitiveWords = (text: string, words: string[]): boolean => {
  return words.some((word) => {
    const regex = new RegExp(word, 'gi');
    return regex.test(text);
  });
};

const scanObjectForSensitiveWords = (
  obj: any,
  words: string[]
): { contains: boolean; paths: string[] } => {
  const paths: string[] = [];

  const scan = (value: any, currentPath: string): void => {
    if (typeof value === 'string') {
      if (containsSensitiveWords(value, words)) {
        paths.push(currentPath || 'root');
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        scan(item, `${currentPath}[${index}]`);
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach((key) => {
        scan(value[key], currentPath ? `${currentPath}.${key}` : key);
      });
    }
  };

  scan(obj, '');
  return {
    contains: paths.length > 0,
    paths
  };
};

export const sensitiveFilterMiddleware = (options: SensitiveFilterOptions = {}) => {
  const {
    words = defaultSensitiveWords,
    replacement = '***'
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      const scanResult = scanObjectForSensitiveWords(req.body, words);
      if (scanResult.contains) {
        res.status(400).json({
          message: '请求包含敏感词',
          sensitiveFields: scanResult.paths
        });
        return;
      }
    }

    if (req.query && typeof req.query === 'object') {
      const scanResult = scanObjectForSensitiveWords(req.query, words);
      if (scanResult.contains) {
        res.status(400).json({
          message: '请求包含敏感词',
          sensitiveFields: scanResult.paths
        });
        return;
      }
    }

    next();
  };
};

export const filterResponseMiddleware = (options: SensitiveFilterOptions = {}) => {
  const {
    words = defaultSensitiveWords,
    replacement = '***'
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = (body: any): Response => {
      if (typeof body === 'string') {
        body = filterSensitiveWords(body, words, replacement);
      } else if (typeof body === 'object' && body !== null) {
        const filterObject = (obj: any): any => {
          if (typeof obj === 'string') {
            return filterSensitiveWords(obj, words, replacement);
          }
          if (Array.isArray(obj)) {
            return obj.map(filterObject);
          }
          if (typeof obj === 'object' && obj !== null) {
            const filtered: any = {};
            Object.keys(obj).forEach((key) => {
              filtered[key] = filterObject(obj[key]);
            });
            return filtered;
          }
          return obj;
        };
        body = filterObject(body);
      }
      return originalJson(body);
    };

    next();
  };
};
