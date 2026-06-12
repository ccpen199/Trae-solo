import { http, HttpResponse } from 'msw';
import { mockInventoryItems, mockInventoryBatches, mockProducts } from '../fixtures/inventory';
import { mockMedicalRecords } from '../fixtures/medical';
import { successResponse, delay } from '../utils';

export const inventoryHandlers = [
  http.get('/api/store/inventory', async () => {
    await delay(400);
    return HttpResponse.json(successResponse(mockInventoryItems));
  }),

  http.get('/api/store/inventory/alerts', async () => {
    await delay(300);
    const alerts = mockInventoryItems.filter((item) => item.currentStock <= item.safetyStock);
    return HttpResponse.json(successResponse(alerts));
  }),

  http.get('/api/store/inventory/:id/batches', async ({ params }) => {
    await delay(300);
    const itemId = params.id as string;
    const batches = mockInventoryBatches.filter((b) => b.inventoryItemId === itemId);
    return HttpResponse.json(successResponse(batches));
  }),

  http.get('/api/shop/products', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    let products = mockProducts;
    if (category) {
      products = products.filter((p) => p.category === category);
    }
    return HttpResponse.json(successResponse(products));
  }),

  http.get('/api/shop/products/:id', async ({ params }) => {
    await delay(300);
    const id = params.id as string;
    const product = mockProducts.find((p) => p.id === id);
    return HttpResponse.json(successResponse(product));
  }),

  http.get('/api/shop/cart', async () => {
    await delay(300);
    return HttpResponse.json(
      successResponse({
        items: [
          { productId: 'prod_003', quantity: 2, product: mockProducts[2] },
          { productId: 'prod_004', quantity: 1, product: mockProducts[3] },
        ],
        total: 425,
      })
    );
  }),

  http.post('/api/shop/cart', async () => {
    await delay(300);
    return HttpResponse.json(successResponse({ success: true }));
  }),

  http.post('/api/reviews', async ({ request }) => {
    await delay(800);
    const body = await request.json();
    const review = {
      ...body,
      id: `review_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    return HttpResponse.json(successResponse(review));
  }),

  http.get('/api/reviews/:id', async () => {
    await delay(400);
    return HttpResponse.json(
      successResponse({
        id: 'review_001',
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewNote: '处方合理，用药规范，已通过审核。',
      })
    );
  }),

  http.get('/api/store/records', async () => {
    await delay(400);
    return HttpResponse.json(successResponse(mockMedicalRecords));
  }),

  http.post('/api/store/records', async ({ request }) => {
    await delay(500);
    const body = await request.json();
    const record = {
      ...body,
      id: `record_${Date.now()}`,
    };
    return HttpResponse.json(successResponse(record));
  }),

  http.put('/api/store/records/:id/sign', async ({ params, request }) => {
    await delay(300);
    const id = params.id as string;
    const body = await request.json();
    const record = mockMedicalRecords.find((r) => r.id === id);
    if (record) {
      record.signature = body.signature;
      record.signedAt = new Date().toISOString();
      record.archived = true;
      record.archivedAt = new Date().toISOString();
    }
    return HttpResponse.json(successResponse(record));
  }),
];
