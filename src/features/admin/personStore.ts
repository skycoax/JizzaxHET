import type { BotConfig, NotifyType, ResponsiblePerson } from '@/types';
import { TETK_MAP } from '@/lib/utils';

const PERSONS_KEY = 'jhet_persons';
const BOT_KEY     = 'jhet_bot_config';

// Mavjud qurilma mas'ullari asosida boshlang'ich ro'yxat
const DEFAULT_PERSONS: ResponsiblePerson[] = [
  { id:'p001', name:'Akmal Karimov',   phone:'+998 90 123 45 67', telegramId:null, telegramUsername:'@akmal_karimov',   assignedTetk:['Jizzax shahri'],       notifyTypes:['offline','fault','theft','overload'], active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p002', name:'Dilshod Rahimov', phone:'+998 91 234 56 78', telegramId:null, telegramUsername:'@dilshod_r',       assignedTetk:['Jizzax shahri'],       notifyTypes:['offline','fault','theft'],            active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p003', name:'Sanjar Qodirov',  phone:'+998 91 789 01 23', telegramId:null, telegramUsername:null,               assignedTetk:['Sh. Rashidov tumani'], notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p004', name:'Aziz Mahmudov',   phone:'+998 91 111 22 33', telegramId:null, telegramUsername:null,               assignedTetk:['Gallaorol tumani'],    notifyTypes:['offline','fault','overload'],         active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p005', name:'Shavkat Berdiyev',phone:'+998 90 444 55 66', telegramId:null, telegramUsername:null,               assignedTetk:['Zomin tumani'],        notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p006', name:'Nodir Egamberdiyev',phone:'+998 94 777 88 99',telegramId:null, telegramUsername:null,             assignedTetk:["Do'stlik tumani"],     notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p007', name:'Anvar Xolmatov',  phone:'+998 94 211 22 33', telegramId:null, telegramUsername:null,               assignedTetk:["Mirzacho'l tumani"],   notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p008', name:'Murod Yusupov',   phone:'+998 91 433 44 55', telegramId:null, telegramUsername:null,               assignedTetk:['Zafarobod tumani'],    notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p009', name:'Jahongir Rajabov', phone:'+998 91 999 00 11',telegramId:null, telegramUsername:null,               assignedTetk:['Paxtakor tumani'],     notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p010', name:'Qahramon Eshonov', phone:'+998 93 544 55 66',telegramId:null, telegramUsername:null,               assignedTetk:['Forish tumani'],       notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p011', name:'Shoxrux Bozorov', phone:'+998 90 766 77 88', telegramId:null, telegramUsername:null,               assignedTetk:['Arnasoy tumani'],      notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p012', name:'Sarvar Torayev',  phone:'+998 91 877 88 99', telegramId:null, telegramUsername:null,               assignedTetk:['Baxmal tumani'],       notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p013', name:'Asror Komilov',   phone:'+998 93 988 99 00', telegramId:null, telegramUsername:null,               assignedTetk:['Zarbdor tumani'],      notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
  { id:'p014', name:'Nodir Xasanov',   phone:'+998 90 112 34 56', telegramId:null, telegramUsername:null,               assignedTetk:['Yangiobod tumani'],    notifyTypes:['offline','fault'],                    active:true, createdAt:Date.now(), lastNotified:null },
];

export const DEFAULT_BOT_CONFIG: BotConfig = {
  token: '',
  serverUrl: 'http://localhost:8080',
  enabled: false,
};

export function loadPersons(): ResponsiblePerson[] {
  try {
    const raw = localStorage.getItem(PERSONS_KEY);
    if (raw) return JSON.parse(raw) as ResponsiblePerson[];
  } catch {}
  return DEFAULT_PERSONS;
}

export function savePersons(persons: ResponsiblePerson[]): void {
  localStorage.setItem(PERSONS_KEY, JSON.stringify(persons));
}

export function loadBotConfig(): BotConfig {
  try {
    const raw = localStorage.getItem(BOT_KEY);
    if (raw) return JSON.parse(raw) as BotConfig;
  } catch {}
  return { ...DEFAULT_BOT_CONFIG };
}

export function saveBotConfig(cfg: BotConfig): void {
  localStorage.setItem(BOT_KEY, JSON.stringify(cfg));
}

/** Tuman uchun faol mas'ul shaxslarni qaytaradi */
export function getPersonsForDistrict(
  persons: ResponsiblePerson[],
  district: string,
  notifyType: NotifyType,
): ResponsiblePerson[] {
  return persons.filter(p =>
    p.active &&
    p.telegramId &&
    p.assignedTetk.includes(district) &&
    p.notifyTypes.includes(notifyType),
  );
}

export const ALL_DISTRICTS = Object.keys(TETK_MAP);
export const ALL_NOTIFY_TYPES: { key: NotifyType; label: string }[] = [
  { key:'offline',  label:"Aloqa yo'q" },
  { key:'fault',    label:'Nosozlik' },
  { key:'theft',    label:"O'g'irlik" },
  { key:'overload', label:'Yuklanish oshdi' },
  { key:'warning',  label:'Ogohlantirish' },
];
