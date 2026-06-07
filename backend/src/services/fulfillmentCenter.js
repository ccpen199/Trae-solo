const { v4: uuidv4 } = require('uuid');
const { Order, SubOrder } = require('../models');
const routingGateway = require('./routingGateway');

function createSubOrders(order, provider) {
  const base = { order_id: order.id };
  const subOrders = [];

  switch (order.category) {
    case 'food_delivery':
      subOrders.push(
        { ...base, type: 'meal', amount: order.total_amount },
        { ...base, type: 'delivery', amount: 0 }
      );
      break;
    case 'ride_hailing':
      subOrders.push({ ...base, type: 'delivery', amount: order.total_amount });
      break;
    case 'gov_payment':
      subOrders.push({ ...base, type: 'payment', amount: order.total_amount });
      break;
    case 'retail':
      subOrders.push(
        { ...base, type: 'delivery', amount: 0 },
        { ...base, type: 'payment', amount: order.total_amount }
      );
      break;
    default:
      subOrders.push({ ...base, type: 'payment', amount: order.total_amount });
  }

  return SubOrder.bulkCreate(subOrders);
}

function simulateThirdPartyCall(type, subOrder) {
  const thirdPartyNo = `TP-${type.toUpperCase()}-${uuidv4().slice(0, 8)}`;
  return {
    thirdPartyNo,
    status: 'processing',
    response: { code: 200, message: '请求已接受', thirdPartyNo, subOrderId: subOrder.id },
  };
}

async function fulfillOrder(orderId) {
  const order = await Order.findByPk(orderId);
  if (!order) throw new Error('订单不存在');
  if (order.status !== 'paid') throw new Error('订单状态不允许履约，需为已支付状态');

  const routingResult = await routingGateway.routeRequest(order.category, order.city, {});
  if (!routingResult.success) throw new Error(routingResult.message);

  const provider = await routingGateway.findBestProvider(order.category, order.city);
  const subOrders = await createSubOrders(order, provider);

  for (const subOrder of subOrders) {
    const result = simulateThirdPartyCall(subOrder.type, subOrder);
    await subOrder.update({
      third_party_no: result.thirdPartyNo,
      third_party_resp: JSON.stringify(result.response),
      status: 'processing',
    });
  }

  await order.update({ status: 'fulfilling', provider_id: provider.id });

  return { order, subOrders, provider };
}

module.exports = { createSubOrders, fulfillOrder, simulateThirdPartyCall };
