import requests
import time
from datetime import datetime
from pymongo import MongoClient
import sys

# API credentials
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
        
        # Display sample data
        print("\n=== SAMPLE DATA FROM API ===")
        for i, order in enumerate(all_sales_orders[:3]):
            print(f"Sample {i+1}:")
            print(f"  salesorder_number: {order.get('salesorder_number', 'N/A')}")
            print(f"  salesorder_id: {order.get('salesorder_id', 'N/A')}")
            print(f"  customer_name: {order.get('customer_name', 'N/A')}")
            print("-" * 40)
        
        return all_sales_orders
    
    except Exception as e:
        print(f"❌ Error fetching sales orders: {str(e)}")
        sys.exit(1)

def map_fields(sales_order):
    """Map Zoho fields to MongoDB fields"""
    # Add type checking and error handling
    if not isinstance(sales_order, dict):
        print(f"❌ Invalid sales order data type: {type(sales_order)}")
        print(f"Sales order content: {sales_order}")
        return None

    so_number = sales_order.get('salesorder_number', '')
    
    mapped_data = {
        '_id': so_number,  # Use SONumber as _id directly
        'SOId': sales_order.get('salesorder_id', ''),
        'clientName': sales_order.get('customer_name', ''),
        'SubTotal': float(sales_order.get('sub_total', 0.0)),
        'Total': float(sales_order.get('total', 0.0)),
        'SOCategory': sales_order.get('cf_so_cat', ''),
        'PMName': sales_order.get('cf_project_manager_name', ''),
        'isDropped': False,
        'currentStage': 0,
        'orderStatus': sales_order.get('order_status', ''),
        'referenceNumber': sales_order.get('reference_number', ''),
        'invoiceStatus': sales_order.get('invoiced_status', ''),
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }
    return mapped_data

def check_if_already_imported():
    """Check if data has already been imported to prevent duplicates"""
    print("Checking if data has already been imported...")
    client = MongoClient(MONGO_URI)
    db = client['VCTECH']
    collection = db['Stage0']
    
    count = collection.count_documents({})
    client.close()
    
    if count > 0:
        print(f"⚠️ Database already contains {count} records. Import already done.")
        return True
    
    print("✅ Database is empty. Ready for first import.")
    return False

def import_data_to_mongodb(data):
    """Import or update data in MongoDB"""
    print(f"Starting import/update of {len(data)} records...")
    
    client = MongoClient(MONGO_URI)
    db = client['VCTECH']
    collection = db['Stage0']

    update_count = 0
    insert_count = 0

    for item in data:
        try:
            # Only process if _id (SONumber) exists
            item_id = item.get('_id')
            if not item_id:
                print(f"⚠️ Skipping record with missing SONumber/_id")
                continue
            
            # Try to find existing record
            existing_record = collection.find_one({'_id': item_id})
            
            if existing_record:
                # Update existing record
                collection.update_one(
                    {'_id': item_id}, 
                    {'$set': {
                        # Update only specific fields you want to modify
                        'orderStatus': item.get('orderStatus', existing_record.get('orderStatus')),
                        'invoiceStatus': item.get('invoiceStatus', existing_record.get('invoiceStatus')),
                        'updatedAt': datetime.now()
                    }}
                )
                update_count += 1
                
                # Display sample of updated records
                if update_count <= 3:
                    print("\n=== SAMPLE UPDATED RECORD ===")
                    print(f"  _id (SONumber): {item_id}")
                    print(f"  Updated orderStatus: {item.get('orderStatus')}")
                    print(f"  Updated invoiceStatus: {item.get('invoiceStatus')}")
                    print("-" * 40)
            else:
                # Insert new record if not exists
                collection.insert_one(item)
                insert_count += 1
                
                # Display sample of inserted records
                if insert_count <= 3:
                    print("\n=== SAMPLE INSERTED RECORD ===")
                    print(f"  _id (SONumber): {item_id}")
                    print(f"  clientName: {item.get('clientName')}")
                    print("-" * 40)
            
            # Show progress every 50 records
            if (update_count + insert_count) % 50 == 0:
                print(f"Processed {update_count + insert_count}/{len(data)} records...")
        
        except Exception as e:
            print(f"Error processing item {item_id}: {str(e)}")
    
    client.close()
    
    print("=" * 50)
    print(f"✅ IMPORT/UPDATE COMPLETE:")
    print(f"   - Updated records: {update_count}")
    print(f"   - Inserted new records: {insert_count}")
    print("=" * 50)
    
    return update_count, insert_count
def main():
    print("=" * 50)
    print("ZOHO SALES ORDER IMPORT/UPDATE")
    print("=" * 50)
    
    start_time = time.time()
    
    # Get a fresh token
    token = refresh_token()
    
    # Fetch sales orders
    sales_orders = fetch_all_zoho_sales_orders(token)
    
    # Debug: Print first few items to understand structure
    print("\nFirst few sales order items:")
    for i, order in enumerate(sales_orders[:5]):
        print(f"Item {i}:")
        print(order)
        print("-" * 40)
    
    # Map data with error handling
    print("\nMapping Zoho fields to database schema...")
    mapped_data = []
    for order in sales_orders:
        mapped_item = map_fields(order)
        if mapped_item is not None:
            mapped_data.append(mapped_item)
    
    print(f"✅ Successfully mapped {len(mapped_data)} records")
    
    # Display sample mapped data
    print("\n=== SAMPLE MAPPED DATA ===")
    for i, item in enumerate(mapped_data[:3]):
        print(f"Mapped Sample {i+1}:")
        print(f"  _id (SONumber): {item.get('_id', 'N/A')}")
        print(f"  SOId: {item.get('SOId', 'N/A')}")
        print(f"  clientName: {item.get('clientName', 'N/A')}")
        print("-" * 40)
    
    # Import/Update data
    update_count, insert_count = import_data_to_mongodb(mapped_data)
    
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    
    print("=" * 50)
    print(f"✅ IMPORT/UPDATE COMPLETE:")
    print(f"   - Total records processed: {update_count + insert_count}")
    print(f"   - Updated records: {update_count}")
    print(f"   - Inserted new records: {insert_count}")
    print(f"   - Time taken: {elapsed_time:.2f} seconds")
    print("=" * 50)


if __name__ == "__main__":
    main()