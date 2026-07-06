import type { Device, DeviceStatus } from '@/types';
import { JIZZAX_DISTRICTS } from '@/features/map/jizzaxDistricts';

// ============================================================
//  DEMO MA'LUMOTLAR (test). Haqiqiy loyihada bu fayl o'rniga
//  haqiqiy manba (services/index.ts orqali) ulanadi.
//  Jizzax viloyati tumanlari bo'yicha taqsimlangan ~30 qurilma.
// ============================================================

type RawDevice = Omit<Device, 'faultSince' | 'lastUpdate'>;

const baseRaw: RawDevice[] = [
  // ---- Jizzax shahri ----
  { id: 'TP-101', name: 'Sharq MFY', type: 'concentrator', district: 'Jizzax shahri', lat: 40.1182, lng: 67.8451, status: 'online', metersTotal: 312, metersOnline: 310, responsibleName: 'Akmal Karimov', responsiblePhone: '+998 90 123 45 67', voltage: '231 V' },
  { id: 'TP-102', name: 'Navbahor MFY', type: 'concentrator', district: 'Jizzax shahri', lat: 40.1121, lng: 67.8382, status: 'online', metersTotal: 268, metersOnline: 266, responsibleName: 'Dilshod Rahimov', responsiblePhone: '+998 91 234 56 78', voltage: '229 V' },
  { id: 'TP-103', name: 'Bunyodkor MFY', type: 'concentrator', district: 'Jizzax shahri', lat: 40.1214, lng: 67.8523, status: 'online', metersTotal: 401, metersOnline: 399, responsibleName: 'Sherzod Toxtayev', responsiblePhone: '+998 93 345 67 89', voltage: '233 V' },
  { id: 'TP-104', name: 'Mustaqillik MFY', type: 'concentrator', district: 'Jizzax shahri', lat: 40.1083, lng: 67.8492, status: 'online', metersTotal: 355, metersOnline: 353, responsibleName: 'Bekzod Ergashev', responsiblePhone: '+998 94 456 78 90', voltage: '230 V' },
  { id: 'TP-105', name: 'Guliston MFY', type: 'concentrator', district: 'Jizzax shahri', lat: 40.1251, lng: 67.8354, status: 'offline', metersTotal: 176, metersOnline: 0, responsibleName: 'Oybek Sodiqov', responsiblePhone: '+998 90 567 89 01', voltage: '—' },
  { id: 'TP-106', name: "Do'stlik MFY", type: 'concentrator', district: 'Jizzax shahri', lat: 40.1044, lng: 67.8571, status: 'online', metersTotal: 289, metersOnline: 287, responsibleName: 'Jasur Aliyev', responsiblePhone: '+998 99 678 90 12', voltage: '228 V' },

  // ---- Sh. Rashidov tumani ----
  { id: 'TP-201', name: 'Yangihayot MFY', type: 'concentrator', district: 'Sh. Rashidov tumani', lat: 40.0852, lng: 67.7901, status: 'online', metersTotal: 234, metersOnline: 232, responsibleName: 'Sanjar Qodirov', responsiblePhone: '+998 91 789 01 23', voltage: '232 V' },
  { id: 'TP-202', name: 'Obod MFY', type: 'concentrator', district: 'Sh. Rashidov tumani', lat: 40.0703, lng: 67.8104, status: 'online', metersTotal: 198, metersOnline: 196, responsibleName: "Rustam Yo'ldoshev", responsiblePhone: '+998 93 890 12 34', voltage: '227 V' },
  { id: 'TP-203', name: 'Sohibkor MFY', type: 'concentrator', district: 'Sh. Rashidov tumani', lat: 40.0601, lng: 67.7702, status: 'fault', metersTotal: 245, metersOnline: 238, responsibleName: 'Farrux Nazarov', responsiblePhone: '+998 94 901 23 45', voltage: '246 V' },
  { id: 'TP-204', name: 'Mehnat MFY', type: 'concentrator', district: 'Sh. Rashidov tumani', lat: 40.0951, lng: 67.8002, status: 'online', metersTotal: 211, metersOnline: 209, responsibleName: 'Ulugbek Hamroyev', responsiblePhone: '+998 90 012 34 56', voltage: '230 V' },

  // ---- Gallaorol tumani ----
  { id: 'TP-301', name: 'Gallaorol markaz', type: 'concentrator', district: 'Gallaorol tumani', lat: 40.0201, lng: 67.5901, status: 'online', metersTotal: 276, metersOnline: 274, responsibleName: 'Aziz Mahmudov', responsiblePhone: '+998 91 111 22 33', voltage: '231 V' },
  { id: 'TP-302', name: "Bog'bon MFY", type: 'concentrator', district: 'Gallaorol tumani', lat: 40.0402, lng: 67.6103, status: 'online', metersTotal: 188, metersOnline: 186, responsibleName: 'Doniyor Saidov', responsiblePhone: '+998 93 222 33 44', voltage: '229 V' },
  { id: 'TP-303', name: 'Tinchlik MFY', type: 'concentrator', district: 'Gallaorol tumani', lat: 40.0003, lng: 67.5702, status: 'online', metersTotal: 203, metersOnline: 201, responsibleName: 'Kamol Usmonov', responsiblePhone: '+998 94 333 44 55', voltage: '233 V' },

  // ---- Zomin tumani ----
  { id: 'TP-401', name: 'Zomin markaz', type: 'concentrator', district: 'Zomin tumani', lat: 39.9601, lng: 68.4002, status: 'online', metersTotal: 254, metersOnline: 252, responsibleName: 'Shavkat Berdiyev', responsiblePhone: '+998 90 444 55 66', voltage: '230 V' },
  { id: 'TP-402', name: "Tog'li MFY", type: 'concentrator', district: 'Zomin tumani', lat: 39.9402, lng: 68.4203, status: 'warning', metersTotal: 167, metersOnline: 161, responsibleName: 'Islom Qosimov', responsiblePhone: '+998 91 555 66 77', voltage: '214 V' },
  { id: 'TP-403', name: 'Buloqboshi MFY', type: 'concentrator', district: 'Zomin tumani', lat: 39.9803, lng: 68.3801, status: 'online', metersTotal: 142, metersOnline: 140, responsibleName: 'Otabek Tursunov', responsiblePhone: '+998 93 666 77 88', voltage: '228 V' },

  // ---- Do'stlik tumani ----
  { id: 'TP-501', name: "Do'stlik markaz", type: 'concentrator', district: "Do'stlik tumani", lat: 40.5201, lng: 68.0202, status: 'online', metersTotal: 298, metersOnline: 296, responsibleName: 'Nodir Egamberdiyev', responsiblePhone: '+998 94 777 88 99', voltage: '232 V' },
  { id: 'TP-502', name: 'Paxtazor MFY', type: 'concentrator', district: "Do'stlik tumani", lat: 40.5003, lng: 68.0501, status: 'online', metersTotal: 221, metersOnline: 219, responsibleName: 'Sardor Mirzayev', responsiblePhone: '+998 90 888 99 00', voltage: '231 V' },

  // ---- Paxtakor tumani ----
  { id: 'TP-601', name: 'Paxtakor markaz', type: 'concentrator', district: 'Paxtakor tumani', lat: 40.3101, lng: 67.9502, status: 'online', metersTotal: 263, metersOnline: 261, responsibleName: 'Jahongir Rajabov', responsiblePhone: '+998 91 999 00 11', voltage: '230 V' },
  { id: 'TP-602', name: 'Yangi turmush MFY', type: 'concentrator', district: 'Paxtakor tumani', lat: 40.3303, lng: 67.9301, status: 'online', metersTotal: 184, metersOnline: 182, responsibleName: 'Bahodir Sultonov', responsiblePhone: '+998 93 100 11 22', voltage: '229 V' },

  // ---- Mirzacho'l tumani ----
  { id: 'TP-701', name: "Mirzacho'l markaz", type: 'concentrator', district: "Mirzacho'l tumani", lat: 40.4901, lng: 68.2002, status: 'online', metersTotal: 245, metersOnline: 243, responsibleName: 'Anvar Xolmatov', responsiblePhone: '+998 94 211 22 33', voltage: '233 V' },
  { id: 'TP-702', name: 'Marjonbuloq MFY', type: 'concentrator', district: "Mirzacho'l tumani", lat: 40.4703, lng: 68.2301, status: 'online', metersTotal: 176, metersOnline: 174, responsibleName: 'Ilhom Davronov', responsiblePhone: '+998 90 322 33 44', voltage: '228 V' },

  // ---- Zafarobod tumani ----
  { id: 'TP-801', name: 'Zafarobod markaz', type: 'concentrator', district: 'Zafarobod tumani', lat: 40.2701, lng: 67.7402, status: 'online', metersTotal: 232, metersOnline: 230, responsibleName: 'Murod Yusupov', responsiblePhone: '+998 91 433 44 55', voltage: '231 V' },

  // ---- Forish tumani ----
  { id: 'TP-901', name: 'Forish markaz', type: 'concentrator', district: 'Forish tumani', lat: 40.5201, lng: 67.1002, status: 'online', metersTotal: 198, metersOnline: 196, responsibleName: 'Qahramon Eshonov', responsiblePhone: '+998 93 544 55 66', voltage: '230 V' },
  { id: 'TP-902', name: "Qo'ytosh MFY", type: 'concentrator', district: 'Forish tumani', lat: 40.4503, lng: 67.3001, status: 'online', metersTotal: 134, metersOnline: 132, responsibleName: 'Behruz Ochilov', responsiblePhone: '+998 94 655 66 77', voltage: '227 V' },

  // ---- Boshqa tumanlar ----
  { id: 'TP-A01', name: 'Arnasoy markaz', type: 'concentrator', district: 'Arnasoy tumani', lat: 40.6201, lng: 67.9002, status: 'online', metersTotal: 156, metersOnline: 154, responsibleName: 'Shoxrux Bozorov', responsiblePhone: '+998 90 766 77 88', voltage: '232 V' },
  { id: 'TP-B01', name: 'Baxmal markaz', type: 'concentrator', district: 'Baxmal tumani', lat: 39.8501, lng: 67.0002, status: 'online', metersTotal: 167, metersOnline: 165, responsibleName: 'Sarvar Torayev', responsiblePhone: '+998 91 877 88 99', voltage: '229 V' },
  { id: 'TP-Z01', name: 'Zarbdor markaz', type: 'concentrator', district: 'Zarbdor tumani', lat: 40.1001, lng: 68.2002, status: 'online', metersTotal: 212, metersOnline: 210, responsibleName: 'Asror Komilov', responsiblePhone: '+998 93 988 99 00', voltage: '231 V' },

  // ---- Yangiobod tumani (08237-Yangiobod TETK) ----
  { id: 'TP-N01', name: 'Yangiobod markaz', type: 'concentrator', district: 'Yangiobod tumani', lat: 39.9790, lng: 68.8169, status: 'online', metersTotal: 248, metersOnline: 246, responsibleName: 'Javlon Mirzaev', responsiblePhone: '+998 90 112 23 34', voltage: '231 V' },
  { id: 'TP-N02', name: "Uchqo'rg'on MFY", type: 'concentrator', district: 'Yangiobod tumani', lat: 40.0512, lng: 68.7543, status: 'online', metersTotal: 184, metersOnline: 183, responsibleName: 'Nozim Xoliqov', responsiblePhone: '+998 91 223 34 45', voltage: '229 V' },
  { id: 'TP-N03', name: "Oqtosh MFY", type: 'concentrator', district: 'Yangiobod tumani', lat: 39.9102, lng: 68.8632, status: 'online', metersTotal: 156, metersOnline: 154, responsibleName: 'Baxt Toshmatov', responsiblePhone: '+998 93 334 45 56', voltage: '233 V' },
  { id: 'TP-N04', name: "Yangiyer MFY", type: 'concentrator', district: 'Yangiobod tumani', lat: 40.1021, lng: 68.8901, status: 'online', metersTotal: 172, metersOnline: 171, responsibleName: 'Sanjar Normatov', responsiblePhone: '+998 94 445 56 67', voltage: '230 V' },
  { id: 'TP-N05', name: "Gulbahor MFY", type: 'concentrator', district: 'Yangiobod tumani', lat: 39.8612, lng: 68.7102, status: 'online', metersTotal: 134, metersOnline: 133, responsibleName: 'Timur Qoraboyev', responsiblePhone: '+998 90 556 67 78', voltage: '228 V' },
  { id: 'TP-N06', name: "Istiqbol MFY", type: 'concentrator', district: 'Yangiobod tumani', lat: 39.9341, lng: 68.9215, status: 'online', metersTotal: 143, metersOnline: 142, responsibleName: 'Mansur Abdullayev', responsiblePhone: '+998 91 667 78 89', voltage: '232 V' },

  // ---- Yangiobod TETK (08237) — CAS.NET da bor edi, qo'shildi ----
  { id: 'TP-Y01', name: 'Yangiobod markaz', type: 'concentrator', district: 'Yangiobod tumani', lat: 40.2701, lng: 68.8002, status: 'online', metersTotal: 198, metersOnline: 196, responsibleName: 'Nodir Xasanov', responsiblePhone: '+998 90 112 34 56', voltage: '230 V' },
  { id: 'TP-Y02', name: 'Yangiqishloq MFY', type: 'concentrator', district: 'Yangiobod tumani', lat: 40.2501, lng: 68.8201, status: 'online', metersTotal: 145, metersOnline: 143, responsibleName: 'Jasur Toshmatov', responsiblePhone: '+998 91 223 45 67', voltage: '228 V' },
  { id: 'TP-Y03', name: "Bogishamol MFY", type: 'concentrator', district: 'Yangiobod tumani', lat: 40.2901, lng: 68.7801, status: 'online', metersTotal: 167, metersOnline: 165, responsibleName: 'Muzaffar Holiqov', responsiblePhone: '+998 93 334 56 78', voltage: '231 V' },

    // ---- Tadbirkorlik obyektlari ----
  { id: 'BZ-01', name: 'Jizzax Plaza savdo markazi', type: 'business', district: 'Jizzax shahri', lat: 40.1161, lng: 67.8443, status: 'online', metersTotal: 1, metersOnline: 1, responsibleName: 'Eldor Mamatov (texnik)', responsiblePhone: '+998 90 100 20 30', voltage: '384 V' },
  { id: 'BZ-02', name: 'Zomin sanatoriysi', type: 'business', district: 'Zomin tumani', lat: 39.9502, lng: 68.4102, status: 'online', metersTotal: 1, metersOnline: 1, responsibleName: 'Hasan Abdullayev', responsiblePhone: '+998 91 200 30 40', voltage: '386 V' },
  { id: 'BZ-03', name: 'Gallaorol non zavodi', type: 'business', district: 'Gallaorol tumani', lat: 40.0302, lng: 67.6002, status: 'online', metersTotal: 1, metersOnline: 1, responsibleName: 'Tohir Yodgorov', responsiblePhone: '+998 93 300 40 50', voltage: '382 V' },
];



// ============================================================
//  GEOMETRIK KAFOLAT: har bir nuqta o'z tumanining HAQIQIY
//  poligoni ICHIDA joylashadi (point-in-polygon tekshiruvi).
// ============================================================

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number]; // [lng, lat]
type Ring = Pt[];

interface DistrictGeo {
  polys: Ring[][];          // MultiPolygon: poligonlar -> halqalar
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
  anchor: Pt;               // poligon ichidagi ishonchli nuqta
}

function evenOdd(lng: number, lat: number, rings: Ring[]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function pip(lng: number, lat: number, polys: Ring[][]): boolean {
  for (const rings of polys) if (evenOdd(lng, lat, rings)) return true;
  return false;
}

const districtGeoCache = new Map<string, DistrictGeo | null>();

function districtGeo(appName: string): DistrictGeo | null {
  if (districtGeoCache.has(appName)) return districtGeoCache.get(appName)!;
  const f = JIZZAX_DISTRICTS.features.find((x) => x.properties.app === appName);
  if (!f) {
    districtGeoCache.set(appName, null);
    return null;
  }
  const coords = f.geometry.coordinates as unknown;
  const polys: Ring[][] = f.geometry.type === 'Polygon' ? [coords as Ring[]] : (coords as Ring[][]);
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
  for (const rings of polys) {
    for (const [x, y] of rings[0]) {
      if (x < minLng) minLng = x;
      if (x > maxLng) maxLng = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
  }
  // ichki "anchor" nuqta: bbox markazi, bo'lmasa deterministik qidiruv
  let anchor: Pt = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  if (!pip(anchor[0], anchor[1], polys)) {
    const rng = mulberry32(hashStr(appName));
    for (let k = 0; k < 800; k++) {
      const cl = minLng + rng() * (maxLng - minLng);
      const ct = minLat + rng() * (maxLat - minLat);
      if (pip(cl, ct, polys)) {
        anchor = [cl, ct];
        break;
      }
    }
  }
  const geo: DistrictGeo = { polys, bbox: [minLng, minLat, maxLng, maxLat], anchor };
  districtGeoCache.set(appName, geo);
  return geo;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * Har bir TP/biznes nuqtasini o'z tumani poligoniga kafolatli joylashtiradi:
 * asl koordinata poligon ichida bo'lsa — saqlanadi; tashqarida bo'lsa —
 * tuman ichida tabiiy taqsimot bo'yicha (oltin burchak halqasi) qayta joylanadi.
 */
function repositionWithinDistricts(list: RawDevice[]): RawDevice[] {
  const byDistrict = new Map<string, RawDevice[]>();
  for (const d of list) {
    const arr = byDistrict.get(d.district);
    if (arr) arr.push(d);
    else byDistrict.set(d.district, [d]);
  }
  const out: RawDevice[] = [];
  byDistrict.forEach((group, district) => {
    const geo = districtGeo(district);
    if (!geo) {
      out.push(...group);
      return;
    }
    const bw = geo.bbox[2] - geo.bbox[0];
    const bh = geo.bbox[3] - geo.bbox[1];
    const spread = Math.min(0.22, 0.24 * Math.min(bw, bh));
    const rng = mulberry32(hashStr(district) ^ 0x9e3779b9);
    group.forEach((d, i) => {
      if (pip(d.lng, d.lat, geo.polys)) {
        out.push(d); // asl nuqta to'g'ri — tegmaymiz
        return;
      }
      if (i === 0) {
        out.push({ ...d, lng: r6(geo.anchor[0]), lat: r6(geo.anchor[1]) });
        return;
      }
      let placed: Pt | null = null;
      for (let t = 0; t < 50 && !placed; t++) {
        const ang = i * 2.399963 + (t > 0 ? rng() * Math.PI * 2 : 0);
        const rr =
          spread *
          (0.3 + 0.65 * Math.sqrt(i / Math.max(1, group.length - 1))) *
          Math.pow(0.92, t);
        const cl = geo.anchor[0] + Math.cos(ang) * rr * 1.25;
        const ct = geo.anchor[1] + Math.sin(ang) * rr;
        if (pip(cl, ct, geo.polys)) placed = [cl, ct];
      }
      if (!placed) placed = [geo.anchor[0] + (rng() - 0.5) * 0.01, geo.anchor[1] + (rng() - 0.5) * 0.01];
      out.push({ ...d, lng: r6(placed[0]), lat: r6(placed[1]) });
    });
  });
  return out;
}

// ---- Maishiy (fuqaro) hisoblagichlari: TP atrofida, poligon ichida ----
const SURNAMES = ['Karimov', 'Rahimov', 'Ergashev', 'Sodiqov', 'Aliyev', 'Qodirov', 'Yusupov', 'Mahmudov', 'Saidov', 'Usmonov', 'Berdiyev', 'Qosimov', 'Tursunov', 'Mirzayev', 'Rajabov', 'Sultonov', 'Xolmatov', 'Davronov', 'Eshonov', 'Komilov', 'Abdullayev', 'Nazarov', 'Hamroyev', 'Bozorov', "To'laganov"];
const NAMES = ['Akmal', 'Dilshod', 'Sherzod', 'Bekzod', 'Oybek', 'Jasur', 'Sanjar', 'Rustam', 'Farrux', 'Ulugbek', 'Aziz', 'Doniyor', 'Kamol', 'Shavkat', 'Islom', 'Otabek', 'Nodir', 'Sardor', 'Anvar', 'Ilhom', 'Murod', 'Qahramon', 'Behruz', 'Asror', 'Sarvar'];

/** Maishiy abonentlar bog'lanadigan TPlar va sonlari. */
const HOUSEHOLD_ANCHORS: { tpId: string; n: number }[] = [
  { tpId: 'TP-101', n: 9 },
  { tpId: 'TP-102', n: 8 },
  { tpId: 'TP-103', n: 8 },
  { tpId: 'TP-104', n: 7 },
  { tpId: 'TP-105', n: 7 },
  { tpId: 'TP-106', n: 6 },
  { tpId: 'TP-201', n: 6 },
  { tpId: 'TP-301', n: 5 },
  { tpId: 'TP-401', n: 5 },
  { tpId: 'TP-501', n: 4 },
  { tpId: 'TP-601', n: 4 },
  { tpId: 'TP-701', n: 4 },
  { tpId: 'TP-Y01', n: 4 },
  { tpId: 'TP-N01', n: 5 },
  { tpId: 'TP-N02', n: 4 },
  { tpId: 'TP-N03', n: 3 },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const pad3 = (n: number) => String(n).padStart(3, '0');

function buildHouseholds(base: RawDevice[]): RawDevice[] {
  const byId = new Map(base.map((d) => [d.id, d]));
  const rng = mulberry32(20260528);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const list: RawDevice[] = [];
  let idx = 1;
  for (const a of HOUSEHOLD_ANCHORS) {
    const tp = byId.get(a.tpId);
    if (!tp) continue;
    const geo = districtGeo(tp.district);
    for (let i = 0; i < a.n; i++) {
      const r = rng();
      let status: DeviceStatus = 'online';
      if (r < 0.025) status = 'offline';
      else if (r < 0.06) status = 'fault';
      else if (r < 0.11) status = 'warning';

      let lng = tp.lng, lat = tp.lat;
      for (let t = 0; t < 30; t++) {
        const angle = rng() * Math.PI * 2;
        const dist = (0.004 + rng() * 0.013) * Math.pow(0.85, t);
        const cl = tp.lng + Math.sin(angle) * dist * 1.3;
        const ct = tp.lat + Math.cos(angle) * dist;
        if (!geo || pip(cl, ct, geo.polys)) {
          lng = cl;
          lat = ct;
          break;
        }
      }

      const house = Math.floor(rng() * 140) + 1;
      const phone = `+998 9${Math.floor(rng() * 9)} ${pad3(Math.floor(rng() * 900) + 100)} ${pad2(Math.floor(rng() * 100))} ${pad2(Math.floor(rng() * 100))}`;
      let voltage = '—';
      if (status === 'online') voltage = `${226 + Math.floor(rng() * 7)} V`;
      else if (status === 'warning') voltage = `${205 + Math.floor(rng() * 9)} V`;
      else if (status === 'fault') voltage = `${241 + Math.floor(rng() * 9)} V`;

      list.push({
        id: `M-${String(idx).padStart(4, '0')}`,
        name: `${tp.name}, ${house}-uy`,
        type: 'household',
        district: tp.district,
        lat: r6(lat),
        lng: r6(lng),
        status,
        metersTotal: 1,
        metersOnline: status === 'offline' ? 0 : 1,
        responsibleName: `${pick(NAMES)} ${pick(SURNAMES)}`,
        responsiblePhone: phone,
        voltage,
      });
      idx++;
    }
  }
  return list;
}

const positionedBase = repositionWithinDistricts(baseRaw);
const raw: RawDevice[] = [...positionedBase, ...buildHouseholds(positionedBase)];

// Situatsion markaz uchun boshlang'ich belgilar (demo)
const BATTERY_TPS = new Set(['TP-302', 'TP-601']);          // batareya quvvatida
const THEFT_TPS = new Set(['TP-104', 'TP-702', 'TP-B01']);  // o'g'irlik aniqlangan
const OVERLOAD_SEED: Record<string, number> = { 'TP-103': 94, 'TP-501': 91, 'TP-402': 88 };

/** Boshlang'ich qurilmalar ro'yxati (faultSince, lastUpdate va sit-markaz maydonlari bilan). */

/** Mock energiya yo'qotish % — seed asosida deterministik */
function mockLoss(id: string): number {
  const s = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const v = ((s * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;
  if (v < 0.08) return +(20 + v * 18).toFixed(1);   // o'g'irlik
  if (v < 0.17) return +(12 + v * 8).toFixed(1);    // shubhali
  if (v < 0.30) return +(7  + v * 5).toFixed(1);    // ko'tarilgan
  return +(1 + v * 5).toFixed(1);                   // normal
}

export function createInitialDevices(): Device[] {
  const now = Date.now();
  const rng = mulberry32(20260611);
  return raw.map((d) => {
    const base: Device = {
      ...d,
      faultSince: d.status === 'online' ? null : now - (Math.floor(Math.random() * 5400) + 300) * 1000,
      lastUpdate: now,
    };
    if (d.type !== 'household') {
      base.loadPercent =
        d.status === 'offline' ? 0 : OVERLOAD_SEED[d.id] ?? Math.round(35 + rng() * 45);
      if (d.type === 'concentrator') {
        base.onBattery = BATTERY_TPS.has(d.id) && d.status !== 'offline';
        base.theft        = THEFT_TPS.has(d.id);
        base.lossPercent  = mockLoss(d.id);
        base.lossElevated = !base.theft && (base.lossPercent ?? 0) > 8;
      }
    }
    return base;
  });
}
