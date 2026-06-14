import React from 'react';
import { Form, Button, Row, Col, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FormProps, FormItemProps } from 'antd';

export interface SearchFormField extends Omit<FormItemProps, 'name'> {
  name: string;
  label?: string;
  render: React.ReactNode;
  span?: number;
  hideInSearch?: boolean;
}

export interface SearchFormProps extends Omit<FormProps, 'onFinish'> {
  fields: SearchFormField[];
  onSearch?: (values: Record<string, any>) => void;
  onReset?: () => void;
  showExpand?: boolean;
  defaultExpand?: boolean;
  searchText?: string;
  resetText?: string;
  className?: string;
  formClassName?: string;
  labelWidth?: number;
}

const SearchForm: React.FC<SearchFormProps> = ({
  fields,
  onSearch,
  onReset,
  showExpand = true,
  defaultExpand = false,
  searchText = '搜索',
  resetText = '重置',
  className,
  formClassName,
  labelWidth = 80,
  ...rest
}) => {
  const [form] = Form.useForm();
  const [expanded, setExpanded] = useState(defaultExpand);
  const [loading, setLoading] = useState(false);

  const visibleFields = fields.filter(f => !f.hideInSearch);
  const defaultVisibleCount = 3;
  const showExpandBtn = showExpand && visibleFields.length > defaultVisibleCount;
  const displayFields = expanded ? visibleFields : visibleFields.slice(0, defaultVisibleCount);

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      onSearch?.(values);
    } catch (error) {
      console.error('Search validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-lg p-4 mb-4 border border-neutral-100 dark:border-neutral-700',
        className
      )}
      onKeyDown={handleKeyDown}
    >
      <Form
        form={form}
        layout="inline"
        className={cn('w-full', formClassName)}
        initialValues={{}}
        {...rest}
      >
        <Row gutter={[16, 16]} className="w-full">
          {displayFields.map((field, index) => {
            const { name, label, render, span = 8, ...restField } = field;
            return (
              <Col key={name || index} xs={24} sm={12} md={8} lg={span} xl={span}>
                <Form.Item
                  name={name}
                  label={label}
                  labelCol={{ style: { width: labelWidth, flex: `0 0 ${labelWidth}px` } }}
                  wrapperCol={{ style: { flex: 1 } }}
                  className="!mb-0 w-full"
                  {...restField}
                >
                  {render}
                </Form.Item>
              </Col>
            );
          })}
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Form.Item className="!mb-0 w-full justify-end">
              <Space>
                <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={handleSearch}>
                  {searchText}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  {resetText}
                </Button>
                {showExpandBtn && (
                  <Button
                    type="text"
                    onClick={() => setExpanded(!expanded)}
                    className="!text-primary-500"
                  >
                    {expanded ? (
                      <span className="flex items-center gap-1">
                        收起 <UpOutlined />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        展开 <DownOutlined />
                      </span>
                    )}
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default SearchForm;
