import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree, Card, Input, Breadcrumb, Row, Col, Tag, Empty, Drawer, Button, Descriptions, Divider, theme } from 'antd';
import { SearchOutlined, HomeOutlined, FileTextOutlined, DollarOutlined, FundOutlined, DownloadOutlined, ThunderboltOutlined, HistoryOutlined } from '@ant-design/icons';
import type { TreeProps } from 'antd';

interface PatentItem {
  id: string;
  title: string;
  patentNumber: string;
  filingDate: string;
  applicant: string;
  abstract: string;
  ipcCode: string;
  status: string;
}

const ipcTreeData: TreeProps['treeData'] = [
  {
    key: 'A',
    title: 'A部 - 生活需要',
    children: [
      {
        key: 'A01',
        title: 'A01 - 农业',
        children: [
          {
            key: 'A01B',
            title: 'A01B - 土壤耕作',
            children: [
              { key: 'A01B1/00', title: 'A01B1/00 - 手动工具' },
              { key: 'A01B3/00', title: 'A01B3/00 - 带旋转部件的犁' },
              { key: 'A01B5/00', title: 'A01B5/00 - 非旋转部件的犁' },
            ],
          },
          {
            key: 'A01C',
            title: 'A01C - 种植',
            children: [
              { key: 'A01C1/00', title: 'A01C1/00 - 种子处理' },
              { key: 'A01C7/00', title: 'A01C7/00 - 播种' },
            ],
          },
          {
            key: 'A01D',
            title: 'A01D - 收获',
            children: [
              { key: 'A01D1/00', title: 'A01D1/00 - 手动收割工具' },
              { key: 'A01D7/00', title: 'A01D7/00 - 块根作物收割机' },
            ],
          },
        ],
      },
      {
        key: 'A61',
        title: 'A61 - 医学或兽医学',
        children: [
          {
            key: 'A61B',
            title: 'A61B - 诊断',
            children: [
              { key: 'A61B5/00', title: 'A61B5/00 - 测量生物信号' },
              { key: 'A61B6/00', title: 'A61B6/00 - 放射诊断' },
            ],
          },
          {
            key: 'A61K',
            title: 'A61K - 医药配制品',
            children: [
              { key: 'A61K9/00', title: 'A61K9/00 - 特殊物理形态的制剂' },
              { key: 'A61K31/00', title: 'A61K31/00 - 含有机活性成分' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'B',
    title: 'B部 - 作业、运输',
    children: [
      {
        key: 'B60',
        title: 'B60 - 一般车辆',
        children: [
          {
            key: 'B60L',
            title: 'B60L - 电动车辆动力装置',
            children: [
              { key: 'B60L7/00', title: 'B60L7/00 - 电动制动' },
              { key: 'B60L9/00', title: 'B60L9/00 - 供电装置' },
            ],
          },
        ],
      },
      {
        key: 'B82',
        title: 'B82 - 纳米技术',
        children: [
          {
            key: 'B82Y',
            title: 'B82Y - 纳米结构特定用途',
            children: [
              { key: 'B82Y5/00', title: 'B82Y5/00 - 纳米生物技术' },
              { key: 'B82Y10/00', title: 'B82Y10/00 - 纳米电子学' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'C',
    title: 'C部 - 化学、冶金',
    children: [
      {
        key: 'C07',
        title: 'C07 - 有机化学',
        children: [
          {
            key: 'C07D',
            title: 'C07D - 杂环化合物',
            children: [
              { key: 'C07D233/00', title: 'C07D233/00 - 咪唑啉环' },
              { key: 'C07D307/00', title: 'C07D307/00 - 五元杂环' },
            ],
          },
        ],
      },
      {
        key: 'C22',
        title: 'C22 - 冶金',
        children: [
          {
            key: 'C22B',
            title: 'C22B - 金属生产',
            children: [
              { key: 'C22B3/00', title: 'C22B3/00 - 湿法提取' },
              { key: 'C22B9/00', title: 'C22B9/00 - 金属重熔' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'G',
    title: 'G部 - 物理',
    children: [
      {
        key: 'G06',
        title: 'G06 - 计算',
        children: [
          {
            key: 'G06F',
            title: 'G06F - 电数字数据处理',
            children: [
              { key: 'G06F3/00', title: 'G06F3/00 - 输入装置' },
              { key: 'G06F16/00', title: 'G06F16/00 - 信息检索' },
              { key: 'G06F21/00', title: 'G06F21/00 - 安全装置' },
            ],
          },
          {
            key: 'G06N',
            title: 'G06N - 基于特定数学模型的计算',
            children: [
              { key: 'G06N3/00', title: 'G06N3/00 - 神经网络' },
              { key: 'G06N20/00', title: 'G06N20/00 - 机器学习' },
            ],
          },
        ],
      },
      {
        key: 'G01',
        title: 'G01 - 测量',
        children: [
          {
            key: 'G01N',
            title: 'G01N - 材料分析',
            children: [
              { key: 'G01N33/00', title: 'G01N33/00 - 生物化学分析' },
              { key: 'G01N21/00', title: 'G01N21/00 - 光学分析' },
            ],
          },
        ],
      },
    ],
  },
];

const mockPatents: PatentItem[] = [
  {
    id: '1',
    title: '一种智能土壤耕作装置',
    patentNumber: 'CN202410123456.7',
    filingDate: '2024-03-15',
    applicant: '北京农业科技有限公司',
    abstract: '本发明涉及一种智能土壤耕作装置，包括机架、耕作部件和智能控制系统，能够根据土壤湿度和硬度自动调节耕作深度和力度，提高耕作效率。',
    ipcCode: 'A01B',
    status: '实质审查',
  },
  {
    id: '2',
    title: '基于深度学习的农作物种植优化方法',
    patentNumber: 'CN202410234567.8',
    filingDate: '2024-05-20',
    applicant: '上海智慧农业研究院',
    abstract: '本发明公开了一种基于深度学习的农作物种植优化方法，通过分析土壤数据、气象数据和作物生长数据，生成最优种植方案。',
    ipcCode: 'A01C',
    status: '已授权',
  },
  {
    id: '3',
    title: '一种便携式生物信号检测仪',
    patentNumber: 'CN202310345678.9',
    filingDate: '2023-08-10',
    applicant: '深圳医疗科技有限公司',
    abstract: '本发明提供一种便携式生物信号检测仪，集成了心电、脑电、肌电多模态信号采集功能，体积小巧，适用于家庭健康监测。',
    ipcCode: 'A61B5/00',
    status: '已授权',
  },
  {
    id: '4',
    title: '纳米靶向药物递送系统',
    patentNumber: 'CN202410456789.0',
    filingDate: '2024-01-08',
    applicant: '广州生物医药有限公司',
    abstract: '本发明涉及一种纳米靶向药物递送系统，利用纳米载体将药物精准递送至病灶部位，减少副作用，提高治疗效果。',
    ipcCode: 'A61K9/00',
    status: '实质审查',
  },
  {
    id: '5',
    title: '电动汽车无线充电系统及方法',
    patentNumber: 'CN202410567890.1',
    filingDate: '2024-06-22',
    applicant: '比亚迪股份有限公司',
    abstract: '本发明公开了一种电动汽车无线充电系统，采用磁共振耦合技术，实现高效无线能量传输，充电效率达92%以上。',
    ipcCode: 'B60L9/00',
    status: '初步审查',
  },
  {
    id: '6',
    title: '基于纳米材料的生物传感器',
    patentNumber: 'CN202310678901.2',
    filingDate: '2023-11-30',
    applicant: '浙江大学',
    abstract: '本发明涉及一种基于碳纳米管的生物传感器，利用纳米材料的高比表面积特性，实现对生物标志物的高灵敏度检测。',
    ipcCode: 'B82Y5/00',
    status: '已授权',
  },
  {
    id: '7',
    title: '一种杂环化合物的合成方法',
    patentNumber: 'CN202410789012.3',
    filingDate: '2024-04-18',
    applicant: '中国化工集团',
    abstract: '本发明提供一种新型咪唑类杂环化合物的合成方法，反应条件温和，产率高，适用于工业化大规模生产。',
    ipcCode: 'C07D233/00',
    status: '实质审查',
  },
  {
    id: '8',
    title: '基于Transformer的中文文本检索系统',
    patentNumber: 'CN202410890123.4',
    filingDate: '2024-07-05',
    applicant: '阿里巴巴集团',
    abstract: '本发明公开了一种基于Transformer架构的中文文本检索系统，采用预训练语言模型对查询和文档进行语义编码，大幅提升检索准确率。',
    ipcCode: 'G06F16/00',
    status: '初步审查',
  },
  {
    id: '9',
    title: '一种联邦学习隐私保护方法',
    patentNumber: 'CN202410901234.5',
    filingDate: '2024-09-12',
    applicant: '腾讯科技（深圳）有限公司',
    abstract: '本发明涉及一种联邦学习中的差分隐私保护方法，通过自适应噪声添加机制，在保证模型精度的同时有效保护参与方数据隐私。',
    ipcCode: 'G06N20/00',
    status: '实质审查',
  },
  {
    id: '10',
    title: '光谱分析检测食品中有害物质的方法',
    patentNumber: 'CN202310012345.6',
    filingDate: '2023-06-25',
    applicant: '中国检验认证集团',
    abstract: '本发明提供一种基于近红外光谱分析的食品有害物质快速检测方法，检测速度快、精度高，可实现现场实时检测。',
    ipcCode: 'G01N21/00',
    status: '已授权',
  },
  {
    id: '11',
    title: '一种手扶式微型耕作机',
    patentNumber: 'CN202310123456.0',
    filingDate: '2023-04-10',
    applicant: '山东农机有限公司',
    abstract: '本发明涉及一种手扶式微型耕作机，适用于小面积农田和温室大棚，具有操作简便、耕作深度可调的特点。',
    ipcCode: 'A01B1/00',
    status: '已授权',
  },
];

const statusColorMap: Record<string, string> = {
  '已授权': 'green',
  '实质审查': 'blue',
  '初步审查': 'orange',
  '已驳回': 'red',
};

function getAncestorKeys(key: string): string[] {
  const result: string[] = [];
  if (key.length >= 1) result.push(key.slice(0, 1));
  if (key.length >= 3 && key.slice(0, 3) !== key) result.push(key.slice(0, 3));
  if (key.length >= 4 && key.slice(0, 4) !== key) result.push(key.slice(0, 4));
  result.push(key);
  return [...new Set(result)];
}

const PatentIPCNav: React.FC = () => {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPatent, setSelectedPatent] = useState<PatentItem | null>(null);
  const [recentViewed, setRecentViewed] = useState<PatentItem[]>([
    mockPatents[7],
    mockPatents[2],
    mockPatents[4],
  ]);
  const { token } = theme.useToken();

  const filteredPatents = useMemo(() => {
    if (!selectedKey) return [];
    return mockPatents.filter((p) => p.ipcCode === selectedKey || p.ipcCode.startsWith(selectedKey));
  }, [selectedKey]);

  const breadcrumbItems = useMemo(() => {
    if (!selectedKey) return [];
    const ancestors = getAncestorKeys(selectedKey);
    return ancestors.map((k) => {
      const pathMap: Record<string, string> = {
        'A': 'A部 - 生活需要',
        'A01': 'A01 - 农业',
        'A01B': 'A01B - 土壤耕作',
        'A01C': 'A01C - 种植',
        'A01D': 'A01D - 收获',
        'A61': 'A61 - 医学或兽医学',
        'A61B': 'A61B - 诊断',
        'A61K': 'A61K - 医药配制品',
        'B': 'B部 - 作业、运输',
        'B60': 'B60 - 一般车辆',
        'B60L': 'B60L - 电动车辆动力装置',
        'B82': 'B82 - 纳米技术',
        'B82Y': 'B82Y - 纳米结构特定用途',
        'C': 'C部 - 化学、冶金',
        'C07': 'C07 - 有机化学',
        'C07D': 'C07D - 杂环化合物',
        'C22': 'C22 - 冶金',
        'C22B': 'C22B - 金属生产',
        'G': 'G部 - 物理',
        'G06': 'G06 - 计算',
        'G06F': 'G06F - 电数字数据处理',
        'G06N': 'G06N - 基于特定数学模型的计算',
        'G01': 'G01 - 测量',
        'G01N': 'G01N - 材料分析',
      };
      return { title: pathMap[k] ?? k };
    });
  }, [selectedKey]);

  const handleSelect: TreeProps['onSelect'] = (keys) => {
    if (keys.length > 0) {
      setSelectedKey(keys[0] as string);
    }
  };

  const handlePatentClick = (patent: PatentItem) => {
    setSelectedPatent(patent);
    setDrawerOpen(true);
    setRecentViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== patent.id);
      return [patent, ...filtered].slice(0, 5);
    });
  };

  const filterTree = (data: NonNullable<TreeProps['treeData']>): NonNullable<TreeProps['treeData']> => {
    if (!searchValue) return data;
    return data
      .map((item) => {
        const titleStr = typeof item.title === 'string' ? item.title : '';
        const keyStr = typeof item.key === 'string' ? item.key : '';
        const matchesSelf = titleStr.toLowerCase().includes(searchValue.toLowerCase()) || keyStr.toLowerCase().includes(searchValue.toLowerCase());
        const filteredChildren = item.children ? filterTree(item.children) : [];
        if (matchesSelf || filteredChildren.length > 0) {
          return { ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  const displayedTreeData = searchValue ? filterTree(ipcTreeData ?? []) : ipcTreeData;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, color: token.colorTextHeading }}>IPC分类导航</h2>
        <span style={{ color: token.colorTextSecondary, fontSize: 13 }}>按国际专利分类号浏览和检索专利</span>
      </div>

      <Row gutter={16} style={{ minHeight: 600 }}>
        <Col span={8}>
          <Card
            title="IPC分类目录"
            styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}
            style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <Input
              placeholder="搜索IPC分类号..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              <Tree
                treeData={displayedTreeData}
                onSelect={handleSelect}
                defaultExpandAll={!!searchValue}
                showLine={{ showLeafIcon: false }}
                style={{ fontSize: 13 }}
              />
            </div>
          </Card>
        </Col>

        <Col span={16}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col flex="auto">
              {selectedKey && (
                <Card
                  style={{
                    borderRadius: 12,
                    minHeight: 600,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  styles={{ body: { padding: 20 } }}
                >
                  <Breadcrumb
                    style={{ marginBottom: 16 }}
                    items={[
                      { title: <><HomeOutlined /><span style={{ marginLeft: 4 }}>IPC分类</span></> },
                      ...breadcrumbItems.map((item) => ({ title: item.title })),
                    ]}
                  />
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      分类下专利（{filteredPatents.length}件）
                    </span>
                  </div>
                  {filteredPatents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filteredPatents.map((patent) => (
                        <Card
                          key={patent.id}
                          size="small"
                          hoverable
                          style={{
                            borderRadius: 10,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                          styles={{ body: { padding: 16 } }}
                          onClick={() => handlePatentClick(patent)}
                        >
                          <Row align="middle" gutter={12}>
                            <Col flex="none">
                              <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}08)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                              </div>
                            </Col>
                            <Col flex="auto">
                              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{patent.title}</div>
                              <div style={{ color: token.colorTextSecondary, fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <span>专利号：{patent.patentNumber}</span>
                                <span>申请日：{patent.filingDate}</span>
                                <span>申请人：{patent.applicant}</span>
                              </div>
                            </Col>
                            <Col flex="none">
                              <Tag color={statusColorMap[patent.status] ?? 'default'}>{patent.status}</Tag>
                            </Col>
                          </Row>
                          <div style={{
                            marginTop: 10,
                            padding: '8px 12px',
                            background: token.colorBgLayout,
                            borderRadius: 8,
                            fontSize: 12,
                            color: token.colorTextSecondary,
                            lineHeight: 1.7,
                          }}>
                            {patent.abstract}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty description="该分类下暂无专利" style={{ marginTop: 60 }} />
                  )}
                </Card>
              )}
              {!selectedKey && (
                <Card
                  style={{ borderRadius: 12, minHeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  styles={{ body: { padding: '60px 20px' } }}
                >
                  <Empty description="请在左侧选择IPC分类节点查看专利" style={{ marginTop: 40 }} />
                </Card>
              )}
            </Col>

            <Col flex="260px">
              <Card
                title={<><ThunderboltOutlined style={{ marginRight: 6 }} />快捷办理</>}
                size="small"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                }}
                styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}`, fontSize: 14 } }}
              >
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>本分类下待缴费</span>
                    <Tag color="orange" style={{ margin: 0, fontWeight: 700 }}>3件</Tag>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<DollarOutlined />}
                    block
                    onClick={() => navigate('/patent/fee-reminder')}
                  >
                    前往年费代缴
                  </Button>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>本分类下待答辩</span>
                    <Tag color="red" style={{ margin: 0, fontWeight: 700 }}>1件</Tag>
                  </div>
                  <Button
                    size="small"
                    icon={<FileTextOutlined />}
                    block
                    onClick={() => navigate('/patent/ipc-nav')}
                  >
                    查看答辩详情
                  </Button>
                </div>
              </Card>

              <Card
                title={<><HistoryOutlined style={{ marginRight: 6 }} />最近浏览</>}
                size="small"
                style={{ borderRadius: 12, marginTop: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}`, fontSize: 14 } }}
              >
                {recentViewed.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {recentViewed.map((p) => (
                      <Tag
                        key={p.id}
                        style={{ cursor: 'pointer', borderRadius: 4, fontSize: 12 }}
                        color="processing"
                        onClick={() => handlePatentClick(p)}
                      >
                        {p.title.length > 8 ? p.title.slice(0, 8) + '...' : p.title}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: token.colorTextSecondary }}>暂无浏览记录</span>
                )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Drawer
        title={selectedPatent?.title}
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedPatent(null);
        }}
      >
        {selectedPatent && (
          <div>
            <Descriptions
              column={1}
              size="small"
              bordered
              style={{ marginBottom: 24 }}
              contentStyle={{ fontSize: 13 }}
              labelStyle={{ fontSize: 13, fontWeight: 500, width: 100 }}
            >
              <Descriptions.Item label="专利号">{selectedPatent.patentNumber}</Descriptions.Item>
              <Descriptions.Item label="申请日期">{selectedPatent.filingDate}</Descriptions.Item>
              <Descriptions.Item label="申请人">{selectedPatent.applicant}</Descriptions.Item>
              <Descriptions.Item label="IPC分类">{selectedPatent.ipcCode}</Descriptions.Item>
              <Descriptions.Item label="法律状态">
                <Tag color={statusColorMap[selectedPatent.status] ?? 'default'}>{selectedPatent.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>摘要</div>
              <div style={{
                padding: 16,
                background: token.colorBgLayout,
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.8,
                color: token.colorTextSecondary,
              }}>
                {selectedPatent.abstract}
              </div>
            </div>

            <Divider style={{ margin: '0 0 20px 0' }} />

            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>申请办理</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  block
                  size="large"
                  onClick={() => navigate('/patent/fee-reminder')}
                >
                  年费代缴
                </Button>
                <Button
                  icon={<FundOutlined />}
                  block
                  size="large"
                  onClick={() => navigate('/patent/value-assessment')}
                >
                  价值评估
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  block
                  size="large"
                  onClick={() => {}}
                >
                  下载专利全文
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PatentIPCNav;
