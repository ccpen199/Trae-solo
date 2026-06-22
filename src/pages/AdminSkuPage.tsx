import { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  Filter,
  Download,
  MoreHorizontal,
  X,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { materials } from '@/mock/data/materials';
import { cn } from '@/lib/utils';

const categoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: 'photo-paper', label: '相纸类' },
  { value: 'frame', label: '相框类' },
  { value: 'binding', label: '装订类' },
  { value: 'ceramic', label: '陶瓷类' },
  { value: 'fabric', label: '面料类' },
  { value: 'other', label: '其他' },
];

const skuMaterials = [
  {
    id: 'sku-001',
    code: 'MAT-PHOTO-001',
    name: '哑面相纸',
    category: 'photo-paper',
    categoryName: '相纸类',
    specification: '12寸 / 250g',
    costPrice: 2.5,
    salePrice: 5.0,
    stock: 5000,
    stockWarning: 500,
    supplier: '柯达纸业',
    status: 'active',
  },
  {
    id: 'sku-002',
    code: 'MAT-PHOTO-002',
    name: '光面相纸',
    category: 'photo-paper',
    categoryName: '相纸类',
    specification: '12寸 / 260g',
    costPrice: 3.2,
    salePrice: 6.5,
    stock: 3200,
    stockWarning: 500,
    supplier: '富士胶片',
    status: 'active',
  },
  {
    id: 'sku-003',
    code: 'MAT-PHOTO-003',
    name: '金属相纸',
    category: 'photo-paper',
    categoryName: '相纸类',
    specification: '12寸 / 300g',
    costPrice: 8.5,
    salePrice: 18.0,
    stock: 800,
    stockWarning: 200,
    supplier: '爱普生',
    status: 'active',
  },
  {
    id: 'sku-004',
    code: 'MAT-FRAME-001',
    name: '原木相框',
    category: 'frame',
    categoryName: '相框类',
    specification: 'A4 / 橡木',
    costPrice: 15.0,
    salePrice: 39.0,
    stock: 1200,
    stockWarning: 100,
    supplier: '木语工坊',
    status: 'active',
  },
  {
    id: 'sku-005',
    code: 'MAT-FRAME-002',
    name: '金属相框',
    category: 'frame',
    categoryName: '相框类',
    specification: '8寸 / 铝合金',
    costPrice: 12.0,
    salePrice: 29.9,
    stock: 600,
    stockWarning: 150,
    supplier: '精工铝业',
    status: 'active',
  },
  {
    id: 'sku-006',
    code: 'MAT-CERAMIC-001',
    name: '高温白瓷',
    category: 'ceramic',
    categoryName: '陶瓷类',
    specification: '马克杯 / 350ml',
    costPrice: 8.0,
    salePrice: 19.9,
    stock: 450,
    stockWarning: 100,
    supplier: '景德镇陶瓷',
    status: 'active',
  },
  {
    id: 'sku-007',
    code: 'MAT-BIND-001',
    name: '精装硬壳',
    category: 'binding',
    categoryName: '装订类',
    specification: '12寸 / 锁线装订',
    costPrice: 25.0,
    salePrice: 58.0,
    stock: 0,
    stockWarning: 100,
    supplier: '精细装订厂',
    status: 'out_of_stock',
  },
  {
    id: 'sku-008',
    code: 'MAT-FABRIC-001',
    name: '亚麻面料',
    category: 'fabric',
    categoryName: '面料类',
    specification: '45x45cm / 亚麻混纺',
    costPrice: 12.0,
    salePrice: 28.0,
    stock: 320,
    stockWarning: 50,
    supplier: '家纺优品',
    status: 'active',
  },
];

export default function AdminSkuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [materialList, setMaterialList] = useState(skuMaterials);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  const filteredMaterials = materialList.filter((mat) => {
    if (selectedCategory !== 'all' && mat.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !mat.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !mat.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const openAddModal = () => {
    setEditingMaterial(null);
    setModalOpen(true);
  };

  const openEditModal = (material: any) => {
    setEditingMaterial(material);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setMaterialToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (materialToDelete) {
      setMaterialList((prev) => prev.filter((m) => m.id !== materialToDelete));
    }
    setDeleteConfirmOpen(false);
    setMaterialToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-paper-900">
            SKU材质库
          </h1>
          <p className="mt-1 text-sm text-paper-500">
            管理所有产品材质和规格
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="primary" size="sm" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            新增材质
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="搜索材质名称、编码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
              size="sm"
              className="w-36"
            />
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-paper-200 bg-paper-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                  材质编码
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                  规格
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-paper-500 uppercase tracking-wider">
                  成本价
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-paper-500 uppercase tracking-wider">
                  售价
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-paper-500 uppercase tracking-wider">
                  库存
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-paper-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-paper-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {filteredMaterials.map((material) => {
                const isLowStock = material.stock <= material.stockWarning;
                const isOutOfStock = material.stock === 0;

                return (
                  <tr
                    key={material.id}
                    className="hover:bg-paper-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-paper-900">
                        {material.code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-paper-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-paper-400" />
                        </div>
                        <span className="font-medium text-paper-900">
                          {material.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Tag variant="default" size="sm">
                        {material.categoryName}
                      </Tag>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-paper-600">
                        {material.specification}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm text-paper-600">
                        ¥{material.costPrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium text-paper-900">
                        ¥{material.salePrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            'font-medium',
                            isOutOfStock
                              ? 'text-darkroom-500'
                              : isLowStock
                                ? 'text-gold-500'
                                : 'text-paper-900'
                          )}
                        >
                          {material.stock}
                        </span>
                        {isLowStock && !isOutOfStock && (
                          <AlertTriangle className="w-4 h-4 text-gold-500" />
                        )}
                        {isOutOfStock && (
                          <AlertTriangle className="w-4 h-4 text-darkroom-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Tag
                        variant={isOutOfStock ? 'error' : 'success'}
                        size="sm"
                      >
                        {isOutOfStock ? '缺货' : '正常'}
                      </Tag>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(material)}
                          className="p-2 rounded-md text-paper-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-2 rounded-md text-paper-400 hover:text-darkroom-500 hover:bg-darkroom-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-paper-200 flex items-center justify-between">
          <p className="text-sm text-paper-500">
            共 {filteredMaterials.length} 条记录
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled>
              上一页
            </Button>
            <Button variant="primary" size="sm" className="w-8 h-8 p-0">
              1
            </Button>
            <Button variant="ghost" size="sm" disabled>
              下一页
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMaterial ? '编辑材质' : '新增材质'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              {editingMaterial ? '保存修改' : '确认添加'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              材质编码
            </label>
            <Input
              placeholder="请输入材质编码"
              defaultValue={editingMaterial?.code}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              材质名称
            </label>
            <Input
              placeholder="请输入材质名称"
              defaultValue={editingMaterial?.name}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              材质分类
            </label>
            <Select
              options={categoryOptions.filter((o) => o.value !== 'all')}
              defaultValue={editingMaterial?.category}
              placeholder="请选择分类"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              规格
            </label>
            <Input
              placeholder="请输入规格"
              defaultValue={editingMaterial?.specification}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              成本价（元）
            </label>
            <Input
              type="number"
              placeholder="0.00"
              defaultValue={editingMaterial?.costPrice}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              售价（元）
            </label>
            <Input
              type="number"
              placeholder="0.00"
              defaultValue={editingMaterial?.salePrice}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              库存数量
            </label>
            <Input
              type="number"
              placeholder="0"
              defaultValue={editingMaterial?.stock}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              库存预警阈值
            </label>
            <Input
              type="number"
              placeholder="0"
              defaultValue={editingMaterial?.stockWarning}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              供应商
            </label>
            <Input
              placeholder="请输入供应商名称"
              defaultValue={editingMaterial?.supplier}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="确认删除"
        size="sm"
      >
        <p className="text-paper-600">
          确定要删除这个材质吗？删除后无法恢复，相关产品可能会受影响。
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            取消
          </Button>
          <Button
            variant="primary"
            className="bg-darkroom-500 hover:bg-darkroom-600"
            onClick={confirmDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            确认删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
