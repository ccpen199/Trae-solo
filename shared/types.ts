export interface Metric {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: 'green' | 'blue' | 'amber' | 'slate';
}

export interface TraceBatch {
  id: string;
  traceCode: string;
  productName: string;
  category: string;
  specification: string;
  producer: string;
  origin: string;
  productionDate: string;
  shelfLife: number;
  status: string;
  blockchainHash: string;
  blockHeight: number;
  qualityResult: string;
}

export interface TimelineItem {
  id: string;
  stage: string;
  operator: string;
  eventTime: string;
  location: string;
  description: string;
  temperature?: number;
  humidity?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  wholesalePrice: number;
  moq: number;
  specification: string;
  traceCode: string;
  seller: string;
  origin: string;
  stock: number;
  sales: number;
  imageUrl: string;
  channel: 'b2b' | 'b2c';
}
