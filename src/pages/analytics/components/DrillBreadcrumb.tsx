import React from 'react';
import { RightOutlined } from '@ant-design/icons';

export interface BreadcrumbLevel {
  label: string;
  value: string;
}

interface DrillBreadcrumbProps {
  items: BreadcrumbLevel[];
  onNavigate: (index: number) => void;
}

const DrillBreadcrumb: React.FC<DrillBreadcrumbProps> = ({ items, onNavigate }) => {
  return (
    <div className="drill-breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={`${item.value}-${index}`}>
          {index > 0 && <RightOutlined className="breadcrumb-sep" />}
          <span
            className={`breadcrumb-item ${index === items.length - 1 ? 'active' : ''}`}
            onClick={() => {
              if (index < items.length - 1) {
                onNavigate(index);
              }
            }}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default DrillBreadcrumb;
