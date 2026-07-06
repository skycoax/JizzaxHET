import { useEffect, useRef, useState } from 'react';
import type { DashboardKpis, Device, DeviceStatus } from '@/types';
import { STATUS_META, formatDuration, formatNumber, stripDistrict } from '@/lib/utils';
import { analyzeFault, type FaultLevel } from './faultAnalysis';
import { playAlarmBeep } from '@/lib/sound';
import { t } from '@/i18n';

const SEV_RANK: Record<DeviceStatus, number> = { offline: 0, fault: 1, warning: 2, online: 3 };
type FilterKey = 'all' | 'offline' | 'fault' | 'warning';

const LEVEL_COLOR: Record<FaultLevel, string> = {
  critical: 'var(--crit)',
  high: 'var(--fault)',
  medium: 'var(--warn)',
  low: 'var(--accent)',
};

const alarmKey = (d: Device) => `${d.id}:${d.faultSince}`;

export function AlarmsPanel({
  devices,
  kpis,
  soundOn,
  onSelectDevice,
}: {
  devices: Device[];
  kpis: DashboardKpis;
  soundOn: boolean;
  onSelectDevice: (id: string) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [ackedKeys, setAckedKeys] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevKeysRef = useRef<Set<string>>(new Set());
  const firstRunRef = useRef(true);

  const alarms = devices
    .filter((d) => d.status !== 'online')
    .sort((a, b) => SEV_RANK[a.status] - SEV_RANK[b.status] || (a.faultSince ?? 0) - (b.faultSince ?? 0));

  // yangi avariya paydo bo'lsa — ovozli signal
  useEffect(() => {
    const current = new Set(alarms.map(alarmKey));
    if (!firstRunRef.current && soundOn) {
      let isNew = false;
      current.forEach((k) => {
        if (!prevKeysRef.current.has(k)) isNew = true;
      });
      if (isNew) playAlarmBeep();
    }
    prevKeysRef.current = current;
    firstRunRef.current = false;
  }, [alarms, soundOn]);

  const isAcked = (d: Device) => ackedKeys.has(alarmKey(d));
  const ack = (d: Device) =>
    setAckedKeys((prev) => {
      const n = new Set(prev);
      n.add(alarmKey(d));
      return n;
    });
  const ackAll = () =>
    setAckedKeys((prev) => {
      const n = new Set(prev);
      alarms.forEach((d) => n.add(alarmKey(d)));
      return n;
    });

  const filtered = filter === 'all' ? alarms : alarms.filter((d) => d.status === filter);
  const unackedCount = alarms.filter((d) => !isAcked(d)).length;

  return (
    <>
      <div className="head">
        <div className="sec" style={{ margin: 0 }}>{t('panel.alarms')}</div>
        <div className="feedstat">
          <div className="fs crit"><div className="n">{kpis.offline}</div><div className="l">{t('feed.offline')}</div></div>
          <div className="fs fault"><div className="n">{kpis.faults}</div><div className="l">{t('feed.fault')}</div></div>
          <div className="fs warn"><div className="n">{kpis.warnings}</div><div className="l">{t('feed.warning')}</div></div>
        </div>
      </div>

      <div className="alarm-filters">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={t('filter.all')} count={alarms.length} />
        <FilterChip active={filter === 'offline'} onClick={() => setFilter('offline')} label={t('feed.offline')} count={kpis.offline} color="var(--crit)" />
        <FilterChip active={filter === 'fault'} onClick={() => setFilter('fault')} label={t('feed.fault')} count={kpis.faults} color="var(--fault)" />
        <FilterChip active={filter === 'warning'} onClick={() => setFilter('warning')} label={t('feed.warning')} count={kpis.warnings} color="var(--warn)" />
      </div>

      {unackedCount > 0 && (
        <div className="alarm-ackall">
          <button className="btn-ackall" onClick={ackAll}>
            {t('alarm.ackAll')} ({unackedCount})
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState hasAlarms={alarms.length > 0} />
      ) : (
        <div className="alarm-list">
          {filtered.map((d) => (
            <AlarmCard
              key={d.id}
              device={d}
              acked={isAcked(d)}
              expanded={expandedId === d.id}
              onToggle={() => setExpandedId((cur) => (cur === d.id ? null : d.id))}
              onAck={() => ack(d)}
              onLocate={() => onSelectDevice(d.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button className={`afilt ${active ? 'on' : ''}`} onClick={onClick}>
      {color && <i style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />}
      {label} <b>{count}</b>
    </button>
  );
}

function EmptyState({ hasAlarms }: { hasAlarms: boolean }) {
  return (
    <div className="alarm-empty">
      <div className="ico">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      </div>
      <h4>{hasAlarms ? "Bu turdagi avariya yo'q" : t('alarm.empty')}</h4>
      <p>{hasAlarms ? 'Boshqa filtrni tanlang.' : t('alarm.emptySub')}</p>
    </div>
  );
}

function AlarmCard({
  device,
  acked,
  expanded,
  onToggle,
  onAck,
  onLocate,
}: {
  device: Device;
  acked: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAck: () => void;
  onLocate: () => void;
}) {
  const meta = STATUS_META[device.status];
  const analysis = analyzeFault(device);
  const affected = Math.max(0, device.metersTotal - device.metersOnline);
  const tel = device.responsiblePhone.replace(/\s/g, '');

  return (
    <div className={`acard lv-${device.status} ${acked ? 'acked' : ''} ${expanded ? 'open' : ''}`}>
      <div className="ahead" onClick={onToggle}>
        <div className="arow1">
          <span className="aid">{device.id}</span>
          <span className="badge" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}>
            <span className="badge-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        </div>
        <div className="aname">{device.name}</div>
        <div className="adist">{stripDistrict(device.district)}</div>
        <div className="ameta">
          {device.faultSince !== null && (
            <span className="m">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
              <b>{formatDuration(device.faultSince)}</b>
            </span>
          )}
          {affected > 0 && (
            <span className="m aff">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <b>{formatNumber(affected)}</b> isteʼmolchi
            </span>
          )}
        </div>
        <div className="aackbar">
          {acked ? (
            <span className="acked-chip">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t('alarm.acked')}
            </span>
          ) : (
            <button className="btn-ack" onClick={(e) => { e.stopPropagation(); onAck(); }}>
              {t('alarm.ack')}
            </button>
          )}
          <button className="btn-exp" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {t('alarm.details')}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="aanalysis">
          <div className="arow">
            <span className="k">{t('alarm.severity')}</span>
            <span className="v" style={{ color: LEVEL_COLOR[analysis.level] }}>{analysis.levelLabel}</span>
          </div>
          <div className="arow">
            <span className="k">{t('alarm.voltage')}</span>
            <span className="v mono">{device.voltage}</span>
          </div>
          {device.type === 'concentrator' && (
            <div className="arow">
              <span className="k">{t('alarm.meters')}</span>
              <span className="v mono">{formatNumber(device.metersOnline)} / {formatNumber(device.metersTotal)}</span>
            </div>
          )}
          <div className="arow">
            <span className="k">{t('alarm.affected')}</span>
            <span className="v mono" style={{ color: 'var(--fault)' }}>{formatNumber(affected)}</span>
          </div>

          <div className="block">
            <div className="bl">{t('alarm.cause')}</div>
            <div className="bt">{analysis.cause}</div>
          </div>
          <div className="block action">
            <div className="bl">{t('alarm.action')}</div>
            <div className="bt">{analysis.action}</div>
          </div>

          <div className="resp2">
            <div>
              <div className="rl">{t('alarm.responsible')}</div>
              <div className="rn">{device.responsibleName}</div>
            </div>
            <a href={`tel:${tel}`} onClick={(e) => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {device.responsiblePhone}
            </a>
          </div>

          <button className="btn-map" onClick={(e) => { e.stopPropagation(); onLocate(); }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {t('alarm.onMap')}
          </button>
        </div>
      )}
    </div>
  );
}
