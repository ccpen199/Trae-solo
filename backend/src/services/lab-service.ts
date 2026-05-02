import { knex } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { auditEngine } from '../engines/audit-engine';

export interface LabOrder {
  id: string;
  orderNumber: string;
  visitId: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  type: 'LAB' | 'IMAGING' | 'FUNCTION';
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  items: LabOrderItem[];
  urgency: 'ROUTINE' | 'URGENT' | 'STAT';
  clinicalIndication?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
  resultBy?: string;
  resultByName?: string;
  remark?: string;
  createdAt: Date;
}

export interface LabOrderItem {
  id: string;
  labItemId?: string;
  itemName: string;
  itemCode?: string;
  category?: string;
  quantity: number;
  unit?: string;
  price?: number;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  remark?: string;
}

export interface CreateLabOrderRequest {
  visitId: string;
  type: 'LAB' | 'IMAGING' | 'FUNCTION';
  urgency: 'ROUTINE' | 'URGENT' | 'STAT';
  items: Omit<LabOrderItem, 'id' | 'price' | 'resultValue' | 'resultUnit' | 'referenceRange' | 'isAbnormal'>[];
  clinicalIndication?: string;
  remark?: string;
}

export class LabService {
  async createLabOrder(
    request: CreateLabOrderRequest,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<LabOrder> {
    const visit = await knex('visits')
      .leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
      .select(
        'visits.id',
        'visits.patient_id as patientId',
        'patients.name as patientName'
      )
      .where('visits.id', request.visitId)
      .first();

    if (!visit) {
      throw new Error('就诊记录不存在');
    }

    const orderNumber = this.generateOrderNumber(request.type);

    const orderData = {
      id: uuidv4(),
      order_number: orderNumber,
      visit_id: request.visitId,
      patient_id: visit.patientId,
      doctor_id: user.id,
      type: request.type,
      status: 'PENDING' as const,
      urgency: request.urgency,
      clinical_indication: request.clinicalIndication,
      remark: request.remark,
    };

    await knex('lab_orders').insert(orderData);

    const items: LabOrderItem[] = [];
    for (let i = 0; i < request.items.length; i++) {
      const item = request.items[i];

      const labItem = await knex('lab_items')
        .select('id', 'name', 'code', 'category', 'unit', 'price', 'reference_range')
        .where('id', item.labItemId)
        .first();

      const itemData = {
        id: uuidv4(),
        lab_order_id: orderData.id,
        lab_item_id: item.labItemId,
        item_name: item.itemName || labItem?.name || '',
        item_code: item.itemCode || labItem?.code,
        category: item.category || labItem?.category,
        quantity: item.quantity,
        unit: item.unit || labItem?.unit,
        price: labItem?.price || 0,
        reference_range: labItem?.reference_range,
        sort_order: i,
      };

      await knex('lab_order_items').insert(itemData);

      items.push({
        id: itemData.id,
        labItemId: itemData.lab_item_id,
        itemName: itemData.item_name,
        itemCode: itemData.item_code,
        category: itemData.category,
        quantity: itemData.quantity,
        unit: itemData.unit,
        price: itemData.price,
        referenceRange: itemData.reference_range,
      });
    }

    await auditEngine.logCreate(
      'LAB_ORDER',
      'lab_orders',
      orderData.id,
      { ...orderData, items },
      user,
      ipAddress,
      `创建检查单: ${orderNumber}`
    );

    return this.getLabOrderById(orderData.id);
  }

  async getLabOrderById(orderId: string): Promise<LabOrder> {
    const order = await knex('lab_orders')
      .leftJoin('patients', 'lab_orders.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'lab_orders.doctor_id', '=', 'doctors.id')
      .leftJoin('users as result_users', 'lab_orders.result_by', '=', 'result_users.id')
      .select(
        'lab_orders.id',
        'lab_orders.order_number as orderNumber',
        'lab_orders.visit_id as visitId',
        'lab_orders.patient_id as patientId',
        'patients.name as patientName',
        'lab_orders.doctor_id as doctorId',
        'doctors.name as doctorName',
        'lab_orders.type',
        'lab_orders.status',
        'lab_orders.urgency',
        'lab_orders.clinical_indication as clinicalIndication',
        'lab_orders.scheduled_at as scheduledAt',
        'lab_orders.started_at as startedAt',
        'lab_orders.completed_at as completedAt',
        'lab_orders.result',
        'lab_orders.result_by as resultBy',
        'result_users.name as resultByName',
        'lab_orders.remark',
        'lab_orders.created_at as createdAt'
      )
      .where('lab_orders.id', orderId)
      .first();

    if (!order) {
      throw new Error('检查单不存在');
    }

    const items = await knex('lab_order_items')
      .select(
        'id',
        'lab_item_id as labItemId',
        'item_name as itemName',
        'item_code as itemCode',
        'category',
        'quantity',
        'unit',
        'price',
        'result_value as resultValue',
        'result_unit as resultUnit',
        'reference_range as referenceRange',
        'is_abnormal as isAbnormal',
        'remark'
      )
      .where('lab_order_id', orderId)
      .orderBy('sort_order', 'asc');

    return {
      ...order,
      items,
    };
  }

  async getVisitLabOrders(visitId: string): Promise<LabOrder[]> {
    const orders = await knex('lab_orders')
      .leftJoin('patients', 'lab_orders.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'lab_orders.doctor_id', '=', 'doctors.id')
      .select(
        'lab_orders.id',
        'lab_orders.order_number as orderNumber',
        'lab_orders.visit_id as visitId',
        'lab_orders.patient_id as patientId',
        'patients.name as patientName',
        'lab_orders.doctor_id as doctorId',
        'doctors.name as doctorName',
        'lab_orders.type',
        'lab_orders.status',
        'lab_orders.urgency',
        'lab_orders.scheduled_at as scheduledAt',
        'lab_orders.started_at as startedAt',
        'lab_orders.completed_at as completedAt',
        'lab_orders.created_at as createdAt'
      )
      .where('lab_orders.visit_id', visitId)
      .orderBy('lab_orders.created_at', 'desc');

    const results: LabOrder[] = [];

    for (const o of orders) {
      const items = await knex('lab_order_items')
        .select(
          'id',
          'lab_item_id as labItemId',
          'item_name as itemName',
          'item_code as itemCode',
          'category',
          'quantity',
          'unit',
          'price',
          'result_value as resultValue',
          'result_unit as resultUnit',
          'reference_range as referenceRange',
          'is_abnormal as isAbnormal',
          'remark'
        )
        .where('lab_order_id', o.id)
        .orderBy('sort_order', 'asc');

      results.push({
        ...o,
        items,
      });
    }

    return results;
  }

  async getPendingLabOrders(
    userRole: string,
    options: { limit?: number; offset?: number; type?: string } = {}
  ): Promise<{ orders: LabOrder[]; total: number }> {
    let baseQuery = knex('lab_orders')
      .leftJoin('patients', 'lab_orders.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'lab_orders.doctor_id', '=', 'doctors.id');

    if (userRole === 'NURSE' || userRole === 'TECHNICIAN') {
      baseQuery = baseQuery.whereIn('lab_orders.status', ['PENDING', 'IN_PROGRESS']);
    } else if (userRole === 'DOCTOR') {
      baseQuery = baseQuery.whereNotIn('lab_orders.status', ['CANCELLED']);
    } else {
      baseQuery = baseQuery.whereNotIn('lab_orders.status', ['CANCELLED']);
    }

    if (options.type) {
      baseQuery = baseQuery.where('lab_orders.type', options.type);
    }

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    let query = baseQuery
      .clone()
      .select(
        'lab_orders.id',
        'lab_orders.order_number as orderNumber',
        'lab_orders.visit_id as visitId',
        'lab_orders.patient_id as patientId',
        'patients.name as patientName',
        'lab_orders.doctor_id as doctorId',
        'doctors.name as doctorName',
        'lab_orders.type',
        'lab_orders.status',
        'lab_orders.urgency',
        'lab_orders.scheduled_at as scheduledAt',
        'lab_orders.started_at as startedAt',
        'lab_orders.completed_at as completedAt',
        'lab_orders.created_at as createdAt'
      )
      .orderBy('lab_orders.urgency', 'desc')
      .orderBy('lab_orders.created_at', 'asc');

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const orders = await query;

    const results: LabOrder[] = [];
    for (const o of orders) {
      const items = await knex('lab_order_items')
        .select(
          'id',
          'lab_item_id as labItemId',
          'item_name as itemName',
          'item_code as itemCode',
          'category',
          'quantity',
          'unit',
          'price',
          'result_value as resultValue',
          'result_unit as resultUnit',
          'reference_range as referenceRange',
          'is_abnormal as isAbnormal',
          'remark'
        )
        .where('lab_order_id', o.id)
        .orderBy('sort_order', 'asc');

      results.push({
        ...o,
        items,
      });
    }

    return { orders: results, total };
  }

  async startLabOrder(
    orderId: string,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<LabOrder> {
    const order = await knex('lab_orders')
      .select('*')
      .where('id', orderId)
      .first();

    if (!order) {
      throw new Error('检查单不存在');
    }

    if (order.status !== 'PENDING') {
      throw new Error('检查单状态不允许开始');
    }

    const oldValue = { ...order };

    await knex('lab_orders')
      .where('id', orderId)
      .update({
        status: 'IN_PROGRESS',
        started_at: new Date(),
        updated_at: new Date(),
      });

    await auditEngine.logStatusChange(
      'LAB_ORDER',
      'lab_orders',
      orderId,
      'PENDING',
      'IN_PROGRESS',
      user,
      ipAddress,
      '开始检查'
    );

    return this.getLabOrderById(orderId);
  }

  async completeLabOrder(
    orderId: string,
    result: string,
    itemResults: {
      itemId: string;
      resultValue?: string;
      resultUnit?: string;
      isAbnormal?: boolean;
    }[],
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<LabOrder> {
    const order = await knex('lab_orders')
      .select('*')
      .where('id', orderId)
      .first();

    if (!order) {
      throw new Error('检查单不存在');
    }

    if (order.status !== 'IN_PROGRESS') {
      throw new Error('检查单状态不允许完成');
    }

    const trx = await knex.transaction();

    try {
      await trx('lab_orders')
        .where('id', orderId)
        .update({
          status: 'COMPLETED',
          result,
          result_by: user.id,
          completed_at: new Date(),
          updated_at: new Date(),
        });

      for (const itemResult of itemResults) {
        await trx('lab_order_items')
          .where('id', itemResult.itemId)
          .where('lab_order_id', orderId)
          .update({
            result_value: itemResult.resultValue,
            result_unit: itemResult.resultUnit,
            is_abnormal: itemResult.isAbnormal,
            updated_at: new Date(),
          });
      }

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    await auditEngine.logUpdate(
      'LAB_ORDER',
      'lab_orders',
      orderId,
      { status: 'IN_PROGRESS' },
      { status: 'COMPLETED', result, resultBy: user.id },
      user,
      ipAddress,
      '完成检查'
    );

    return this.getLabOrderById(orderId);
  }

  async cancelLabOrder(
    orderId: string,
    cancelReason: string,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<LabOrder> {
    const order = await knex('lab_orders')
      .select('*')
      .where('id', orderId)
      .first();

    if (!order) {
      throw new Error('检查单不存在');
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new Error('检查单状态不允许取消');
    }

    const oldValue = { ...order };

    await knex('lab_orders')
      .where('id', orderId)
      .update({
        status: 'CANCELLED',
        remark: cancelReason,
        updated_at: new Date(),
      });

    await auditEngine.logStatusChange(
      'LAB_ORDER',
      'lab_orders',
      orderId,
      order.status,
      'CANCELLED',
      user,
      ipAddress,
      `取消检查单，原因: ${cancelReason}`
    );

    return this.getLabOrderById(orderId);
  }

  private generateOrderNumber(type: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    const prefix = type === 'LAB' ? 'LAB' : type === 'IMAGING' ? 'IMG' : 'FUN';
    return `${prefix}${year}${month}${day}${random}`;
  }
}

export const labService = new LabService();
