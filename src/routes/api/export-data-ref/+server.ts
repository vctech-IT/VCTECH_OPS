import { PrismaClient } from '@prisma/client';
import { json } from '@sveltejs/kit';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

const MAX_CELL_LENGTH = 32700; // Slightly less than the max to be safe

function truncateData(data: any[]): any[] {
  return data.map(item => {
    const truncatedItem: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string' && value.length > MAX_CELL_LENGTH) {
        truncatedItem[key] = value.substring(0, MAX_CELL_LENGTH) + '... (truncated)';
      } else {
        truncatedItem[key] = value;
      }
    }
    return truncatedItem;
  });
}

export async function GET({ url }) {
  try {
    const pmName = url.searchParams.get('pmName') || undefined;
    const orderStatus = url.searchParams.get('orderStatus') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const clientName = url.searchParams.get('clientName') || undefined;

    // Fetch data from all tables, applying filters where applicable
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        phoneNo: true,
        isApproved: true,
        userAuthToken: true,
        otp: true,
        otpExpires: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        roleId: true
      },
      where: pmName ? { username: pmName } : undefined
    });
    const roles = await prisma.roles.findMany();
    const stage0 = await prisma.stage0.findMany({
      where: {
        ...(clientName && { clientName }),
        ...(category && { category })
      }
    });
    const stage1 = await prisma.stage1.findMany({
      select: {
        DCid: true,
        SONumber: true,
        DCNumber: true,
        status: true,
        PODNo: true,
        DispatchDate: true,
        EstdDeliveryDate: true,
        dcAmount: true,
        isSaved: true,
        fileName: true,
        billType: true,
        isTypeSet: true,
        submittedOn: true,
      },
      where: orderStatus ? { status: orderStatus } : undefined
    });
    const lineItems = await prisma.lineItems.findMany({
      select: {
        Itemid: true,
        SONumber: true,
        name: true,
        quantity: true,
        unit: true,
        rate: true,
        amount: true,
        status: true,
        isAvailabilityFrozen: true,
        needToPurchaseLocally: true,
        isAvailable: true,
        serialNo: true,
        invoiceNo: true,
      },
      where: orderStatus ? { status: orderStatus } : undefined
    });
    const installation = await prisma.installation.findMany({
      select: {
        SONumber: true,
        engName: true,
        ScheduleDate: true,
        MobNo: true,
        VendorName: true,
        InstallationRem: true,
        activeTab: true,
        submittedOn: true,
        InstReportName: true,
      }
    });
    const service = await prisma.service.findMany({
      select: {
        SONumber: true,
        engName: true,
        ScheduleDate: true,
        MobNo: true,
        VendorName: true,
        ServiceRem: true,
        activeTab: true,
        Serticketid: true,
        submittedOn: true,
      }
    });
    const stage4 = await prisma.stage4.findMany({
      select: {
        SONumber: true,
        ReturnPickupName: true,
        ReturnPickupMobile: true,
        ReturnPickupRemark: true,
        DCNumber: true,
        CourierTrackNo: true,
        DCAmount: true,
        DispatchDate: true,
        DeliveryDate: true,
        Remark: true,
        fileName: true,
      }
    });
    const stage5 = await prisma.stage5.findMany();
    const activityLogs = await prisma.activityLog.findMany();
    const stageHistory = await prisma.stageHistory.findMany();

    // Truncate data for each table
    const truncatedData = {
      Users: truncateData(users),
      Roles: truncateData(roles),
      Stage0: truncateData(stage0),
      Stage1: truncateData(stage1),
      LineItems: truncateData(lineItems),
      Installation: truncateData(installation),
      Service: truncateData(service),
      Stage4: truncateData(stage4),
      Stage5: truncateData(stage5),
      ActivityLogs: truncateData(activityLogs),
      StageHistory: truncateData(stageHistory)
    };

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let maxRows = 0;
    let columnIndex = 0;

    for (const [tableName, data] of Object.entries(truncatedData)) {
      // Add table name
      XLSX.utils.sheet_add_aoa(ws, [[`Table: ${tableName}`]], { origin: { r: 0, c: columnIndex } });

      if (data.length > 0) {
        // Add headers
        const headers = Object.keys(data[0]);
        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: { r: 1, c: columnIndex } });

        // Add data
        XLSX.utils.sheet_add_json(ws, data, { origin: { r: 2, c: columnIndex }, skipHeader: true });

        // Update maxRows if this table has more rows
        maxRows = Math.max(maxRows, data.length + 2); // +2 for table name and header rows

        // Move to the next column, add 2 for spacing
        columnIndex += headers.length + 2;
      } else {
        // If no data, just move to the next column
        columnIndex += 2;
      }
    }

    // Set column widths
    const columnWidths = [];
    for (let i = 0; i < columnIndex; i++) {
      columnWidths.push({ wch: 15 }); // Set each column width to 15 characters
    }
    ws['!cols'] = columnWidths;

    // Set row height for the first row (table names)
    ws['!rows'] = [{ hpt: 25 }]; // Set height to 25 points

    XLSX.utils.book_append_sheet(wb, ws, 'Database Export');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="database_export.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return json({ error: 'Failed to export data' }, { status: 500 });
  }
}