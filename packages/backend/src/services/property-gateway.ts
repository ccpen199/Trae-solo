import type { PropertyServiceType } from '@neighborhood/shared';
import { prisma } from '../config/database.js';

export async function callPropertyApi(
  tenantId: string,
  serviceType: PropertyServiceType,
  endpoint: string,
  method: string = 'GET',
  data?: Record<string, unknown>,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const apiConfig = await prisma.propertyApiConfig.findFirst({
    where: { tenantId, serviceType, isActive: true },
  });

  if (!apiConfig) {
    return { success: false, error: `No active API config for service type: ${serviceType}` };
  }

  const startTime = Date.now();
  let statusCode = 0;
  let responseBody = '';
  let success = false;
  let errorMessage: string | undefined;

  try {
    const url = `${apiConfig.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiConfig.apiKey) {
      headers['X-Api-Key'] = apiConfig.apiKey;
    }

    if (apiConfig.accessToken) {
      headers['Authorization'] = `Bearer ${apiConfig.accessToken}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, fetchOptions);
    statusCode = response.status;
    responseBody = await response.text();
    success = response.ok;

    if (!success) {
      errorMessage = `Third-party API returned ${statusCode}`;
    }
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    statusCode = 0;
  }

  const responseTimeMs = Date.now() - startTime;

  await prisma.apiRequestLog.create({
    data: {
      tenantId,
      serviceType,
      endpoint,
      method,
      requestBody: data ? JSON.stringify(data) : undefined,
      responseBody: responseBody || undefined,
      statusCode,
      responseTimeMs,
      success,
      errorMessage,
    },
  });

  if (!success) {
    return { success: false, error: errorMessage ?? 'Third-party API call failed' };
  }

  try {
    const parsed = JSON.parse(responseBody);
    return { success: true, data: parsed };
  } catch {
    return { success: true, data: responseBody };
  }
}

export async function requestDoorAccess(userId: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const device = await prisma.accessControlDevice.findUnique({ where: { id: deviceId } });
  if (!device) {
    return { success: false, error: 'Device not found' };
  }

  if (device.status !== 'online') {
    return { success: false, error: 'Device is offline' };
  }

  const accessCard = await prisma.accessCard.findFirst({
    where: { userId, status: 'active', tenantId: user.tenantId },
  });

  if (!accessCard) {
    return { success: false, error: 'No active access card found' };
  }

  const result = await callPropertyApi(
    user.tenantId,
    'access_control',
    `/devices/${device.deviceCode}/open`,
    'POST',
    { userId, cardNumber: accessCard.cardNumber, deviceId: device.deviceCode },
  );

  if (result.success) {
    await prisma.accessRecord.create({
      data: {
        userId,
        tenantId: user.tenantId,
        cardId: accessCard.id,
        deviceId: device.deviceCode,
        deviceName: device.deviceName,
        accessType: 'entry',
        accessPoint: device.location,
        accessResult: 'success',
        accessMethod: 'app',
      },
    });
  }

  return result;
}

export async function syncPaymentBills(tenantId: string): Promise<{ success: boolean; synced?: number; error?: string }> {
  const result = await callPropertyApi(tenantId, 'payment', '/bills/sync', 'POST', { tenantId });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, synced: (result.data as { synced?: number })?.synced ?? 0 };
}

export async function submitRepairToThirdParty(repairId: string): Promise<{ success: boolean; error?: string }> {
  const repair = await prisma.repairRequest.findUnique({ where: { id: repairId } });
  if (!repair) {
    return { success: false, error: 'Repair request not found' };
  }

  const result = await callPropertyApi(repair.tenantId, 'repair', '/repairs', 'POST', {
    orderNo: repair.orderNo,
    title: repair.title,
    description: repair.description,
    category: repair.category,
    priority: repair.priority,
    householdId: repair.householdId,
  });

  return result;
}
