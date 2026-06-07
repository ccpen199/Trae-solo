import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyApi } from '../utils/api';
import { ChevronLeft, PenTool, CheckCircle2, Copy, FileText } from 'lucide-react';

const CONTRACT_TEMPLATES = {
  rent_commission: {
    title: '房屋出租委托合同',
    content: `
甲方（委托方）：{{owner_name}}
身份证号：______________________
联系电话：{{owner_phone}}

乙方（受托方）：居住服务平台
经纪人：{{agent_name}}
联系电话：{{agent_phone}}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方本着平等、自愿、互利的原则，经协商一致，就甲方委托乙方独家代理出租房屋事宜，订立本合同。

第一条 房屋基本情况
1.1 房屋坐落：{{property_address}}
1.2 房屋名称：{{property_name}}
1.3 建筑面积：{{property_area}} 平方米
1.4 户型：{{property_rooms}}室{{property_halls}}厅
1.5 楼层：{{property_floor}}/{{property_total_floor}}层
1.6 装修标准：{{property_decoration}}

第二条 委托事项
2.1 甲方独家委托乙方出租上述房屋；
2.2 委托期限自本合同签订之日起 6 个月；
2.3 甲方期望租金不低于 {{property_price}} 元/月。

第三条 佣金与支付
3.1 乙方促成租赁合同签订后，甲方应向乙方支付相当于 1 个月租金的佣金；
3.2 佣金应在租赁合同签订后 3 个工作日内支付。

第四条 双方权利与义务
4.1 甲方保证对房屋享有合法出租权；
4.2 甲方应配合乙方带看客户；
4.3 乙方应积极推广房源，寻找合适租客；
4.4 乙方应如实向甲方报告客户反馈。

第五条 违约责任
5.1 任何一方违反本合同约定，应承担相应的违约责任。

第六条 争议解决
6.1 因本合同引起的争议，双方应友好协商解决；
6.2 协商不成的，提交房屋所在地人民法院诉讼解决。

第七条 合同生效
7.1 本合同自双方签字盖章之日起生效；
7.2 本合同一式两份，甲乙双方各执一份，具有同等法律效力。

（以下为签署页，无正文）
    `
  },
  sale_commission: {
    title: '房屋出售委托合同',
    content: `
甲方（委托方）：{{owner_name}}
身份证号：______________________
联系电话：{{owner_phone}}

乙方（受托方）：居住服务平台
经纪人：{{agent_name}}
联系电话：{{agent_phone}}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方本着平等、自愿、互利的原则，经协商一致，就甲方委托乙方独家代理出售房屋事宜，订立本合同。

第一条 房屋基本情况
1.1 房屋坐落：{{property_address}}
1.2 房屋名称：{{property_name}}
1.3 建筑面积：{{property_area}} 平方米
1.4 户型：{{property_rooms}}室{{property_halls}}厅
1.5 楼层：{{property_floor}}/{{property_total_floor}}层
1.6 装修标准：{{property_decoration}}

第二条 委托事项
2.1 甲方独家委托乙方出售上述房屋；
2.2 委托期限自本合同签订之日起 12 个月；
2.3 甲方期望售价不低于 {{property_price}} 元。

第三条 佣金与支付
3.1 乙方促成买卖合同签订后，甲方应向乙方支付房屋成交价格 2.5% 的佣金（佣金五折优惠后为 1.25%）；
3.2 佣金应在买卖合同签订后 3 个工作日内支付。

第四条 双方权利与义务
4.1 甲方保证对房屋享有合法所有权；
4.2 甲方应配合乙方带看客户及办理过户手续；
4.3 乙方应积极推广房源，寻找合适买家；
4.4 乙方应如实向甲方报告客户反馈及市场行情。

第五条 违约责任
5.1 任何一方违反本合同约定，应承担相应的违约责任。

第六条 争议解决
6.1 因本合同引起的争议，双方应友好协商解决；
6.2 协商不成的，提交房屋所在地人民法院诉讼解决。

第七条 合同生效
7.1 本合同自双方签字盖章之日起生效；
7.2 本合同一式两份，甲乙双方各执一份，具有同等法律效力。

（以下为签署页，无正文）
    `
  },
};

const ContractSign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [templateType, setTemplateType] = useState<'rent_commission' | 'sale_commission'>('sale_commission');
  const [signed, setSigned] = useState(false);
  const [signResult, setSignResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSign = async () => {
    if (!confirm('确认签署本合同？签署后将生成不可篡改的存证哈希。')) return;
    setLoading(true);
    try {
      const res = await propertyApi.contract(parseInt(id!), templateType);
      setSignResult(res);
      setSigned(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = async () => {
    if (!signResult?.signHash) return;
    await navigator.clipboard.writeText(signResult.signHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const template = CONTRACT_TEMPLATES[templateType];
  const mockOwner = { name: '张业主', phone: '138****0004' };
  const mockAgent = { name: '李明', phone: '138****0002' };
  const mockProperty = {
    address: '朝阳区阳光花园小区3号楼2单元1502',
    name: '阳光花园精装三居室',
    area: 122,
    rooms: 3,
    halls: 2,
    floor: 15,
    total_floor: 28,
    decoration: '豪装',
    price: templateType === 'sale_commission' ? '5,800,000' : '8,500'
  };

  const renderedContent = template.content
    .replace(/{{owner_name}}/g, mockOwner.name)
    .replace(/{{owner_phone}}/g, mockOwner.phone)
    .replace(/{{agent_name}}/g, mockAgent.name)
    .replace(/{{agent_phone}}/g, mockAgent.phone)
    .replace(/{{property_address}}/g, mockProperty.address)
    .replace(/{{property_name}}/g, mockProperty.name)
    .replace(/{{property_area}}/g, mockProperty.area.toString())
    .replace(/{{property_rooms}}/g, mockProperty.rooms.toString())
    .replace(/{{property_halls}}/g, mockProperty.halls.toString())
    .replace(/{{property_floor}}/g, mockProperty.floor.toString())
    .replace(/{{property_total_floor}}/g, mockProperty.total_floor.toString())
    .replace(/{{property_decoration}}/g, mockProperty.decoration)
    .replace(/{{property_price}}/g, mockProperty.price);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">电子签约</h2>
          <p className="text-sm text-gray-500">委托合同电子签署与存证</p>
        </div>
      </div>

      {!signed && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">选择合同模板</h4>
              <p className="text-sm text-gray-500">根据房源类型选择合适的委托合同模板</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTemplateType('sale_commission')}
                className={`px-4 py-2 rounded-lg border transition-colors ${templateType === 'sale_commission' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                出售委托
              </button>
              <button
                onClick={() => setTemplateType('rent_commission')}
                className={`px-4 py-2 rounded-lg border transition-colors ${templateType === 'rent_commission' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                出租委托
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="text-center text-xl font-semibold text-gray-800">{template.title}</div>
            </div>
            <div className="p-8 max-h-[500px] overflow-y-auto bg-white font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-700">
              {renderedContent}
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-3">甲方（委托方）签字</div>
                  <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                    签署后显示
                  </div>
                  <div className="text-sm text-gray-800 mt-2 font-medium">{mockOwner.name}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-3">乙方（受托方）签字</div>
                  <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                    签署后显示
                  </div>
                  <div className="text-sm text-gray-800 mt-2 font-medium">居住服务平台 · {mockAgent.name}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">电子签约存证说明</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>本合同采用区块链存证技术，签署后生成唯一哈希值用于完整性校验</li>
                  <li>签署即表示您已阅读并同意本合同全部条款</li>
                  <li>合同文件将安全存储，可随时调阅核验</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSign}
              disabled={loading}
              className="px-8 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <PenTool className="w-5 h-5" />
              {loading ? '签署中...' : '签署合同'}
            </button>
          </div>
        </div>
      )}

      {signed && signResult && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">合同签署成功！</h3>
            <p className="text-green-100">合同已完成电子签署并完成区块链存证</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">合同编号</div>
                <div className="font-mono text-sm font-medium text-gray-800">CT-{signResult.contractId.toString().padStart(6, '0')}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">签署时间</div>
                <div className="font-mono text-sm font-medium text-gray-800">{signResult.signedAt}</div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">区块链存证哈希</span>
                </div>
                <button
                  onClick={copyHash}
                  className="text-sm text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="font-mono text-xs text-amber-900 break-all bg-white/50 p-4 rounded border border-amber-200">
                {signResult.signHash}
              </div>
              <p className="text-xs text-amber-700 mt-3">
                您可以通过此哈希值在区块链上验证合同的完整性和签署时间。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-3">甲方（委托方）</div>
                <div className="w-full h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                  <span className="font-cursive text-3xl text-gray-800">{mockOwner.name}</span>
                </div>
                <div className="text-sm text-gray-800 mt-2 font-medium">{mockOwner.name}</div>
                <div className="text-xs text-gray-500">已签署 · {signResult.signedAt}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-3">乙方（受托方）</div>
                <div className="w-full h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
                  <span className="font-cursive text-3xl text-primary-700">居住服务平台</span>
                </div>
                <div className="text-sm text-gray-800 mt-2 font-medium">居住服务平台 · {mockAgent.name}</div>
                <div className="text-xs text-gray-500">已签署 · {signResult.signedAt}</div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-center gap-3">
            <button
              onClick={() => navigate(`/properties/${id}`)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              返回房源
            </button>
            <button className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4" />
              下载合同
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSign;
