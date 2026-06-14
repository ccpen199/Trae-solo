import React from 'react';
import { Layout } from 'antd';
import { cn } from '@/lib/utils';

const { Footer: AntFooter } = Layout;

export interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <AntFooter
      className={cn(
        'bg-white dark:bg-neutral-800',
        'border-t border-neutral-100 dark:border-neutral-700',
        'text-center',
        className
      )}
      style={{ padding: '16px 24px' }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-neutral-500">
        <span>© 2024 山东省文化和旅游厅 版权所有</span>
        <span className="hidden sm:block text-neutral-300 dark:text-neutral-600">|</span>
        <span>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-500 transition-colors"
          >
            鲁ICP备XXXXXXXX号
          </a>
        </span>
        <span className="hidden sm:block text-neutral-300 dark:text-neutral-600">|</span>
        <span>
          <a
            href="http://www.beian.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-500 transition-colors flex items-center gap-1"
          >
            <span>🔒</span>
            鲁公网安备 XXXXXXXXXXXXX号
          </a>
        </span>
      </div>
      <div className="mt-1 text-xs text-neutral-400">
        技术支持：山东省文旅信息化建设项目组 | v1.0.0
      </div>
    </AntFooter>
  );
};

export default Footer;
