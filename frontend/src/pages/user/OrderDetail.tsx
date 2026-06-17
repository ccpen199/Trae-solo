import { useParams } from 'react-router-dom';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">订单详情</h1>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-gray-600">订单详情页面 - 订单号: {id}</p>
      </div>
    </div>
  );
}
