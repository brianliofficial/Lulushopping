export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  maxQty: number;
  /** 對應 Supabase foodlist.product_pic */
  imageUrl?: string;
};

export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  maxQty: number;
  quantity: number;
  imageUrl?: string;
};

export type OrderLinePayload = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** foodlist.id，用於扣庫存與彙總已訂數量 */
  productId?: string;
};

export type OrderPayload = {
  customerName: string;
  phone: string;
  transferLast5: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  items: OrderLinePayload[];
  total: number;
  createdAt: string;
};
