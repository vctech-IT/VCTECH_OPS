// src/routes/api/zoho-sync/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// API credentials
const REFRESH_TOKEN = '1000.b94e5345a93e9e0f672a31a27a2fd390.0ba27ca3d43ba0863e11c303b6a8c16f';
const CLIENT_ID = '1000.KXTGP1GAGIDX12Q294C6OIMVR60VMX';
const CLIENT_SECRET = 'bb44b083c2b29eb4eefd1a605266a866fcd5f491fb';
const REDIRECT_URI = 'https://www.google.com/';

// Authentication state (note: this will reset between invocations)
let authToken: string | null = null;

async function refreshToken(): Promise<string> {
  try {
    const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
      params: {
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'refresh_token'
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
}

async function fetchAllZohoSalesOrders(token: string): Promise<any[]> {
  const baseUrl = 'https://www.zohoapis.in/books/v3/salesorders';
  const params = {
    organization_id: '60005679410',
    page: 1,
    per_page: 200
  };
  
  let allSalesOrders: any[] = [];
  
  try {
    while (true) {
      const headers = {
        Authorization: `Zoho-oauthtoken ${token}`
      };
      
      const response = await axios.get(baseUrl, { params, headers });
      const pageSalesOrders = response.data.salesorders || [];
      allSalesOrders = [...allSalesOrders, ...pageSalesOrders];
      
      if (response.data.page_context?.has_more_page) {
        params.page += 1;
      } else {
        break;
      }
    }
    
    return allSalesOrders;
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return [];
  }
}

function mapFields(salesOrder: any): any {
  return {
    SONumber: salesOrder.salesorder_number,
    SOId: salesOrder.salesorder_id || '',
    clientName: salesOrder.customer_name || '',
    SubTotal: parseFloat(salesOrder.sub_total) || 0.0,
    Total: parseFloat(salesOrder.total) || 0.0,
    SOCategory: salesOrder.cf_so_cat || '',
    PMName: salesOrder.cf_project_manager_name || '',
    isDropped: false,
    currentStage: 0,
    orderStatus: salesOrder.order_status || '',
    referenceNumber: salesOrder.reference_number || '',
    invoiceStatus: salesOrder.invoice_status || '',
    createdAt: salesOrder.created_time ? new Date(salesOrder.created_time) : new Date(),
    updatedAt: salesOrder.last_modified_time ? new Date(salesOrder.last_modified_time) : new Date(),
  };
}

async function upsertDataToDatabase(data: any[]): Promise<void> {
  try {
    for (const item of data) {
      // Skip if no SONumber (primary key)
      if (!item.SONumber) continue;
      
      // Get existing record to preserve currentStage
      const existing = await prisma.stage0.findUnique({
        where: { SONumber: item.SONumber }
      });
      
      if (existing?.currentStage !== undefined) {
        item.currentStage = existing.currentStage;
      }
      
      // Upsert the document
      await prisma.stage0.upsert({
        where: { SONumber: item.SONumber },
        update: item,
        create: item
      });
    }
    
    console.log(`Upserted ${data.length} documents`);
  } catch (error) {
    console.error('Error upserting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export const GET: RequestHandler = async () => {
  try {
    // In serverless functions, we need to refresh the token every time
    const token = await refreshToken();
    
    // Get sales orders from Zoho
    const salesOrders = await fetchAllZohoSalesOrders(token);
    console.log(`Total records fetched: ${salesOrders.length}`);
    
    // Map and upsert data
    if (salesOrders.length > 0) {
      const mappedData = salesOrders.map(order => mapFields(order));
      await upsertDataToDatabase(mappedData);
      return json({ success: true, count: salesOrders.length });
    } else {
      return json({ success: true, count: 0, message: "No sales orders to process" });
    }
  } catch (error) {
    console.error('Error in zoho-sync endpoint:', error);
    return json({ success: false, error: 'Failed to sync data' }, { status: 500 });
  }
};
