// scripts/startZohoSync.ts
import { syncData } from '../src/lib/server/zohoSync';

syncData(true).catch(console.error);
