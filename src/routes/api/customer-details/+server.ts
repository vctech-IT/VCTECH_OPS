// /api/customer-details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { customerName, start, end } = await request.json();

    if (!customerName) {
      return json({ error: 'Customer name is required' }, { status: 400 });
    }

    type DateFilter = {
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    };

    const dateFilter: DateFilter = {};
    if (start && end) {
      dateFilter.createdAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    const customerOrders = await db.stage0.findMany({
      where: {
        clientName: customerName,
        ...dateFilter
      },
      select: {
        SONumber: true,
        clientName: true,
        Total: true,
        SOCategory: true,
        PMName: true,
        clientExpectedDate: true,
        currentStage: true,
        createdAt: true,
        LineItems: {
          select: {
            ItemName: true,
            Quantity: true,
            Unit: true,
            Rate: true,
            Amount: true,
            Status: true
          }
        },
        Installation: {
          select: {
            engName: true,
            ScheduleDate: true,
            MobNo: true,
            VendorName: true,
            InstallationRem: true,
            InstReport: true,
            submittedOn: true
          }
        },
        Service: {
          select: {
            engName: true,
            ScheduleDate: true,
            MobNo: true,
            VendorName: true,
            ServiceRem: true,
            ServiceReport: true,
            Serticketid: true,
            submittedOn: true
          }
        },
        Stage4: {
          select: {
            Name: true,
            MobNo: true,
            ProjMngRemark: true,
            DCNumber: true,
            CourierTrackNo: true,
            DCAmount: true,
            DispatchDate: true,
            DeliveryDate: true,
            Remark: true,
            Attachment: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalOrders = customerOrders.length;
    const totalRevenue = customerOrders.reduce((sum, order) => sum + order.Total, 0);

    return json({
      customerName,
      totalOrders,
      totalRevenue,
      orders: customerOrders
    });

  } catch (error) {
    console.error('Error fetching customer details:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};