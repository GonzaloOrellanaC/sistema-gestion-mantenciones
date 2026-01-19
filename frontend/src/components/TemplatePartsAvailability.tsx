import React, { useEffect, useState } from 'react';
import { IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonNote } from '@ionic/react';
import inventoryApi from '../api/inventory';
import * as partsApi from '../api/parts';
import { useAuth } from '../context/AuthContext';

type PartEntry = Record<string, any>;

type Props = {
  // template structure object (may be populated or just id)
  template?: any;
  onResolved?: (results: Array<{ part: PartEntry; required: number; available: number }>) => void;
};

export default function TemplatePartsAvailability({ template, onResolved }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [partsStatus, setPartsStatus] = useState<Array<{ part: PartEntry; required: number; available: number }>>([]);

  useEffect(() => {
    if (!template || !template.structure || !Array.isArray(template.structure.components)) {
      setPartsStatus([]);
      return;
    }

    const partsComps = template.structure.components.filter((c: any) => c && c.type === 'parts');
    const partsList: PartEntry[] = [];
    partsComps.forEach((pc: any) => {
      const list = Array.isArray(pc.parts) ? pc.parts : [];
      list.forEach((p: any) => partsList.push(p));
    });

    if (partsList.length === 0) {
      setPartsStatus([]);
      return;
    }

    let mounted = true;
    setLoading(true);
      (async () => {
        try {
          // prefer backend-provided availability in a single call
          const ids = partsList.map((p: any) => p._id || p.id || p.partId).filter(Boolean);
          let availabilityMap: Record<string, number> = {};
          try {
            const resp = await partsApi.getPartsAvailability(ids);
            // resp.items -> [{ partId, available, part? }]
            if (resp && Array.isArray(resp.items)) {
              for (const it of resp.items) {
                if (it && it.partId) availabilityMap[String(it.partId)] = Number(it.available || 0);
              }
            }
          } catch (e) {
            // backend availability endpoint failed; we'll fallback to inventoryApi per-part
            availabilityMap = {};
          }

          const results = await Promise.all(partsList.map(async (p) => {
            const partId = p._id || p.id || p.partId;
            const required = Number(p.qty || p.quantity || 1);
            if (!partId) return { part: p, required, available: 0 };

            if (Object.keys(availabilityMap).length > 0) {
              const available = Number(availabilityMap[String(partId)] || 0);
              return { part: p, required, available };
            }

            // fallback: compute from inventory API (older behavior)
            try {
              const stockLines: any = await inventoryApi.listStock({ orgId: user?.orgId, partId });
              let available = 0;
              if (Array.isArray(stockLines)) {
                for (const s of stockLines) {
                  const qty = Number(s.quantity || 0);
                  const reserved = Number(s.reserved || 0);
                  available += Math.max(0, qty - reserved);
                }
              }
              return { part: p, required, available };
            } catch (e) {
              return { part: p, required, available: 0 };
            }
          }));

          if (!mounted) return;
          setPartsStatus(results);
          if (typeof onResolved === 'function') onResolved(results);
        } finally {
          if (mounted) setLoading(false);
        }
      })();

    return () => { mounted = false; };
  }, [template, user?.orgId]);

  if (!template) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Repuestos requeridos por la pauta</div>
      {loading && <div style={{ marginBottom: 8 }}><IonSpinner name="dots" /></div>}
      {partsStatus.length === 0 && !loading && <IonNote>No hay repuestos definidos en la pauta.</IonNote>}
      <IonList>
        {partsStatus.map((ps, idx) => (
          <IonItem key={ps.part._id || ps.part.id || idx}>
            <IonLabel>
              <div style={{ fontWeight: 600 }}>{ps.part.name || ps.part.label || ps.part._id}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Requerido: {ps.required}</div>
            </IonLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 13 }}>{ps.available}</div>
              <IonBadge color={ps.available >= ps.required ? 'success' : 'danger'}>{ps.available >= ps.required ? 'Disponible' : 'Insuficiente'}</IonBadge>
            </div>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
}
