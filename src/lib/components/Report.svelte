<script lang="ts">
  import * as XLSX from 'xlsx';
  import { db } from '$lib/database';
  import type { ExcelWorkbook } from '$lib/excel';
  import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  async function exportToExcel() {
    try {
      // Fetch all data from the database
      const users = await prisma.user.findMany();
      const roles = await prisma.roles.findMany();
      const stage0 = await prisma.stage0.findMany();
      const stage1 = await prisma.stage1.findMany();
      const dcDetails = await prisma.dcDetails.findMany();
      const lineItems = await prisma.lineItems.findMany();
      const installation = await prisma.installation.findMany();
      const service = await prisma.service.findMany();
      const stage4 = await prisma.stage4.findMany();
      const stage5 = await prisma.stage5.findMany();
      const activityLog = await prisma.activityLog.findMany();
      const stageHistory = await prisma.stageHistory.findMany();

      // Create a new workbook and worksheet
      const workbook: ExcelWorkbook = { Sheets: {}, SheetNames: [] };

      // Add each data type as a sheet in the workbook
      workbook.Sheets['Users'] = XLSX.utils.json_to_sheet(users);
      workbook.SheetNames.push('Users');

      workbook.Sheets['Roles'] = XLSX.utils.json_to_sheet(roles);
      workbook.SheetNames.push('Roles');

      workbook.Sheets['Stage 0'] = XLSX.utils.json_to_sheet(stage0);
      workbook.SheetNames.push('Stage 0');

      workbook.Sheets['Stage 1'] = XLSX.utils.json_to_sheet(stage1);
      workbook.SheetNames.push('Stage 1');

      workbook.Sheets['Stage 4'] = XLSX.utils.json_to_sheet(stage4);
      workbook.SheetNames.push('Stage 4');

      workbook.Sheets['Stage 5'] = XLSX.utils.json_to_sheet(stage5);
      workbook.SheetNames.push('Stage 5');

      workbook.Sheets['Dc Details'] = XLSX.utils.json_to_sheet(dcDetails);
      workbook.SheetNames.push('Dc Details');

      workbook.Sheets['Line Items'] = XLSX.utils.json_to_sheet(lineItems);
      workbook.SheetNames.push('Line Items');

      workbook.Sheets['Installation'] = XLSX.utils.json_to_sheet(installation);
      workbook.SheetNames.push('Installation');

      workbook.Sheets['Service'] = XLSX.utils.json_to_sheet(service);
      workbook.SheetNames.push('Service');

      workbook.Sheets['Activity Log'] = XLSX.utils.json_to_sheet(activityLog);
      workbook.SheetNames.push('Activity Log');

      workbook.Sheets['Stage History'] = XLSX.utils.json_to_sheet(stageHistory);
      workbook.SheetNames.push('Stage History');


      // Generate the Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Convert the buffer to a Blob and download the file
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  }
</script>

<button
  on:click={exportToExcel}
  class="flex items-center p-2 rounded-md hover:bg-sky-800 transition-colors duration-200"
>
  Export to Excel
</button>