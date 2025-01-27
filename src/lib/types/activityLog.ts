export interface ActivityLog {
  id: string;
  salesOrderId: string;
  username: string;
  role: string;
  action: string;
  details?: string;
  category: string;
  timestamp: Date;
}

export type ActivityLogCategory = 
  | 'order_status_change'
  | 'document_upload'
  | 'customer_interaction'
  | 'payment_update'
  | 'shipment_update';

export interface CreateActivityLogInput {
  salesOrderId: string;
  username: string;
  role: string;
  action: string;
  details?: string;
  category: ActivityLogCategory;
}