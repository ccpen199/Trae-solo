import React, { useRef, useState, useEffect } from 'react';
import {
  FileSignature,
  Search,
  Filter,
  Download,
  Eye,
  PenTool,
  X,
  Eraser,
  CheckCircle2,
  Clock,
  Users,
  FileText,
} from 'lucide-react';
import { Table, Tag, Input, Select, Button, Modal, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockContracts, Contract } from '../../../api/mock/data';
import { formatDate, downloadFile } from '@/utils/format';
import { cn } from '@/lib/utils';

type SignStatus = 'pending' | 'partial' | 'complete';

interface ContractWithParties extends Contract {
  contractNumber: string;
  parties: string;
  signStatus: SignStatus;
}

const getSignStatus = (c: Contract): SignStatus => {
  if (c.clientSigned && c.lawyerSigned) return 'complete';
  if (c.clientSigned || c.lawyerSigned) return 'partial';
  return 'pending';
};

const mockContractList: ContractWithParties[] = [
  {
    ...mockContracts[0],
    contractNumber: 'HT-2024-0310-001',
    parties: '北京中科创新科技有限公司 / 北京市正义律师事务所',
    signStatus: getSignStatus(mockContracts[0]),
  },
  {
    ...mockContracts[1],
    contractNumber: 'HT-2024-0318-002',
    parties: '王某某 / 北京市正义律师事务所',
    signStatus: getSignStatus(mockContracts[1]),
  },
  {
    id: 'contract-003',
    caseId: 'wc-003',
    caseTitle: '某员工劳动争议案',
    templateId: 'tpl-contract-003',
    content: '劳动争议委托代理合同\n\n甲方（委托人）：刘某某\n乙方（受托人）：北京市正义律师事务所\n\n第一条 委托事项\n甲方因与某公司劳动争议一案，委托乙方律师代理。\n\n第二条 代理权限\n一般授权代理：代为立案、参加庭审、签收法律文书等。\n\n第三条 律师费用\n经双方协商，甲方应向乙方支付律师代理费人民币叁万元整。\n\n第四条 工作费用\n乙方律师办理委托事项所发生的差旅费、调查费等实际支出费用，由甲方实报实销。\n\n第五条 合同期限\n本合同自双方签字之日起生效，至本案仲裁裁决作出之日止。\n\n第六条 违约责任\n任何一方违反本合同约定，应承担相应的违约责任。\n\n第七条 争议解决\n因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方可向乙方所在地人民法院提起诉讼。',
    clientSigned: false,
    lawyerSigned: false,
    signedAt: undefined,
    createdAt: '2024-02-01T09:00:00.000Z',
    contractNumber: 'HT-2024-0201-003',
    parties: '刘某某 / 北京市正义律师事务所',
    signStatus: 'pending',
  },
  {
    id: 'contract-004',
    caseId: 'wc-004',
    caseTitle: '某公司常年法律顾问服务',
    templateId: 'tpl-contract-004',
    content: '常年法律顾问合同\n\n甲方（委托人）：深圳华信金融服务有限公司\n乙方（受托人）：北京市正义律师事务所\n\n第一条 服务范围\n1. 为甲方日常经营管理提供法律咨询意见；\n2. 审查、修改甲方合同及其他法律文书；\n3. 为甲方员工提供法律培训；\n4. 代理甲方参与诉讼、仲裁活动（另行收费）。\n\n第二条 服务期限\n本合同有效期为一年，自2024年1月1日起至2024年12月31日止。\n\n第三条 法律顾问费用\n甲方每年向乙方支付法律顾问费人民币贰拾万元整。\n\n第四条 工作方式\n乙方指派张明律师作为甲方的常年法律顾问，定期上门服务，日常法律问题通过电话、邮件等方式及时答复。',
    clientSigned: true,
    lawyerSigned: true,
    signedAt: '2024-01-02T10:00:00.000Z',
    createdAt: '2024-01-01T09:00:00.000Z',
    contractNumber: 'HT-2024-0101-004',
    parties: '深圳华信金融服务有限公司 / 北京市正义律师事务所',
    signStatus: 'complete',
  },
  {
    id: 'contract-005',
    caseId: 'cs-002',
    caseTitle: '建筑工程施工合同纠纷，标的额3.2亿',
    templateId: 'tpl-contract-005',
    content: '专项法律服务合同\n\n甲方（委托人）：某建筑集团有限公司\n乙方（受托人）：北京市正义律师事务所\n\n第一条 委托事项\n甲方与广州某房地产开发商建设工程施工合同纠纷一案，委托乙方律师团队代理。\n\n第二条 团队配置\n乙方指派张明律师主办，配备助理律师2名。\n\n第三条 律师费\n1. 基础费用：人民币伍拾万元整；\n2. 风险代理：按实际回款金额的5%计提。\n\n第四条 合同期限\n自双方签字之日起至本案执行终结之日止。',
    clientSigned: true,
    lawyerSigned: false,
    signedAt: undefined,
    createdAt: '2024-03-20T09:00:00.000Z',
    contractNumber: 'HT-2024-0320-005',
    parties: '某建筑集团有限公司 / 北京市正义律师事务所',
    signStatus: 'partial',
  },
];

const statusConfig: Record<SignStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: '待签署',
    color: 'default',
    icon: <Clock className="w-3 h-3" />,
  },
  partial: {
    label: '部分签署',
    color: 'warning',
    icon: <Users className="w-3 h-3" />,
  },
  complete: {
    label: '已完成',
    color: 'success',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

const Contracts: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<SignStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [detailModal, setDetailModal] = useState<ContractWithParties | null>(null);
  const [signModal, setSignModal] = useState<ContractWithParties | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const filteredData = mockContractList.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.signStatus === statusFilter;
    const matchSearch = c.caseTitle.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  useEffect(() => {
    if (signModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0A1628';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signModal]);

  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handleSign = () => {
    if (!hasSignature) {
      message.warning('请先绘制签名');
      return;
    }
    message.success('签名成功，合同已更新');
    setSignModal(null);
    clearCanvas();
  };

  const handleDownload = (contract: ContractWithParties) => {
    const content = `${contract.content}\n\n合同编号：${contract.contractNumber}\n案件名称：${contract.caseTitle}\n签订日期：${contract.signedAt || contract.createdAt}`;
    downloadFile(content, `${contract.contractNumber}-${contract.caseTitle}.txt`, 'text/plain');
    message.success('合同已开始下载');
  };

  const columns: ColumnsType<ContractWithParties> = [
    {
      title: '合同编号',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 180,
      render: (v) => <span className="font-mono text-sm text-primary-500">{v}</span>,
    },
    {
      title: '案件标题',
      dataIndex: 'caseTitle',
      key: 'caseTitle',
      render: (v, record) => (
        <div
          className="cursor-pointer hover:text-primary-500 transition-colors font-medium"
          onClick={() => setDetailModal(record)}
        >
          {v}
        </div>
      ),
    },
    {
      title: '签约方',
      dataIndex: 'parties',
      key: 'parties',
      ellipsis: true,
      render: (v) => <span className="text-neutral-ink-600">{v}</span>,
    },
    {
      title: '签署状态',
      dataIndex: 'signStatus',
      key: 'signStatus',
      width: 120,
      render: (status: SignStatus) => {
        const cfg = statusConfig[status];
        return (
          <Tag color={cfg.color} icon={cfg.icon} className="!m-0">
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v) => formatDate(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setDetailModal(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PenTool className="w-3.5 h-3.5" />}
            onClick={() => setSignModal(record)}
            disabled={record.signStatus === 'complete'}
          >
            签署
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900 flex items-center gap-3">
            <FileSignature className="w-7 h-7 text-accent-gold" />
            合同签署
          </h1>
          <p className="text-neutral-ink-500 mt-1">管理案件委托合同，支持在线电子签名</p>
        </div>
      </div>

      <div className="lc-card border-0 p-5">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-ink-400" />
              <Input
                placeholder="搜索案件标题"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="!w-64 !pl-9"
                allowClear
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-ink-500" />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="!w-36"
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'pending', label: '待签署' },
                  { value: 'partial', label: '部分签署' },
                  { value: 'complete', label: '已完成' },
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-ink-500">
            共 <span className="font-semibold text-primary-900">{filteredData.length}</span> 份合同
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onRow={(record) => ({
            onClick: () => setDetailModal(record),
            className: 'cursor-pointer',
          })}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            <span className="font-serif font-semibold">{detailModal?.caseTitle}</span>
          </div>
        }
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        width={720}
        footer={[
          <Button key="close" onClick={() => setDetailModal(null)}>
            关闭
          </Button>,
          <Button
            key="sign"
            type="primary"
            icon={<PenTool className="w-4 h-4" />}
            onClick={() => {
              setSignModal(detailModal);
              setDetailModal(null);
            }}
            disabled={detailModal?.signStatus === 'complete'}
          >
            签署合同
          </Button>,
          <Button
            key="download"
            icon={<Download className="w-4 h-4" />}
            onClick={() => detailModal && handleDownload(detailModal)}
          >
            下载 PDF
          </Button>,
        ]}
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-ivory rounded-lg">
              <div>
                <div className="text-xs text-neutral-ink-500 mb-1">合同编号</div>
                <div className="font-mono text-sm text-primary-500">{detailModal.contractNumber}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-ink-500 mb-1">签署状态</div>
                <div>
                  <Tag color={statusConfig[detailModal.signStatus].color} icon={statusConfig[detailModal.signStatus].icon}>
                    {statusConfig[detailModal.signStatus].label}
                  </Tag>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-ink-500 mb-1">签约方</div>
                <div className="text-sm">{detailModal.parties}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-ink-500 mb-1">创建日期</div>
                <div className="text-sm">{formatDate(detailModal.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-b border-neutral-ink-100">
              <div className="flex-1">
                <div className="text-xs text-neutral-ink-500 mb-1">客户签署</div>
                <div className="flex items-center gap-2">
                  {detailModal.clientSigned ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-neutral-ink-400" />
                  )}
                  <span className={cn('text-sm', detailModal.clientSigned ? 'text-green-600' : 'text-neutral-ink-500')}>
                    {detailModal.clientSigned ? '已签署' : '待签署'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-ink-500 mb-1">律师签署</div>
                <div className="flex items-center gap-2">
                  {detailModal.lawyerSigned ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-neutral-ink-400" />
                  )}
                  <span className={cn('text-sm', detailModal.lawyerSigned ? 'text-green-600' : 'text-neutral-ink-500')}>
                    {detailModal.lawyerSigned ? '已签署' : '待签署'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-neutral-ink-100 rounded-lg p-6 bg-white max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-ink-700">
                {detailModal.content}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary-500" />
            <span className="font-serif font-semibold">电子签名</span>
          </div>
        }
        open={!!signModal}
        onCancel={() => {
          setSignModal(null);
          clearCanvas();
        }}
        width={560}
        footer={[
          <Button
            key="clear"
            icon={<Eraser className="w-4 h-4" />}
            onClick={clearCanvas}
          >
            清除
          </Button>,
          <Button key="cancel" onClick={() => { setSignModal(null); clearCanvas(); }}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleSign} disabled={!hasSignature}>
            确认签名
          </Button>,
        ]}
      >
        {signModal && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-ivory rounded-lg text-sm text-neutral-ink-600">
              正在签署合同：<span className="font-medium text-primary-900">{signModal.caseTitle}</span>
            </div>
            <div className="relative border-2 border-dashed border-neutral-ink-200 rounded-lg bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={480}
                height={240}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-neutral-ink-400">
                    <PenTool className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">请在此区域手写签名</p>
                  </div>
                </div>
              )}
              <button
                onClick={clearCanvas}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-neutral-ink-200 hover:bg-neutral-ink-50 transition-colors"
                title="清除"
              >
                <X className="w-4 h-4 text-neutral-ink-500" />
              </button>
            </div>
            <div className="text-xs text-neutral-ink-500 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                我确认以上签名为本人亲笔签名，具有法律效力。签署后合同将立即生效。
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Contracts;
