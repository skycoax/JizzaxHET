import type { DataService } from './types';
import { mockDataService } from './mockDataService';

// ============================================================
//  ALMASHTIRISH NUQTASI  (demo  ->  haqiqiy)
//
//  Haqiqiy backendga o'tish uchun: DataService interfeysini amalga
//  oshiruvchi yangi sinf yozing (masalan, RealtimeDataService —
//  WebSocket yoki REST bilan) va quyidagi qatorda uni tayinlang.
//  Boshqa hech qaysi joyni o'zgartirish shart emas — UI bir xil qoladi.
//
//  Misol:
//    import { RealtimeDataService } from './realtimeDataService';
//    export const dataService: DataService = new RealtimeDataService(API_URL);
// ============================================================
export const dataService: DataService = mockDataService;

export type { DataService } from './types';
