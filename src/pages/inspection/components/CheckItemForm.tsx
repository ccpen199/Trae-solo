import React from 'react';
import { Card, Form, Input, Select, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface CheckItem {
  name: string;
  category: string;
}

interface CheckItemFormProps {
  value?: CheckItem[];
  onChange?: (items: CheckItem[]) => void;
  readonly?: boolean;
}

const categoryOptions = [
  { label: '消防安全', value: '消防安全' },
  { label: '环境卫生', value: '环境卫生' },
  { label: '设施设备', value: '设施设备' },
  { label: '服务质量', value: '服务质量' },
  { label: '应急预案', value: '应急预案' },
  { label: '安全防护', value: '安全防护' },
];

const templateOptions = [
  {
    label: '消防安全检查模板',
    value: 'fire',
    items: [
      { name: '消防通道是否畅通', category: '消防安全' },
      { name: '灭火器是否在有效期内', category: '消防安全' },
      { name: '消防标识是否完整', category: '消防安全' },
      { name: '应急照明是否正常', category: '消防安全' },
    ],
  },
  {
    label: '环境卫生检查模板',
    value: 'hygiene',
    items: [
      { name: '公共区域卫生清洁', category: '环境卫生' },
      { name: '垃圾分类是否规范', category: '环境卫生' },
      { name: '卫生间设施完好', category: '环境卫生' },
    ],
  },
  {
    label: '设施设备检查模板',
    value: 'equipment',
    items: [
      { name: '监控设备运行正常', category: '设施设备' },
      { name: '门禁系统运行正常', category: '设施设备' },
      { name: '广播系统运行正常', category: '设施设备' },
    ],
  },
];

const CheckItemForm: React.FC<CheckItemFormProps> = ({ value = [], onChange, readonly }) => {
  const handleChange = (index: number, field: keyof CheckItem, val: string) => {
    const newItems = [...value];
    newItems[index] = { ...newItems[index], [field]: val };
    onChange?.(newItems);
  };

  const handleAdd = () => {
    onChange?.([...value, { name: '', category: '消防安全' }]);
  };

  const handleRemove = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange?.(newItems);
  };

  const handleTemplate = (templateValue: string) => {
    const tpl = templateOptions.find((t) => t.value === templateValue);
    if (tpl) {
      const merged = [...value, ...tpl.items];
      onChange?.(merged);
    }
  };

  return (
    <div>
      {!readonly && (
        <div className="mb-3 flex items-center gap-3">
          <Select
            placeholder="从模板选择检查项"
            style={{ width: 220 }}
            options={templateOptions}
            onChange={handleTemplate}
            allowClear
          />
          <span className="text-neutral-400">或</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
            自定义添加
          </Button>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => (
            <Card
              key={index}
              size="small"
              className="shadow-none border border-neutral-100 dark:border-neutral-700"
              bodyStyle={{ padding: '8px 12px' }}
              extra={
                !readonly && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(index)}
                  />
                )
              }
            >
              <Space size="middle">
                <span className="text-neutral-400 text-xs w-6">#{index + 1}</span>
                {readonly ? (
                  <>
                    <span>{item.name}</span>
                    <span className="text-neutral-400 text-xs">[{item.category}]</span>
                  </>
                ) : (
                  <>
                    <Input
                      value={item.name}
                      onChange={(e) => handleChange(index, 'name', e.target.value)}
                      placeholder="检查项名称"
                      style={{ width: 200 }}
                    />
                    <Select
                      value={item.category}
                      onChange={(val) => handleChange(index, 'category', val)}
                      options={categoryOptions}
                      style={{ width: 140 }}
                    />
                  </>
                )}
              </Space>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckItemForm;
