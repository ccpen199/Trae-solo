import React, { useState } from 'react';
import { Row, Col, Card, Upload, Button, Select, Slider, Input, Image, message, Typography, Space, Divider, Spin, Tag, List } from 'antd';
import { UploadOutlined, ExperimentOutlined, PictureOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { migrateStyle, calculateQuote } from '../api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const StyleMigration = () => {
  const navigate = useNavigate();
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [area, setArea] = useState(100);
  const [qualityLevel, setQualityLevel] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [quoteResults, setQuoteResults] = useState({});
  const [selectedResult, setSelectedResult] = useState(null);

  const styles = [
    { value: '现代简约', label: '现代简约', desc: '简洁明快，注重功能性' },
    { value: '新中式', label: '新中式', desc: '传统与现代的完美融合' },
    { value: '北欧风格', label: '北欧风格', desc: '清新自然，简约舒适' },
    { value: '轻奢美式', label: '轻奢美式', desc: '典雅大气，品质生活' },
    { value: '日式极简', label: '日式极简', desc: '禅意空间，收纳至上' },
    { value: '欧式古典', label: '欧式古典', desc: '华丽典雅，复古韵味' },
    { value: '工业风格', label: '工业风格', desc: '原始粗犷，个性十足' },
    { value: '地中海', label: '地中海', desc: '浪漫清新，海洋风情' }
  ];

  const qualityOptions = [
    { value: '经济简约', label: '经济简约', factor: 800 },
    { value: 'standard', label: '品质标准', factor: 1200 },
    { value: '品质优选', label: '品质优选', factor: 1800 },
    { value: '豪华定制', label: '豪华定制', factor: 2500 }
  ];

  const handleMigrate = async () => {
    if (!floorPlanUrl) {
      message.error('请先上传户型图');
      return;
    }
    if (selectedStyles.length === 0) {
      message.error('请选择至少一种目标风格');
      return;
    }
    setLoading(true);
    try {
      const styleResults = [];
      const quoteMap = {};
      
      for (let i = 0; i < selectedStyles.length; i++) {
        const style = selectedStyles[i];
        const res = await migrateStyle({ floor_plan_url: floorPlanUrl, style });
        if (res.code === 200) {
          const styleImages = [
            `https://images.unsplash.com/photo-${1600210492486 + i * 10000}?w=800&h=600&fit=crop`,
            `https://images.unsplash.com/photo-${1600607687939 + i * 10000}?w=800&h=600&fit=crop`,
            `https://images.unsplash.com/photo-${1600585154340 + i * 10000}?w=800&h=600&fit=crop`
          ];
          
          styleResults.push({
            style,
            images: styleImages.map((url, idx) => ({
              url,
              title: `${style}方案${idx + 1}`
            }))
          });
          
          const quoteRes = await calculateQuote({ area, style, quality_level: qualityLevel });
          if (quoteRes.code === 200) {
            quoteMap[style] = quoteRes.data;
          }
        }
      }
      
      setResults(styleResults);
      setQuoteResults(quoteMap);
      if (styleResults.length > 0) {
        setSelectedResult(styleResults[0]);
      }
      message.success(`AI风格迁移完成！共生成 ${selectedStyles.length} 种风格方案`);
    } finally {
      setLoading(false);
    }
  };

  const dummyUploadProps = {
    beforeUpload: () => {
      setFloorPlanUrl('https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&h=400&fit=crop');
      message.success('户型图上传成功');
      return false;
    }
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          AI风格迁移
        </Title>
        <Text type="secondary">上传户型图，AI一键生成多种装修风格效果图，自动联动报价拆解</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="上传户型图" style={{ marginBottom: 16 }}>
            <Upload {...dummyUploadProps} showUploadList={false} accept="image/*">
              {floorPlanUrl ? (
                <div style={{ width: '100%', height: 300, position: 'relative' }}>
                  <Image src={floorPlanUrl} width="100%" height={300} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '8px 16px',
                    borderBottomLeftRadius: 8, borderBottomRightRadius: 8, fontSize: 12
                  }}>
                    点击重新上传
                  </div>
                </div>
              ) : (
                <div style={{
                  width: '100%', height: 300, border: '2px dashed #d9d9d9',
                  borderRadius: 8, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.3s'
                }}>
                  <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                  <Text type="secondary">点击或拖拽上传户型图</Text>
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                    支持 JPG、PNG 格式，文件大小不超过 10MB
                  </Text>
                </div>
              )}
            </Upload>
          </Card>

          <Card title="设置参数">
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>房屋面积</Text>
                <Text type="primary" strong>{area} ㎡</Text>
              </div>
              <Slider
                min={30}
                max={300}
                value={area}
                onChange={setArea}
                marks={{ 30: '30', 100: '100', 200: '200', 300: '300' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>装修档次</Text>
              <Select style={{ width: '100%' }} value={qualityLevel} onChange={setQualityLevel}>
                {qualityOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}（约 ¥{opt.factor}/㎡）
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                选择目标风格 <Text type="danger">（可多选，建议选择2-3种对比）</Text>
              </Text>
              <Row gutter={[8, 8]}>
                {styles.map(style => (
                  <Col xs={12} key={style.value}>
                    <Card
                      hoverable
                      size="small"
                      style={{
                        borderColor: selectedStyles.includes(style.value) ? '#1890ff' : '#d9d9d9',
                        background: selectedStyles.includes(style.value) ? '#e6f7ff' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                      onClick={() => {
                        if (selectedStyles.includes(style.value)) {
                          setSelectedStyles(prev => prev.filter(s => s !== style.value));
                        } else {
                          setSelectedStyles(prev => [...prev, style.value]);
                        }
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{style.label}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{style.desc}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<ExperimentOutlined />}
              onClick={handleMigrate}
              loading={loading}
              disabled={!floorPlanUrl || selectedStyles.length === 0}
            >
              开始AI风格迁移（{selectedStyles.length} 种风格）
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="生成结果">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#888' }}>
                  AI 正在为您生成 {selectedStyles.length} 种风格效果图，请稍候...
                </div>
              </div>
            ) : results.length > 0 ? (
              <div>
                <Card
                  type="inner"
                  title="风格对比 & 报价分析"
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={[16, 16]}>
                    {results.map(result => {
                      const quote = quoteResults[result.style];
                      const isSelected = selectedResult?.style === result.style;
                      return (
                        <Col xs={24} sm={12} md={results.length > 2 ? 8 : 12} key={result.style}>
                          <Card
                            hoverable
                            style={{
                              borderColor: isSelected ? '#1890ff' : '#d9d9d9',
                              boxShadow: isSelected ? '0 0 0 2px #1890ff' : 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedResult(result)}
                          >
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Tag color="blue">{result.style}</Tag>
                                <Text type="success">3张效果图</Text>
                              </div>
                              {quote ? (
                                <>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: '#888' }}>预估总价</div>
                                    <div style={{ fontSize: 20, fontWeight: 600, color: '#f5222d' }}>
                                      ¥{quote.total_estimate?.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#888' }}>
                                      ¥{quote.per_sqm_price}/㎡
                                    </div>
                                  </div>
                                  <Divider style={{ margin: '8px 0' }} />
                                  <Row gutter={8}>
                                    <Col span={12}>
                                      <div style={{ textAlign: 'center', fontSize: 11 }}>
                                        <div style={{ color: '#888' }}>硬装</div>
                                        <div style={{ fontWeight: 500 }}>¥{(quote.breakdown?.hard_decoration / 10000).toFixed(1)}万</div>
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <div style={{ textAlign: 'center', fontSize: 11 }}>
                                        <div style={{ color: '#888' }}>软装</div>
                                        <div style={{ fontWeight: 500 }}>¥{(quote.breakdown?.soft_decoration / 10000).toFixed(1)}万</div>
                                      </div>
                                    </Col>
                                  </Row>
                                </>
                              ) : (
                                <div style={{ textAlign: 'center', color: '#888', padding: '16px 0' }}>
                                  报价计算中...
                                </div>
                              )}
                            </Space>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>

                {selectedResult && (
                  <>
                    <Divider orientation="left">
                      <Space>
                        <Tag color="blue" style={{ fontSize: 14 }}>{selectedResult.style}</Tag>
                        <Text type="secondary">方案详情</Text>
                      </Space>
                    </Divider>

                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                      {selectedResult.images.map((img, idx) => (
                        <Col xs={24} sm={8} key={idx}>
                          <Card
                            hoverable
                            cover={
                              <Image
                                src={img.url}
                                height={180}
                                style={{ objectFit: 'cover' }}
                                placeholder
                              />
                            }
                            actions={[
                              <Button type="link" size="small">下载</Button>,
                              <Button type="link" size="small">大图预览</Button>
                            ]}
                          >
                            <Card.Meta title={img.title} />
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {quoteResults[selectedResult.style] && (
                      <Card
                        type="inner"
                        title="硬装/软装分项报价拆解"
                        style={{ marginTop: 16 }}
                        extra={
                          <Space>
                            <Button type="primary" size="small" onClick={() => navigate('/quotations')}>
                              生成完整报价单
                            </Button>
                            <Button size="small" onClick={() => navigate('/erp/schedules')}>
                              预约设计师
                            </Button>
                          </Space>
                        }
                      >
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                          <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                              <div style={{ fontSize: 12, color: '#888' }}>硬装费用</div>
                              <div style={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }}>
                                ¥{quoteResults[selectedResult.style].breakdown?.hard_decoration?.toLocaleString()}
                              </div>
                              <div style={{ fontSize: 11, color: '#888' }}>
                                占比 {((quoteResults[selectedResult.style].breakdown?.hard_decoration / quoteResults[selectedResult.style].total_estimate) * 100).toFixed(1)}%
                              </div>
                            </Card>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
                              <div style={{ fontSize: 12, color: '#888' }}>软装费用</div>
                              <div style={{ fontSize: 18, fontWeight: 600, color: '#2f54eb' }}>
                                ¥{quoteResults[selectedResult.style].breakdown?.soft_decoration?.toLocaleString()}
                              </div>
                              <div style={{ fontSize: 11, color: '#888' }}>
                                占比 {((quoteResults[selectedResult.style].breakdown?.soft_decoration / quoteResults[selectedResult.style].total_estimate) * 100).toFixed(1)}%
                              </div>
                            </Card>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                              <div style={{ fontSize: 12, color: '#888' }}>家电费用</div>
                              <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                                ¥{quoteResults[selectedResult.style].breakdown?.appliances?.toLocaleString()}
                              </div>
                              <div style={{ fontSize: 11, color: '#888' }}>
                                占比 {((quoteResults[selectedResult.style].breakdown?.appliances / quoteResults[selectedResult.style].total_estimate) * 100).toFixed(1)}%
                              </div>
                            </Card>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', background: '#fff1f0' }}>
                              <div style={{ fontSize: 12, color: '#888' }}>设计费</div>
                              <div style={{ fontSize: 18, fontWeight: 600, color: '#f5222d' }}>
                                ¥{quoteResults[selectedResult.style].breakdown?.design_fee?.toLocaleString()}
                              </div>
                              <div style={{ fontSize: 11, color: '#888' }}>
                                占比 {((quoteResults[selectedResult.style].breakdown?.design_fee / quoteResults[selectedResult.style].total_estimate) * 100).toFixed(1)}%
                              </div>
                            </Card>
                          </Col>
                        </Row>

                        <List
                          size="small"
                          header={<Text strong>分项明细</Text>}
                          dataSource={[
                            { name: '水电改造', category: '硬装', amount: quoteResults[selectedResult.style].breakdown?.hard_decoration * 0.15 },
                            { name: '泥瓦工程', category: '硬装', amount: quoteResults[selectedResult.style].breakdown?.hard_decoration * 0.25 },
                            { name: '木工工程', category: '硬装', amount: quoteResults[selectedResult.style].breakdown?.hard_decoration * 0.2 },
                            { name: '油漆工程', category: '硬装', amount: quoteResults[selectedResult.style].breakdown?.hard_decoration * 0.15 },
                            { name: '主材采购', category: '硬装', amount: quoteResults[selectedResult.style].breakdown?.hard_decoration * 0.25 },
                            { name: '定制家具', category: '软装', amount: quoteResults[selectedResult.style].breakdown?.soft_decoration * 0.4 },
                            { name: '活动家具', category: '软装', amount: quoteResults[selectedResult.style].breakdown?.soft_decoration * 0.3 },
                            { name: '灯饰窗帘', category: '软装', amount: quoteResults[selectedResult.style].breakdown?.soft_decoration * 0.2 },
                            { name: '装饰摆件', category: '软装', amount: quoteResults[selectedResult.style].breakdown?.soft_decoration * 0.1 }
                          ]}
                          renderItem={item => (
                            <List.Item>
                              <Space>
                                <Tag color={item.category === '硬装' ? 'orange' : 'blue'}>{item.category}</Tag>
                                <span>{item.name}</span>
                              </Space>
                              <span style={{ fontWeight: 500 }}>¥{Math.round(item.amount).toLocaleString()}</span>
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </>
                )}

                <div style={{ marginTop: 24, textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                  <Text type="secondary">
                    温馨提示：以上报价为 AI 估算，实际报价以设计师现场量房后出具的正式报价单为准
                  </Text>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
                <ExperimentOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                <Paragraph>上传户型图并选择风格，AI将为您生成多种装修效果图方案</Paragraph>
                <Text type="secondary">支持现代简约、新中式、北欧、美式、日式等多种风格对比</Text>
                <Divider />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ExperimentOutlined style={{ marginRight: 4 }} />
                  生成的方案将包含效果图对比、硬装软装分项报价、资金规划建议
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StyleMigration;
