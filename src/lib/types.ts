// types.ts

export interface SalesOrder {
    salesorder_id: string;
    documents: Document[];
    zcrm_potential_id: string;
    zcrm_potential_name: string;
    salesorder_number: string;
    date: string;
    offline_created_date_with_time: string;
    tracking_url: string;
    has_discount: boolean;
    is_pre_gst: boolean;
    invoice_conversion_type: string;
    status: string;
    color_code: string;
    current_sub_status_id: string;
    current_sub_status: string;
    sub_statuses: string[];
    shipment_date: string;
    reference_number: string;
    customer_id: string;
    customer_name: string;
    contact_persons: ContactPerson[];
    contact_person_details: ContactPerson[];
    source: string;
    gst_no: string;
    contact_category: string;
    gst_treatment: string;
    tax_treatment: string;
    place_of_supply: string;
    tax_specification: string;
    is_taxable: boolean;
    has_shipping_address: boolean;
    currency_id: string;
    currency_code: string;
    currency_symbol: string;
    exchange_rate: number;
    is_discount_before_tax: boolean;
    discount_type: string;
    estimate_id: string;
    delivery_method: string;
    delivery_method_id: string;
    is_inclusive_tax: boolean;
    tax_rounding: string;
    tds_override_preference: string;
    order_status: string;
    invoiced_status: string;
    paid_status: string;
    account_identifier: string;
    integration_id: string;
    has_qty_cancelled: boolean;
    is_reverse_charge_applied: boolean;
    shipping_details: Record<string, unknown>;
    created_by_email: string;
    created_by_name: string;
    branch_id: string;
    branch_name: string;
    location_id: string;
    location_name: string;
    total_quantity: number;
    line_items: LineItem[];
    entity_tags: string;
    submitter_id: string;
    approver_id: string;
    submitted_date: string;
    submitted_by: string;
    submitted_by_name: string;
    submitted_by_email: string;
    submitted_by_photo_url: string;
    price_precision: number;
    is_emailed: boolean;
    purchaseorders: string[];
    warehouses: Warehouse[];
    billing_address_id: string;
    billing_address: Address;
    shipping_address_id: string;
    shipping_address: Address;
    is_test_order: boolean;
    notes: string;
    terms: string;
    payment_terms: number;
    payment_terms_label: string;
    custom_fields: CustomField[];
    custom_field_hash: Record<string, unknown>;
    template_id: string;
    template_name: string;
    page_width: string;
    page_height: string;
    orientation: string;
    template_type: string;
    created_time: string;
    last_modified_time: string;
    created_by_id: string;
    created_date: string;
    last_modified_by_id: string;
    attachment_name: string;
    can_send_in_mail: boolean;
    salesperson_id: string;
    salesperson_name: string;
    merchant_id: string;
    merchant_name: string;
    merchant_gst_no: string;
    pickup_location_id: string;
    discount: number;
    discount_applied_on_amount: number;
    is_adv_tracking_in_package: boolean;
    shipping_charge_tax_id: string;
    shipping_charge_tax_name: string;
    shipping_charge_tax_type: string;
    shipping_charge_tax_percentage: string;
    shipping_charge_tax_exemption_id: string;
    shipping_charge_tax_exemption_code: string;
    shipping_charge_sac_code: string;
    shipping_charge_tax: string;
    bcy_shipping_charge_tax: string;
    shipping_charge_exclusive_of_tax: number;
    shipping_charge_inclusive_of_tax: number;
    shipping_charge_tax_formatted: string;
    shipping_charge_exclusive_of_tax_formatted: string;
    shipping_charge_inclusive_of_tax_formatted: string;
    shipping_charge: number;
    bcy_shipping_charge: number;
    adjustment: number;
    bcy_adjustment: number;
    adjustment_description: string;
    roundoff_value: number;
    transaction_rounding_type: string;
    sub_total: number;
    bcy_sub_total: number;
    sub_total_inclusive_of_tax: number;
    sub_total_exclusive_of_discount: number;
    discount_total: number;
    bcy_discount_total: number;
    discount_percent: number;
    tax_total: number;
    bcy_tax_total: number;
    total: number;
    computation_type: string;
    bcy_total: number;
    reverse_charge_tax_total: number;
    taxes: Tax[];
    tds_calculation_type: string;
    tds_summary: string[];
    invoices: string[];
    contact: Contact;
    balance: number;
    approvers_list: string[];
    activityLogs?: ActivityLog[];
    opsStatus: number | null;
}

export interface ActivityLog {
    id: string;
    salesOrderId: string;
    username: string;
    role: string;
    action: string;
    timestamp: Date;
}

export interface Document {
    can_send_in_mail: boolean;
    file_name: string;
    attachment_order: number;
    source: string;
    document_id: string;
    file_size: string;
    source_formatted: string;
    uploaded_by: string;
    file_type: string;
    file_size_formatted: string;
    uploaded_on: string;
    alter_text: string;
    uploaded_on_date_formatted: string;
}

export interface ContactPerson {
    phone: string;
    mobile: string;
    last_name: string;
    contact_person_id: string;
    first_name: string;
    email: string;
}

export interface LineItem {
    line_item_id: string;
    variant_id: string;
    item_id: string;
    product_id: string;
    attribute_name1: string;
    attribute_name2: string;
    attribute_name3: string;
    attribute_option_name1: string;
    attribute_option_name2: string;
    attribute_option_name3: string;
    attribute_option_data1: string;
    attribute_option_data2: string;
    attribute_option_data3: string;
    is_combo_product: boolean;
    name: string;
    group_name: string;
    description: string;
    item_order: number;
    bcy_rate: number;
    rate: number;
    sales_rate: number;
    quantity: number;
    unit: string;
    pricebook_id: string;
    header_id: string;
    header_name: string;
    discount_amount: number;
    discount: number;
    discounts: string[];
    gst_treatment_code: string;
    tax_id: string;
    tax_name: string;
    tax_type: string;
    tax_percentage: number;
    line_item_taxes: LineItemTax[];
    item_total: number;
    item_sub_total: number;
    product_type: string;
    line_item_type: string;
    item_type: string;
    hsn_or_sac: string;
    is_invoiced: boolean;
    tags: string[];
    image_name: string;
    image_type: string;
    image_document_id: string;
    document_id: string;
    item_custom_fields: CustomField[];
    custom_field_hash: Record<string, unknown>;
    quantity_invoiced: number;
    quantity_backordered: number;
    quantity_cancelled: number;
    is_fulfillable: number;
    project_id: string;
}

export interface LineItemTax {
    tax_id: string;
    tax_name: string;
    tax_amount: number;
}

export interface Warehouse {
    warehouse_id: string;
    warehouse_name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    phone: string;
    email: string;
    is_primary: boolean;
    status: string;
    sales_channels: string[];
}

export interface Address {
    address: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    country_code: string;
    state_code: string;
    fax: string;
    phone: string;
    attention: string;
}

export interface Tax {
    tax_amount: number;
    tax_name: string;
    tax_amount_formatted: string;
}

export interface Contact {
    customer_balance: number;
    credit_limit: number;
    unused_customer_credits: number;
    is_credit_limit_migration_completed: boolean;
}

export interface CustomField {
    label: string;
    value: string;
}

export interface Invoice {
    invoice_number: string;
    customer_name: string;
    total: number;
    date: string;
    status: string;
    // Add other fields as necessary
}

export interface ActionData {
  user?: string;
  emailid?: string;
  phoneno?: string;
}

export interface LogEntry {
  username: string;
  role: string;
  action: string;
  timestamp: Date;
}

