// This file is now the single source of truth for your data structures.

export interface InwardItem {
  id: number;
  productId: string | null;
  productName: string;
  productDescription: string;
  sku: string;
  uom: string;
  InQty: string;
  BatchNo: string;
  MfdDate: string;
  Remarks: string;
}

export interface Product {
  _id: string;
  ProductName: string;
  ProductDesc?: string;
  ProductSku: string;
  UOM: string;
}

export interface Warehouse {
  _id:string;
  Warehousename: string;
}