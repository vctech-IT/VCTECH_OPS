import requests
import time
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import sys

# API credentials (same as before)
REFRESH_TOKEN = '1000.b94e5345a93e9e0f672a31a27a2fd390.0ba27ca3d43ba0863e11c303b6a8c16f'
CLIENT_ID = '1000.KXTGP1GAGIDX12Q294C6OIMVR60VMX'
CLIENT_SECRET = 'bb44b083c2b29eb4eefd1a605266a866fcd5f491fb'
REDIRECT_URI = 'https://www.google.com/'

# MongoDB connection string
MONGO_URI = "mongodb+srv://vctechops1:cL4FgfbyqPaG3gke@cluster0.icbqd.mongodb.net/VCTECH?retryWrites=true&w=majority&appName=Cluster0"

def refresh_token():
    """Refresh the Zoho API token"""
    print("Refreshing Zoho API token...")
    try:
        response = requests.post('https://accounts.zoho.in/oauth/v2/token', data={
            'refresh_token': REFRESH_TOKEN,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI,
            'grant_type': 'refresh_token'
        })
        response.raise_for_status()
        data = response.json()
        print("✅ Token refreshed successfully")
        return data['access_token']
    except Exception as e:
        print(f"❌ Error refreshing token: {str(e)}")
        sys.exit(1)

def fetch_all_zoho_sales_orders(token):
    """Fetch all sales orders from Zoho API"""
    print("Fetching sales orders from Zoho...")
    base_url = 'https://www.zohoapis.in/books/v3/salesorders'
    params = {
        'organization_id': '60005679410',
        'page': 1,
        'per_page': 200  # Max allowed by Zoho API
    }
    
    all_sales_orders = []
    
    try:
        has_more_pages = True
        while has_more_pages:
            headers = {
                'Authorization': f'Zoho-oauthtoken {token}'
            }
            print(f"Fetching page {params['page']}...")
            response = requests.get(base_url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            page_sales_orders = data.get('salesorders', [])
            all_sales_orders.extend(page_sales_orders)
            
            # Check if there are more pages
            page_context = data.get('page_context', {})
            has_more_pages = page_context.get('has_more_page', False)
            
            if has_more_pages:
                params['page'] += 1
                print(f"Moving to page {params['page']}...")
            else:
                total_pages = page_context.get('page', 1)
                print(f"Reached final page. Total pages fetched: {total_pages}")
        
        print(f"✅ Successfully fetched {len(all_sales_orders)} sales orders")
        return all_sales_orders
    
    except Exception as e:
        print(f"❌ Error fetching sales orders: {str(e)}")
        sys.exit(1)

def fetch_all_zoho_invoices(token):
    """Fetch all invoices from Zoho API"""
    print("Fetching invoices from Zoho...")
    base_url = 'https://www.zohoapis.in/books/v3/invoices'
    params = {
        'organization_id': '60005679410',
        'page': 1,
        'per_page': 200  # Max allowed by Zoho API
    }
    
    all_invoices = []
    
    try:
        has_more_pages = True
        while has_more_pages:
            headers = {
                'Authorization': f'Zoho-oauthtoken {token}'
            }
            print(f"Fetching invoice page {params['page']}...")
            response = requests.get(base_url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            page_invoices = data.get('invoices', [])
            all_invoices.extend(page_invoices)
            
            # Check if there are more pages
            page_context = data.get('page_context', {})
            has_more_pages = page_context.get('has_more_page', False)
            
            if has_more_pages:
                params['page'] += 1
                print(f"Moving to invoice page {params['page']}...")
            else:
                total_pages = page_context.get('page', 1)
                print(f"Reached final invoice page. Total pages fetched: {total_pages}")
        
        print(f"✅ Successfully fetched {len(all_invoices)} invoices")
        return all_invoices
    
    except Exception as e:
        print(f"❌ Error fetching invoices: {str(e)}")
        sys.exit(1)

def fetch_all_zoho_delivery_challans(token):
    """Fetch all delivery challans from Zoho API"""
    print("Fetching delivery challans from Zoho...")
    base_url = 'https://www.zohoapis.in/books/v3/deliverychallans'
    params = {
        'organization_id': '60005679410',
        'page': 1,
        'per_page': 200  # Max allowed by Zoho API
    }
    
    all_challans = []
    
    try:
        has_more_pages = True
        while has_more_pages:
            headers = {
                'Authorization': f'Zoho-oauthtoken {token}'
            }
            print(f"Fetching delivery challan page {params['page']}...")
            response = requests.get(base_url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            page_challans = data.get('deliverychallans', [])
            all_challans.extend(page_challans)
            
            # Check if there are more pages
            page_context = data.get('page_context', {})
            has_more_pages = page_context.get('has_more_page', False)
            
            if has_more_pages:
                params['page'] += 1
                print(f"Moving to delivery challan page {params['page']}...")
            else:
                total_pages = page_context.get('page', 1)
                print(f"Reached final delivery challan page. Total pages fetched: {total_pages}")
        
        print(f"✅ Successfully fetched {len(all_challans)} delivery challans")
        return all_challans
    
    except Exception as e:
        print(f"❌ Error fetching delivery challans: {str(e)}")
        sys.exit(1)

def map_sales_order_fields(sales_order):
    """Map Zoho sales order fields to MongoDB fields"""
    if not isinstance(sales_order, dict):
        print(f"❌ Invalid sales order data type: {type(sales_order)}")
        return None

    so_number = sales_order.get('salesorder_number', '')
    
    mapped_data = {
        '_id': so_number,
        'SOId': sales_order.get('salesorder_id', ''),
        'date': sales_order.get('date', ''),
        'clientName': sales_order.get('customer_name', ''),
        'SubTotal': float(sales_order.get('sub_total', 0.0)),
        'Total': float(sales_order.get('total', 0.0)),
        'deliveryMethod': sales_order.get('delivery_method', ''),
        'SOCategory': sales_order.get('cf_so_cat', ''),
        'PMName': sales_order.get('cf_project_manager_name', ''),
        'isDropped': False,
        'currentStage': 0,
        'orderStatus': sales_order.get('order_status', ''),
        'referenceNumber': sales_order.get('reference_number', ''),
        'invoiceStatus': sales_order.get('invoiced_status', ''),
        'paymentStatus': sales_order.get('paid_status', ''),
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }
    return mapped_data

def map_invoice_fields(invoice):
    """Map Zoho invoice fields to MongoDB fields"""
    if not isinstance(invoice, dict):
        print(f"❌ Invalid invoice data type: {type(invoice)}")
        return None

    # Note the difference: we're now using 'invoice_number' explicitly
    invoice_number = invoice.get('invoice_number', '')
    
    mapped_data = {
        'zoho_invoice_id': invoice.get('invoice_id', ''),
        'branch_name': invoice.get('branch_name', ''),
        'balance': float(invoice.get('balance', 0.0)),
        'total': float(invoice.get('total', 0.0)),
        'reference_number': invoice.get('reference_number', ''),
        'date': datetime.fromisoformat(invoice.get('date', datetime.now().isoformat())),
        'invoice_number': invoice_number,  # Added this field explicitly
        'customer_name': invoice.get('customer_name', ''),
        'status': invoice.get('status', ''),
        'due_date': datetime.fromisoformat(invoice.get('due_date', datetime.now().isoformat())),
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }
    return mapped_data

def map_delivery_challan_fields(challan):
    """Map Zoho delivery challan fields to MongoDB fields"""
    if not isinstance(challan, dict):
        print(f"❌ Invalid delivery challan data type: {type(challan)}")
        return None

    dc_number = challan.get('deliverychallan_number', '')
    
    mapped_data = {
        '_id': str(ObjectId()),  # Generate a MongoDB ObjectId
        'dcNumber': dc_number,
        'dcNumber_id': challan.get('deliverychallan_id', ''),
        'date': datetime.fromisoformat(challan.get('date', datetime.now().isoformat())),
        'customerName': challan.get('customer_name', ''),
        'referenceNumber': challan.get('reference_number', ''),
        'total': float(challan.get('total', 0.0)),
        'status': challan.get('status', ''),
        'branchName': challan.get('branch_name', ''),
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }
    return mapped_data


def import_sales_orders_to_mongodb(data):
    """Import or update sales orders in MongoDB"""
    print(f"Starting import/update of {len(data)} sales orders...")
    
    client = MongoClient(MONGO_URI)
    db = client['VCTECH']
    collection = db['Stage0']

    update_count = 0
    insert_count = 0

    for item in data:
        try:
            item_id = item.get('_id')
            if not item_id:
                print(f"⚠️ Skipping sales order record with missing SONumber/_id")
                continue
            
            existing_record = collection.find_one({'_id': item_id})
            
            if existing_record:
                collection.update_one(
                    {'_id': item_id}, 
                    {'$set': {
                        'orderStatus': item.get('orderStatus', existing_record.get('orderStatus')),
                        'invoiceStatus': item.get('invoiceStatus', existing_record.get('invoiceStatus')),
                        'updatedAt': datetime.now()
                    }}
                )
                update_count += 1
            else:
                collection.insert_one(item)
                insert_count += 1
        
        except Exception as e:
            print(f"Error processing sales order item {item_id}: {str(e)}")
    
    client.close()
    
    print("=" * 50)
    print(f"✅ SALES ORDER IMPORT/UPDATE COMPLETE:")
    print(f"   - Updated records: {update_count}")
    print(f"   - Inserted new records: {insert_count}")
    print("=" * 50)
    
    return update_count, insert_count

def import_invoices_to_mongodb(data):
    """Import or update invoices in MongoDB"""
    print(f"Starting import/update of {len(data)} invoices...")
    
    client = MongoClient(MONGO_URI)
    db = client['VCTECH']
    collection = db['Invoice']  

    update_count = 0
    insert_count = 0

    for item in data:
        try:
           
            invoice_number = item.get('invoice_number')
            if not invoice_number:
                print(f"⚠️ Skipping invoice record with missing invoice number")
                continue
            
            existing_record = collection.find_one({'invoice_number': invoice_number})
            
            if existing_record:
                collection.update_one(
                    {'invoice_number': invoice_number}, 
                    {'$set': {
                        'status': item.get('status', existing_record.get('status')),
                        'balance': item.get('balance', existing_record.get('balance')),
                        'total': item.get('total', existing_record.get('total')),
                        'updatedAt': datetime.now()
                    }}
                )
                update_count += 1
            else:
                collection.insert_one(item)
                insert_count += 1
        
        except Exception as e:
            print(f"Error processing invoice item {invoice_number}: {str(e)}")
    
    client.close()
    
    print("=" * 50)
    print(f"✅ INVOICE IMPORT/UPDATE COMPLETE:")
    print(f"   - Updated records: {update_count}")
    print(f"   - Inserted new records: {insert_count}")
    print("=" * 50)
    
    return update_count, insert_count

def import_delivery_challans_to_mongodb(data):
    """Import or update delivery challans in MongoDB"""
    print(f"Starting import/update of {len(data)} delivery challans...")
    
    client = MongoClient(MONGO_URI)
    db = client['VCTECH']
    collection = db['DeliveryChallans']

    update_count = 0
    insert_count = 0

    for item in data:
        try:
            dc_number = item.get('dcNumber')
            dc_number_id = item.get('dcNumber_id')
            
            if not dc_number or not dc_number_id:
                print(f"⚠️ Skipping delivery challan record with missing dcNumber or dcNumber_id")
                continue
            
            existing_record = collection.find_one({'dcNumber': dc_number})
            
            if existing_record:
                collection.update_one(
                    {'dcNumber': dc_number}, 
                    {'$set': {
                        'status': item.get('status', existing_record.get('status')),
                        'total': item.get('total', existing_record.get('total')),
                        'updatedAt': datetime.now()
                    }}
                )
                update_count += 1
            else:
                collection.insert_one(item)
                insert_count += 1
        
        except Exception as e:
            print(f"Error processing delivery challan item {dc_number}: {str(e)}")
    
    client.close()
    
    print("=" * 50)
    print(f"✅ DELIVERY CHALLAN IMPORT/UPDATE COMPLETE:")
    print(f"   - Updated records: {update_count}")
    print(f"   - Inserted new records: {insert_count}")
    print("=" * 50)
    
    return update_count, insert_count


def main():
    print("=" * 50)
    print("ZOHO SALES ORDER, INVOICE & DELIVERY CHALLAN IMPORT/UPDATE")
    print("=" * 50)
    
    start_time = time.time()
    
    # Get a fresh token
    token = refresh_token()
    
    # Fetch sales orders
    sales_orders = fetch_all_zoho_sales_orders(token)
    
    # Fetch invoices
    invoices = fetch_all_zoho_invoices(token)
    
    # Fetch delivery challans
    delivery_challans = fetch_all_zoho_delivery_challans(token)
    
    # Map sales order data
    print("\nMapping Zoho sales order fields to database schema...")
    mapped_sales_orders = []
    for order in sales_orders:
        mapped_item = map_sales_order_fields(order)
        if mapped_item is not None:
            mapped_sales_orders.append(mapped_item)
    
    # Map invoice data
    print("\nMapping Zoho invoice fields to database schema...")
    mapped_invoices = []
    for invoice in invoices:
        mapped_item = map_invoice_fields(invoice)
        if mapped_item is not None:
            mapped_invoices.append(mapped_item)
    
    # Map delivery challan data
    print("\nMapping Zoho delivery challan fields to database schema...")
    mapped_challans = []
    for challan in delivery_challans:
        mapped_item = map_delivery_challan_fields(challan)
        if mapped_item is not None:
            mapped_challans.append(mapped_item)
    
    # Import/Update sales orders
    so_update_count, so_insert_count = import_sales_orders_to_mongodb(mapped_sales_orders)
    
    # Import/Update invoices
    inv_update_count, inv_insert_count = import_invoices_to_mongodb(mapped_invoices)
    
    # Import/Update delivery challans
    dc_update_count, dc_insert_count = import_delivery_challans_to_mongodb(mapped_challans)
    
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    
    print("=" * 50)
    print(f"✅ TOTAL IMPORT/UPDATE COMPLETE:")
    print(f"   - Total sales order records processed: {so_update_count + so_insert_count}")
    print(f"   - Sales order updated records: {so_update_count}")
    print(f"   - Sales order inserted new records: {so_insert_count}")
    print(f"   - Total invoice records processed: {inv_update_count + inv_insert_count}")
    print(f"   - Invoice updated records: {inv_update_count}")
    print(f"   - Invoice inserted new records: {inv_insert_count}")
    print(f"   - Total delivery challan records processed: {dc_update_count + dc_insert_count}")
    print(f"   - Delivery challan updated records: {dc_update_count}")
    print(f"   - Delivery challan inserted new records: {dc_insert_count}")
    print(f"   - Total time taken: {elapsed_time:.2f} seconds")
    print("=" * 50)
if __name__ == "__main__":
    main()
