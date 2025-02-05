import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { db } from '$lib/database';

const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  export async function POST({ request }) {
    const { stage, data } = await request.json();

    // console.log("Data inside push:", JSON.stringify(data, null, 2));
    try {
      let result;
      switch (stage) {
        case 0:
          await prisma.stage0.update({
            where: {
                SONumber: data.SONumber
            },
            data: {  clientExpectedDate: new Date(data.clientExpectedDate).toISOString() }
          });
          break;
        case 1:
          // console.log("Line Items:", JSON.stringify(data.lineItems, null, 2));
          // console.log("DC Boxesss:", JSON.stringify(data.dcBoxes, null, 2));
          // console.log("Partial Deliveryyyy:", JSON.stringify(data.partialDelivery, null, 2));

          const existingLineItems = await prisma.lineItems.findFirst({
            where: { SONumber: data.lineItems[0].SONumber }
          });
  
          if (!existingLineItems) {
            // Create lineItems only if they don't exist
            await prisma.lineItems.createMany({
              data: data.lineItems.map(item => ({ 
                Itemid: item.Itemid,
                SONumber: item.SONumber, 
                name: item.name, 
                quantity: item.quantity, 
                unit: item.unit, 
                rate: item.rate, 
                amount: item.amount, 
                status: item.status,
                isAvailabilityFrozen: item.isAvailabilityFrozen,
                needToPurchaseLocally: item.needToPurchaseLocally,
                isAvailable: item.isAvailable,
                serialNo: item.serialNo,
                invoiceNo: item.invoiceNo,
                invoiceattachment: item.invoiceattachment
              }))
            });
          }

          if (data.dcBoxes) {
          await prisma.stage1.create({
            data: {
              SONumber: data.dcBoxes.SONumber,
              DCNumber: data.dcBoxes.DCNumber,
              status: data.dcBoxes.status,
              partialDelivery: data.partialDelivery,
              PODNo: data.dcBoxes.PODNo,
              DispatchDate: new Date(data.dcBoxes.DispatchDate).toISOString(),
              EstdDeliveryDate: new Date(data.dcBoxes.EstdDeliveryDate).toISOString(),
              dcAmount: data.dcBoxes.dcAmount,
              attachment: data.dcBoxes.attachment,
              isSaved: data.dcBoxes.isSaved || false,
              fileName: data.dcBoxes.fileName || '',
              filePreviewUrl: data.dcBoxes.filePreviewUrl,
              billType: data.dcBoxes.billType || 'DC',
              isTypeSet: data.dcBoxes.isTypeSet || false,
              dcDetails: {
                create: {
                  dcNumber: data.dcBoxes.validatedData.deliverychallan_number,
                  customerName: data.dcBoxes.validatedData.customer_name,
                  dcDate: new Date(data.dcBoxes.validatedData.date).toISOString(),
                  total: data.dcBoxes.validatedData.total,
                  status: data.dcBoxes.validatedData.status,
                }
              }
            }
            })}
          break;
        case 2:
          for (const item of data.lineItems) {
            await prisma.lineItems.updateMany({
              where: {
                SONumber: item.SONumber,
                Itemid: item.Itemid,
                status: 'not_available', // Update only items with this specific status
              },
              data: {
                serialNo: item.serialNo,
                invoiceNo: item.invoiceNo,
                invoiceattachment: item.invoiceattachment, // Ensure this field is correctly named and exists in the schema
                status: item.status, // Update the status to 'available' or 'need to purchase locally'
              },
            });
          }
          break;
  
        case 3:
          console.log("Data received in case 3:");
          console.log(JSON.stringify(data, null, 2));

          const existingInstallation = await prisma.installation.findUnique({
            where: { SONumber: data.SONumber }
          });
      
          const existingService = await prisma.service.findUnique({
            where: { SONumber: data.SONumber }
          });

          if (data.Ticketid==''){
            if (existingInstallation) {
              result = await prisma.installation.update({
                where: { SONumber: data.SONumber },
                data: {
                  InstReport: data.Report,
                  InstReportName: data.ReportName,
                }
              });
            } else {
              result = await prisma.installation.create({
                data: {
                  SONumber: data.SONumber,
                  engName: data.engName,
                  ScheduleDate: new Date(data.ScheduleDate).toISOString(),
                  MobNo: data.MobNo,
                  VendorName: data.VendorName,
                  InstallationRem: data.Remark,
                  InstReport: data.Report,
                  activeTab: data.activeTab,
                  InstReportName: data.ReportName,
                  InstPreviewUrl: data.PreviewUrl
                }
              });
            }
          }else if(data.Ticketid){
            if (existingService) {
              result = await prisma.service.update({
                where: { SONumber: data.SONumber },
                data: {
                  ServiceReport: data.Report,
                  ServiceReportName: data.ReportName,
                }
              });
            } else {
              result = await prisma.service.create({
                data: {
                  SONumber: data.SONumber,
                  engName: data.engName,
                  ScheduleDate: new Date(data.ScheduleDate).toISOString(),
                  MobNo: data.MobNo,
                  VendorName: data.VendorName,
                  ServiceRem: data.Remark,
                  ServiceReport: data.Report,
                  Serticketid: data.Ticketid,
                  activeTab: data.activeTab,
                  ServiceReportName: data.ReportName,
                  ServicePreviewUrl: data.PreviewUrl
                }
              });
            }
          }
          if (data.ReturnPickupName){
            result = await prisma.stage4.create({
              data: { SONumber: data.SONumber,
                      returnPickupRequested:data.returnPickupRequested,
                      ReturnPickupName:data.ReturnPickupName,
                      ReturnPickupMobile:data.ReturnPickupMobile, ReturnPickupRemark:data.ReturnPickupRemark }
            });
          }
          break;
        case 4: 
          console.log("Data in stage4:", JSON.stringify(data, null, 2));
          const existingRecord = await prisma.stage4.findUnique({
            where: { SONumber: data.SONumber },
          });
          if (existingRecord) {
            await prisma.stage4.update({
                where: {
                    SONumber: data.SONumber,
                },
                data: { 
                  DCNumber: data.DCNumber,
                  CourierTrackNo: data.CourierTrackNo,
                  DCAmount: data.DCAmount,
                  DispatchDate: new Date(data.DispatchDate).toISOString(),
                  DeliveryDate: new Date(data.DeliveryDate).toISOString(),
                  Remark: data.Remark,
                  Attachment: data.Attachment,
                  fileName: data.fileName
                },
            });
            console.log(`Record with SONumber ${data.SONumber} updated successfully.`);
          } else {
            console.log(`No record found in stage4 with SONumber ${data.SONumber}. Update skipped.`);
          }
          break;

        case 5:
          console.log("Data in stage 5:", JSON.stringify(data, null, 2));
          await prisma.stage5.create({
            data: {
              SONumber: data.SONumber,
              accStatus: data.accStatus,
              rejected1: data.rejected1,
              accRemark: data.accRemark,
              retaccStatus: data.retaccStatus,
              rejected2: data.rejected2,
              retaccRemark: data.retaccRemark,
              isDataSaved1: data.isDataSaved1,
              isEditing1: data.isEditing1,
              isDataSaved2: data.isDataSaved2,
              isEditing2: data.isEditing2
            },
          });
          break;
        default:
          return json({ success: false, message: 'Invalid stage' }, { status: 400 });
      }
  
      return json({ success: true, data: result });
    } catch (error) {
      console.error('Error saving data:', error);
      return json({ success: false, message: 'Error saving data' }, { status: 500 });
    }
  }

function currentDate(): any {
  throw new Error('Function not implemented.');
}
