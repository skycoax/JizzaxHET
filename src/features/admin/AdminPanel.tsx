import { useCallback, useEffect, useState } from 'react';
import type { BotConfig, NotifyType, ResponsiblePerson } from '@/types';
import { TETK_MAP, getTetkCode, stripDistrict } from '@/lib/utils';
import { ALL_DISTRICTS, ALL_NOTIFY_TYPES, DEFAULT_BOT_CONFIG } from './personStore';
import {
  apiGetPersons, apiSavePerson, apiDeletePerson,
  apiTestPerson, apiGetBotStatus, apiUpdateBotConfig, hasBackend,
} from './personsApi';
import { loadBotConfig, saveBotConfig } from './personStore';

type Tab = 'persons' | 'bot';
type BotStatus = 'unknown' | 'ok' | 'error' | 'no-backend';

function newPerson(): ResponsiblePerson {
  return {
    id: `p${Date.now()}`, name: '', phone: '',
    telegramId: null, telegramUsername: null,
    assignedTetk: [], notifyTypes: ['offline','fault'],
    active: true, createdAt: Date.now(), lastNotified: null,
  };
}

export function AdminPanel() {
  const [persons,    setPersons   ] = useState<ResponsiblePerson[]>([]);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState('');
  const [botCfg,     setBotCfg    ] = useState<BotConfig>(loadBotConfig);
  const [botStatus,  setBotStatus ] = useState<BotStatus>('unknown');
  const [tab,        setTab       ] = useState<Tab>('persons');
  const [selId,      setSelId     ] = useState<string | null>(null);
  const [editing,    setEditing   ] = useState<ResponsiblePerson | null>(null);
  const [isNew,      setIsNew     ] = useState(false);
  const [toast,      setToast     ] = useState('');
  const isApi = hasBackend();

  // Yuklanish
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const list = await apiGetPersons();
      setPersons(list);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const checkBot = async () => {
    const s = await apiGetBotStatus();
    setBotStatus(s ? (s.ok ? 'ok' : 'error') : 'no-backend');
  };

  // ── CRUD ──────────────────────────────────────────────────
  const save = async (p: ResponsiblePerson) => {
    try {
      const saved = await apiSavePerson(p);
      setPersons(prev => isNew ? [...prev, saved] : prev.map(x => x.id === p.id ? saved : x));
      setEditing(null); setIsNew(false); setSelId(saved.id);
      showToast(isNew ? '✅ Shaxs qo\'shildi' : '✅ Saqlandi');
    } catch (e: unknown) { showToast('❌ ' + (e as Error).message); }
  };

  const del = async (id: string) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    try {
      await apiDeletePerson(id);
      setPersons(prev => prev.filter(p => p.id !== id));
      setSelId(null); showToast('✅ O\'chirildi');
    } catch (e: unknown) { showToast('❌ ' + (e as Error).message); }
  };

  const test = async (p: ResponsiblePerson) => {
    if (!p.telegramId) { showToast('⚠️ Telegram ID kiritilmagan'); return; }
    showToast('📤 Test xabar yuborilmoqda...');
    const ok = await apiTestPerson(p.id);
    showToast(ok ? '✅ Test xabar yuborildi!' : '❌ Yuborib bo\'lmadi');
  };

  const saveBotKey = async (key: string, value: string) => {
    await apiUpdateBotConfig(key, value);
    const updated = { ...botCfg };
    if (key === 'tg_token')   updated.token    = value;
    if (key === 'tg_enabled') updated.enabled  = value === 'true';
    if (key === 'casnet_url') updated.serverUrl= value;
    setBotCfg(updated);
    saveBotConfig(updated);
  };

  const sel = persons.find(p => p.id === selId) ?? null;

  return (
    <div className="adm-wrap">
      {toast && <div className="adm-toast-top">{toast}</div>}

      {/* Sol panel */}
      <aside className="adm-left">
        <div className="adm-head">
          <div className="adm-tabs">
            <button className={`adm-tab${tab==='persons'?' on':''}`} onClick={()=>setTab('persons')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Mas'ul shaxslar
              {persons.length > 0 && <span className="cnt">{persons.length}</span>}
            </button>
            <button className={`adm-tab${tab==='bot'?' on':''}`} onClick={()=>{ setTab('bot'); checkBot(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Telegram Bot
              <span className={`bot-dot ${botStatus}`}/>
            </button>
          </div>
          {tab==='persons' && (
            <button className="adm-add" onClick={()=>{ setEditing(newPerson()); setIsNew(true); setSelId(null); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Qo'shish
            </button>
          )}
        </div>

        {tab==='persons' && (
          <div className="adm-list">
            {loading && <div className="adm-loading"><span className="spinner"/>Yuklanmoqda...</div>}
            {error   && <div className="adm-err">{error}<button onClick={reload}>Qayta</button></div>}
            {!loading && !error && persons.map(p => (
              <div key={p.id} className={`ap-row${selId===p.id?' on':''}${!p.active?' dim':''}`}
                onClick={()=>{ setSelId(p.id); setEditing(null); }}>
                <span className={`ap-ava ${p.active?'':'off'}`}>{p.name[0]}</span>
                <div className="ap-info">
                  <div className="ap-name">{p.name}</div>
                  <div className="ap-sub">
                    {p.assignedTetk.slice(0,2).map(d=>(
                      <span key={d} className="ap-tetk">{getTetkCode(d)}</span>
                    ))}
                    {p.assignedTetk.length>2 && <span className="ap-tetk">+{p.assignedTetk.length-2}</span>}
                  </div>
                </div>
                <span className={`tg-badge${p.telegramId?' on':''}`}>TG</span>
              </div>
            ))}
            {!loading && persons.length===0 && !error && (
              <div className="rt-empty">Mas'ul shaxslar yo'q</div>
            )}
          </div>
        )}

        {tab==='bot' && (
          <div className="bot-cfg-panel">
            <BotConfigPanel cfg={botCfg} status={botStatus} onCheck={checkBot}
              isApi={isApi} onSaveKey={saveBotKey}/>
          </div>
        )}
      </aside>

      {/* O'ng panel */}
      <main className="adm-main">
        {editing ? (
          <PersonForm person={editing} isNew={isNew}
            onSave={save} onCancel={()=>{ setEditing(null); setIsNew(false); }}/>
        ) : sel ? (
          <PersonDetail person={sel}
            onEdit={()=>setEditing({...sel})}
            onDelete={()=>del(sel.id)}
            onToggle={()=>save({...sel, active:!sel.active})}
            onTest={()=>test(sel)}
          />
        ) : (
          <div className="adm-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <div>Shaxsni tanlang yoki yangi qo'shing</div>
            <div className="sub">{isApi ? '✅ Backend API ulangan' : '⚠️ Demo: localStorage'}</div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Person tafsilot ── */
function PersonDetail({ person:p, onEdit, onDelete, onToggle, onTest }: {
  person:ResponsiblePerson; onEdit:()=>void; onDelete:()=>void;
  onToggle:()=>void; onTest:()=>void;
}) {
  return (
    <div className="pd-wrap">
      <div className="pd-head">
        <div className={`pd-ava ${p.active?'':'off'}`}>{p.name[0]}</div>
        <div>
          <h2 className="pd-name">{p.name}</h2>
          <div className="pd-phone">📞 {p.phone}</div>
        </div>
        <div className="pd-actions">
          <button className="pd-btn edit" onClick={onEdit}>Tahrirlash</button>
          <button className={`pd-btn ${p.active?'deact':'act'}`} onClick={onToggle}>
            {p.active?'Nofaol':'Faollashtirish'}
          </button>
          <button className="pd-btn del" onClick={onDelete}>O'chirish</button>
        </div>
      </div>
      <div className="pd-body">
        <div className="pd-section">
          <div className="pd-sec-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Telegram
          </div>
          {p.telegramId ? (
            <div className="tg-info">
              <div className="tg-row"><span className="tg-label">Chat ID</span><span className="tg-val mono">{p.telegramId}</span></div>
              {p.telegramUsername && <div className="tg-row"><span className="tg-label">Username</span><span className="tg-val">{p.telegramUsername}</span></div>}
              {p.lastNotified && <div className="tg-row"><span className="tg-label">Oxirgi xabar</span><span className="tg-val">{new Date(p.lastNotified).toLocaleString('uz-UZ')}</span></div>}
              <button className="tg-test" onClick={onTest}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Test xabar yuborish
              </button>
            </div>
          ) : (
            <div className="tg-empty">
              Telegram ID kiritilmagan
              <button className="pd-btn edit" style={{marginTop:8}} onClick={onEdit}>Kiritish</button>
            </div>
          )}
        </div>
        <div className="pd-section">
          <div className="pd-sec-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            Biriktirilgan TETK lar
          </div>
          <div className="tetk-chips">
            {p.assignedTetk.length===0
              ? <span className="no-tetk">Biriktirilmagan</span>
              : p.assignedTetk.map(d=>(
                <span key={d} className="tetk-chip"><b>{getTetkCode(d)}</b> {stripDistrict(d)}</span>
              ))}
          </div>
        </div>
        <div className="pd-section">
          <div className="pd-sec-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Bildirishnoma turlari
          </div>
          <div className="notify-chips">
            {ALL_NOTIFY_TYPES.map(nt=>(
              <span key={nt.key} className={`notify-chip${p.notifyTypes.includes(nt.key)?' on':''}`}>{nt.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Person form ── */
function PersonForm({ person:init, isNew, onSave, onCancel }:{
  person:ResponsiblePerson; isNew:boolean;
  onSave:(p:ResponsiblePerson)=>void; onCancel:()=>void;
}) {
  const [p, setP] = useState<ResponsiblePerson>(init);
  const upd = (f: Partial<ResponsiblePerson>) => setP(prev=>({...prev,...f}));
  const toggleTetk = (d:string) => upd({ assignedTetk: p.assignedTetk.includes(d) ? p.assignedTetk.filter(x=>x!==d) : [...p.assignedTetk,d] });
  const toggleNt   = (nt:NotifyType) => upd({ notifyTypes: p.notifyTypes.includes(nt) ? p.notifyTypes.filter(x=>x!==nt) : [...p.notifyTypes,nt] });
  const valid = p.name.trim() && p.phone.trim() && p.assignedTetk.length > 0;
  return (
    <div className="pf-wrap">
      <div className="pf-head">
        <h3>{isNew?"Yangi mas'ul shaxs":"Tahrirlash"}</h3>
        <button className="pf-cancel" onClick={onCancel}>Bekor</button>
      </div>
      <div className="pf-body">
        <div className="pf-row"><label>Ismi *</label><input className="pf-inp" value={p.name} onChange={e=>upd({name:e.target.value})} placeholder="To'liq ism"/></div>
        <div className="pf-row"><label>Telefon *</label><input className="pf-inp" value={p.phone} onChange={e=>upd({phone:e.target.value})} placeholder="+998 90 123 45 67"/></div>
        <div className="pf-row">
          <label>Telegram Chat ID</label>
          <input className="pf-inp mono" value={p.telegramId??''} onChange={e=>upd({telegramId:e.target.value||null})} placeholder="123456789"/>
          <div className="pf-hint">@userinfobot ga /start yuboring → ID olasiz</div>
        </div>
        <div className="pf-row"><label>Telegram Username</label><input className="pf-inp" value={p.telegramUsername??''} onChange={e=>upd({telegramUsername:e.target.value||null})} placeholder="@username"/></div>
        <div className="pf-section">
          <div className="pf-sec-title">TETK biriktiruv *</div>
          <div className="tetk-grid">
            {ALL_DISTRICTS.map(d=>{
              const code=TETK_MAP[d]?.code??'?';
              const on=p.assignedTetk.includes(d);
              return (<button key={d} className={`tg-pick${on?' on':''}`} onClick={()=>toggleTetk(d)}><b>{code}</b><span>{stripDistrict(d)}</span></button>);
            })}
          </div>
        </div>
        <div className="pf-section">
          <div className="pf-sec-title">Bildirishnoma turlari</div>
          <div className="notify-row">
            {ALL_NOTIFY_TYPES.map(nt=>(
              <button key={nt.key} className={`nf-pick${p.notifyTypes.includes(nt.key)?' on':''}`} onClick={()=>toggleNt(nt.key)}>{nt.label}</button>
            ))}
          </div>
        </div>
        <div className="pf-row">
          <label><input type="checkbox" checked={p.active} onChange={e=>upd({active:e.target.checked})}/>{' '}Faol (bildirishnomalar yuboriladi)</label>
        </div>
      </div>
      <div className="pf-foot">
        <button className="pf-save" onClick={()=>onSave(p)} disabled={!valid}>{isNew?"Qo'shish":"Saqlash"}</button>
      </div>
    </div>
  );
}

/* ── Bot config panel ── */
function BotConfigPanel({ cfg, status, onCheck, isApi, onSaveKey }:{
  cfg:BotConfig; status:BotStatus; onCheck:()=>void;
  isApi:boolean; onSaveKey:(k:string,v:string)=>void;
}) {
  const [token, setToken] = useState(cfg.token);
  return (
    <div className="bcfg">
      <div className="bcfg-status">
        <span className={`bot-dot ${status}`}/>
        <span>{status==='ok'?'Server ishlayapti':status==='error'?'Ulanib bo\'lmadi':status==='no-backend'?'Backend yo\'q':'Tekshirilmagan'}</span>
        <button className="bcfg-check" onClick={onCheck}>Tekshirish</button>
      </div>
      {!isApi && <div className="bcfg-warn">⚠️ Backend ulanmagan — sozlamalar localStorage da</div>}
      <div className="bcfg-block">
        <div className="bcfg-title">Bot token</div>
        <label className="bcfg-label">@BotFather dan olingan token</label>
        <div style={{display:'flex',gap:8}}>
          <input className="bcfg-inp mono" type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="1234567890:AAF..."/>
          <button className="bcfg-check" onClick={()=>onSaveKey('tg_token',token)}>Saqlash</button>
        </div>
        <div className="bcfg-hint"><a href="https://t.me/botfather" target="_blank" rel="noreferrer">@BotFather</a> → /newbot → token oling</div>
      </div>
      <div className="bcfg-block">
        <label className="bcfg-toggle">
          <div className={`sp-toggle${cfg.enabled?' on':''}`} onClick={()=>onSaveKey('tg_enabled',cfg.enabled?'false':'true')}><i/></div>
          Telegram bildirishnomalar yoqilgan
        </label>
      </div>
      <div className="bcfg-info">
        <div className="bcfg-title">Backend ishga tushirish</div>
        <pre className="bcfg-code">cd backend
pip install -r requirements.txt
python main.py</pre>
      </div>
    </div>
  );
}
