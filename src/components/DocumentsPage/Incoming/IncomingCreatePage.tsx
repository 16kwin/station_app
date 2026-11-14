// IncomingCreatePage.tsx — форма документа «Поступление»
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTabs } from '../../../context/TabContext';
import { motion, AnimatePresence } from 'framer-motion';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';

import FormField from '../../elements/FormField';
import DataTable from '../../elements/DataTable';
import HistoryTable from '../../elements/HistoryTable';
import CatalogSelectPopup from '../../ReferencesPage/NomenclaturePage/CatalogSelectPopup';
import type { ContextMenuItem } from '../../elements/ContextMenu';

import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import CalendarIcon16Gray from '../../../assets/Icons/CalendarIcons/CalendarIcon16Gray.svg';
import StationIcon16Gray from '../../../assets/Icons/StationIcons/StationIcon16Gray.svg';
import StationIcon16Blue from '../../../assets/Icons/StationIcons/StationIcon16Blue.svg';
import WriteIcon21Black from '../../../assets/Icons/WriteIcons/WriteIcon21Black.svg';
import CancelIcon16BlackOne from '../../../assets/Icons/CancelIcons/CancelIcon16BlackOne.svg';
import DescriptionIcon18Black from '../../../assets/Icons/DescriptionIcons/DescriptionIcon18Black.svg';
import NomenclatureIcon16Black from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Black.svg';
import InfoIcon18Black from '../../../assets/Icons/InfoIcons/InfoIcon18Black.svg';
import HistoryIcon18Black from '../../../assets/Icons/HistoryIcons/HistoryIcon18Black.svg';
import HistoryIcon18White from '../../../assets/Icons/HistoryIcons/HistoryIcon18White.svg';
import CreateIcon14Black from '../../../assets/Icons/СreateIcons/СreateIcon14Black.svg';
import CleanIcon18Black from '../../../assets/Icons/CleanIcons/CleanIcon18Black.svg';
import SearchIcon18Black from '../../../assets/Icons/SearchIcons/SearchIcon18Black.svg';
import SearchIcon18White from '../../../assets/Icons/SearchIcons/SearchIcon18White.svg';
import SortingIcon20Black from '../../../assets/Icons/SortingIcons/SortingIcon20Black.svg';
import FilterIcon18Black from '../../../assets/Icons/FilterIcons/FilterIcon18Black.svg';

const USER_ID = 1;

const TITLE_TOP = 35;
const TITLE_LEFT = 60 + 25;
const TITLE_TO_STATUS_GAP = 25;

const MANAGE_BTN_W = 215;
const MANAGE_BTN_H = 46;
const MANAGE_BTN_RADIUS = 30;
const MANAGE_BTN_TOP = 28;
const MANAGE_BTN_RIGHT = 30;

const MANAGE_MENU_W = 260;
const MANAGE_MENU_ITEM_H = 44;
const MANAGE_MENU_PAD = 8;
const MANAGE_MENU_GAP = 8;
const MANAGE_MENU_RADIUS = 16;

const HEADER_TOP = 95;
const HEADER_LEFT = 30;
const HEADER_W = 1740;
const HEADER_H = 250;
const HEADER_RADIUS = 20;
const HEADER_FIELD_W = 385;
const HEADER_FIELD_H = 50;
const HEADER_FIELD_TOP_ROW1 = 35;
const HEADER_FIELD_TOP_ROW2 = 110;
const HEADER_FIELD_LEFT_FIRST = 40;
const HEADER_FIELD_GAP = 40;

const BASE_INFO_BOTTOM = 22;
const BASE_INFO_LEFT = 57;
const BASE_ICON_SIZE = 16;
const BASE_ICON_TO_TEXT = 12;

const PANEL_TOP = HEADER_TOP + HEADER_H + 20;
const PANEL_LEFT = HEADER_LEFT + 20;
const PANEL_BTN_SIZE = 44;
const PANEL_BTN_RADIUS = 22;
const PANEL_BTN_GAP = 17;
const PANEL_H = 44;

const ADD_BTN_AFTER_PANEL = 57;
const ADD_BTN_W = 196;
const ADD_BTN_RADIUS = 22;
const CLEAN_BTN_SIZE = 44;
const CLEAN_BTN_GAP = 17;

const RIGHT_BTN_SIZE = 44;
const RIGHT_BTN_RADIUS = 22;
const RIGHT_BTN_GAP = 17;
const RIGHT_INSET = 20;

const TABLE_TOP = PANEL_TOP + PANEL_H + 12;
const TABLE_LEFT = HEADER_LEFT;
const TABLE_W = 1740;
const TABLE_H = 300;
const TABLE_ROW_H = 58;
const TABLE_HEADER_H = 58;
const TABLE_VISIBLE_ROWS = 5;

const BOTTOM_BTN_H = 46;
const BOTTOM_BTN_RADIUS = 30;
const BOTTOM_BTN_BOTTOM = 30;
const BOTTOM_BTN_RIGHT = 30;
const BOTTOM_BTN_GAP = 20;
const BTN_CLOSE_W = 114;
const BTN_SAVE_W = 150;
const BTN_POST_W = 170;

const btnBaseStyle: React.CSSProperties = { outline: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent' };

interface IncomingLine {
  uid: string;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  materialCode?: number | null;
  article?: string | null;
  quantity?: number | null;
  measureUid?: string | null;
  measureName?: string | null;
  price?: number | null;
  sum?: number | null;
  vatRate?: number | null;
  vatAmount?: number | null;
  gtdRnptNumber?: string | null;
  countryUid?: string | null;
  countryName?: string | null;
}

interface DocIncoming {
  uid: string;
  code: number | null;
  docDatetime: string;
  stationUid: string | null;
  stationName: string | null;
  supplierUid: string | null;
  supplierName: string | null;
  responsible: string | null;
  baseDocument: string | null;
  contract: string | null;
  purchaseOrder: string | null;
  comment: string | null;
  status: string;
  cancelled: boolean | null;
  totalLines: number | null;
  totalQuantity: number | null;
  totalSum: number | null;
  totalVat: number | null;
  closedAt?: string | null;
  lines: IncomingLine[];
}

interface RefOption { uid: string; name: string; }

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Записан',
  CLOSED: 'Проведён',
  CANCELLED: 'Отменён',
};

const ALL_COLUMNS = [
  { key: 'materialName', label: 'Номенклатура' },
  { key: 'article', label: 'Артикул' },
  { key: 'quantity', label: 'Количество' },
  { key: 'measureName', label: 'Ед. изм.' },
  { key: 'price', label: 'Цена' },
  { key: 'sum', label: 'Сумма' },
  { key: 'vatRate', label: 'Ставка НДС' },
  { key: 'vatAmount', label: 'НДС' },
  { key: 'gtdRnptNumber', label: 'ГТД/РНПТ' },
  { key: 'countryName', label: 'Страна' },
];

const formatDateWithSeconds = (s: string | null | undefined): string => {
  if (!s) return '';
  try { const d = new Date(s); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); const hh = String(d.getHours()).padStart(2, '0'); const mi = String(d.getMinutes()).padStart(2, '0'); const ss = String(d.getSeconds()).padStart(2, '0'); return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`; } catch { return ''; }
};

const extractCode = (data: any): number | null => {
  if (!data) return null;
  const raw = data.codeMaterial ?? data.code ?? data.materialCode ?? null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw != null) { const p = Number(raw); if (Number.isFinite(p)) return p; }
  return null;
};

const IncomingCreatePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const location = useLocation();
  const { tabs, activeTabId, closeTab, replaceTab } = useTabs();

  const isEdit = !!uid && location.pathname.startsWith(`/documents/incoming/edit/${uid}`);

  const [doc, setDoc] = useState<DocIncoming | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [stationUid, setStationUid] = useState('');
  const [stationName, setStationName] = useState('');
  const [supplierUid, setSupplierUid] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [baseDocument, setBaseDocument] = useState('');
  const [contract, setContract] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [comment, setComment] = useState('');

  const [showSupplierSelect, setShowSupplierSelect] = useState(false);

  const [lines, setLines] = useState<IncomingLine[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [materialOptions, setMaterialOptions] = useState<{ uid: string; name: string; article: string; code: number | null }[]>([]);
  const [measureOptions, setMeasureOptions] = useState<RefOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<RefOption[]>([]);
  const [stationOptions, setStationOptions] = useState<RefOption[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<RefOption[]>([]);

  const [panel, setPanel] = useState<'search' | 'sort' | 'filter' | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const [manageOpen, setManageOpen] = useState(false);
  const manageWrapRef = useRef<HTMLDivElement | null>(null);

  // Инлайн-строка добавления
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftEditUid, setDraftEditUid] = useState<string | null>(null);
  const [dMaterialUid, setDMaterialUid] = useState('');
  const [dMaterialName, setDMaterialName] = useState('');
  const [dMaterialArticle, setDMaterialArticle] = useState('');
  const [dMaterialCode, setDMaterialCode] = useState<number | null>(null);
  const [dArticle, setDArticle] = useState('');
  const [dQuantity, setDQuantity] = useState<number | ''>('');
  const [dMeasureUid, setDMeasureUid] = useState('');
  const [dMeasureName, setDMeasureName] = useState('');
  const [dPrice, setDPrice] = useState<number | ''>('');
  const [dVatRate, setDVatRate] = useState<number | ''>('');
  const [dGtd, setDGtd] = useState('');
  const [dCountryUid, setDCountryUid] = useState('');
  const [dCountryName, setDCountryName] = useState('');
  const [showMaterialFullList, setShowMaterialFullList] = useState(false);

  useEffect(() => {
    if (!manageOpen) return;
    const handler = (e: MouseEvent) => {
      if (manageWrapRef.current && !manageWrapRef.current.contains(e.target as Node)) setManageOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [manageOpen]);

  const fetchDoc = useCallback(async (docUid: string) => {
    setIsLoading(true);
    try {
      const r = await AxiosService.get(ConstantInfo.restApiIncomingGet(docUid));
      const d = r.data as DocIncoming;
      setDoc(d);
      setStationUid(d.stationUid || '');
      setStationName(d.stationName || '');
      setSupplierUid(d.supplierUid || '');
      setSupplierName(d.supplierName || '');
      setResponsible(d.responsible || '');
      setBaseDocument(d.baseDocument || '');
      setContract(d.contract || '');
      setPurchaseOrder(d.purchaseOrder || '');
      setComment(d.comment || '');
      setLines((d.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` })));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, []);

  const fetchStations = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiStationsCrud(USER_ID));
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      // Поступление — только на неадресные склады (isAddress !== true), включая MAIN
      const notAddress = items
        .filter((s: any) => s.isAddress !== true)
        .map((s: any) => ({ uid: s.uid, name: s.name }));
      setStationOptions(notAddress);
    } catch (e) { console.error(e); }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiSuppliersList);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setSupplierOptions(items.map((s: any) => ({ uid: s.uid, name: s.name })));
    } catch (e) { console.error(e); }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
      const respData = r.data as any;
      const items: { uid: string; name: string; article: string; code: number | null }[] = [];
      const seen = new Set<string>();
      const pushMaterial = (m: any) => { if (!m || !m.uid || seen.has(m.uid)) return; seen.add(m.uid); items.push({ uid: m.uid, name: m.name || m.nameMaterial || 'Без названия', article: m.article || m.articleMaterial || '', code: extractCode(m) }); };
      const walk = (nodes: any[]) => { nodes.forEach((n: any) => { if (n.materials && Array.isArray(n.materials)) n.materials.forEach((m: any) => pushMaterial(m)); if (n.children && Array.isArray(n.children)) walk(n.children); }); };
      if (Array.isArray(respData)) walk(respData);
      else if (respData?.tree) walk(respData.tree);
      else if (respData?.data) walk(respData.data);
      setMaterialOptions(items);
    } catch (e) { console.error('Ошибка загрузки номенклатуры:', e); }
  }, []);

  const fetchMeasures = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureMeasures);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setMeasureOptions(items.map((m: any) => ({ uid: m.uid, name: m.name })));
    } catch (e) { console.error(e); }
  }, []);

  const fetchCountries = useCallback(async () => {
    try {
      const r = await AxiosService.get(ConstantInfo.restApiNomenclatureCountries);
      const respData = r.data as any;
      const items = Array.isArray(respData) ? respData : (respData.data || []);
      setCountryOptions(items.map((c: any) => ({ uid: c.uid, name: c.name })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }
    if (isEdit) fetchDoc(uid);
    else {
      setDoc({
        uid, code: null, docDatetime: new Date().toISOString(),
        stationUid: null, stationName: null, supplierUid: null, supplierName: null,
        responsible: null, baseDocument: null, contract: null, purchaseOrder: null, comment: null,
        status: 'DRAFT', cancelled: false,
        totalLines: 0, totalQuantity: 0, totalSum: 0, totalVat: 0,
        lines: [],
      });
      setIsLoading(false);
    }
  }, [uid, isEdit, fetchDoc]);

  useEffect(() => { fetchStations(); fetchSuppliers(); fetchMaterials(); fetchMeasures(); fetchCountries(); }, [fetchStations, fetchSuppliers, fetchMaterials, fetchMeasures, fetchCountries]);

  useEffect(() => {
    if (!showHistory || !doc?.uid || !isEdit) return;
    setHistoryLoading(true);
    AxiosService.get(ConstantInfo.restApiIncomingEventsByUid(doc.uid))
      .then(res => setHistoryEvents(res.data || []))
      .catch(e => console.error(e))
      .finally(() => setHistoryLoading(false));
  }, [showHistory, doc?.uid, isEdit]);

  const isNew = !doc?.code;
  const isDraft = doc?.status === 'DRAFT';
  const isClosed = doc?.status === 'CLOSED';
  const isCancelled = !!doc?.cancelled || doc?.status === 'CANCELLED';

  const canEditTop = !isCancelled && !isClosed && (isNew || isDraft);
  const canAddLine = canEditTop;
  const validLines = lines.filter(l => !!l.materialUid && typeof l.quantity === 'number' && l.quantity > 0);
  const canSave = canEditTop && !!stationUid && !!supplierUid && validLines.length > 0;
  const canPost = isDraft && !isNew && !isCancelled && validLines.length > 0;
  const canCancelDoc = !isNew && !isCancelled && isDraft;

  const titleText = (() => {
    const code = doc?.code != null ? String(doc.code).padStart(4, '0') : null;
    const dt = doc?.docDatetime ? formatDateWithSeconds(doc.docDatetime) : '';
    if (doc?.code && code) return `Документ: Поступление №${code} от ${dt}`;
    return 'Документ: Поступление (Создание)';
  })();

  const statusLabel = (() => {
    if (isCancelled) return 'Отменён';
    if (isNew) return 'Новый';
    return doc?.status ? (STATUS_LABELS[doc.status] || doc.status) : '';
  })();
  const statusColor = isCancelled ? '#FF3052' : isClosed ? '#00D664' : '#666EFE';

  const handleClose = () => { const t = tabs.find(tab => tab.id === activeTabId); if (t) closeTab(t.id); };
  const handleToggleHistory = () => setShowHistory(v => !v);

  const applyUpdatedDoc = (updated: DocIncoming) => {
    setDoc(updated);
    setStationUid(updated.stationUid || '');
    setStationName(updated.stationName || '');
    setSupplierUid(updated.supplierUid || '');
    setSupplierName(updated.supplierName || '');
    setResponsible(updated.responsible || '');
    setBaseDocument(updated.baseDocument || '');
    setContract(updated.contract || '');
    setPurchaseOrder(updated.purchaseOrder || '');
    setComment(updated.comment || '');
    setLines((updated.lines || []).map((l, i) => ({ ...l, uid: l.uid || `line_${i}` })));
    setSelectedIds(new Set());
  };

  const handleSave = async (): Promise<boolean> => {
    if (!canSave || isSaving) return false;
    if (!uid) return false;
    if (!stationUid) { alert('Выберите склад-получатель'); return false; }
    if (!supplierUid) { alert('Выберите поставщика'); return false; }
    if (validLines.length === 0) { alert('Добавьте хотя бы одну строку с номенклатурой и количеством больше 0'); return false; }

    setIsSaving(true);
    try {
      const payload = {
        uid,
        stationUid,
        supplierUid,
        responsible: responsible || null,
        baseDocument: baseDocument || null,
        contract: contract || null,
        purchaseOrder: purchaseOrder || null,
        comment: comment || null,
        createdByUserId: USER_ID,
        lines: validLines.map(l => ({
          uid: l.uid.startsWith('line_') ? null : l.uid,
          materialUid: l.materialUid,
          article: l.article ?? null,
          quantity: l.quantity,
          measureUid: l.measureUid ?? null,
          price: l.price ?? 0,
          sum: l.sum ?? 0,
          vatRate: l.vatRate ?? 0,
          vatAmount: l.vatAmount ?? 0,
          gtdRnptNumber: l.gtdRnptNumber ?? null,
          countryUid: l.countryUid ?? null,
        })),
      };

      let result: DocIncoming;
      if (isEdit) {
        const r = await AxiosService.patch(ConstantInfo.restApiIncomingUpdate(uid), payload);
        result = r.data as DocIncoming;
      } else {
        const r = await AxiosService.post(ConstantInfo.restApiIncomingCreate, payload);
        result = r.data as DocIncoming;
      }

      applyUpdatedDoc(result);

      if (!isEdit && result.uid && result.code != null && activeTabId) {
        const newPath = `/documents/incoming/edit/${result.uid}`;
        const newLabel = `Поступление: ${String(result.code).padStart(4, '0')}`;
        replaceTab(activeTabId, newPath, newLabel, <IncomingCreatePage />);
      }
      return true;
    } catch (e: any) {
      alert('Ошибка при сохранении: ' + (e?.response?.data?.message || e.message));
      return false;
    } finally { setIsSaving(false); }
  };

  const handlePost = async () => {
    if (!uid || isPosting) return;
    setIsPosting(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiIncomingPost(uid));
      applyUpdatedDoc(r.data as DocIncoming);
    } catch (e: any) { alert('Ошибка: ' + (e?.response?.data?.message || e.message)); }
    finally { setIsPosting(false); }
  };

  const handleCancel = async () => {
    if (!uid || isCancelling) return;
    setIsCancelling(true);
    try {
      const r = await AxiosService.post(ConstantInfo.restApiIncomingCancel(uid));
      applyUpdatedDoc(r.data as DocIncoming);
    } catch (e: any) { alert('Ошибка: ' + (e?.response?.data?.message || e.message)); }
    finally { setIsCancelling(false); }
  };

  const openDraftAdd = () => {
    if (!canAddLine) return;
    setDraftEditUid(null);
    setDMaterialUid(''); setDMaterialName(''); setDMaterialArticle(''); setDMaterialCode(null);
    setDArticle(''); setDQuantity(''); setDMeasureUid(''); setDMeasureName('');
    setDPrice(''); setDVatRate(''); setDGtd(''); setDCountryUid(''); setDCountryName('');
    setDraftOpen(true);
  };

  const openDraftEdit = (lineUid: string) => {
    if (!canAddLine) return;
    const l = lines.find(x => x.uid === lineUid);
    if (!l) return;
    setDraftEditUid(lineUid);
    setDMaterialUid(l.materialUid || ''); setDMaterialName(l.materialName || ''); setDMaterialArticle(l.materialArticle || ''); setDMaterialCode(l.materialCode ?? null);
    setDArticle(l.article || ''); setDQuantity(l.quantity ?? ''); setDMeasureUid(l.measureUid || ''); setDMeasureName(l.measureName || '');
    setDPrice(l.price ?? ''); setDVatRate(l.vatRate ?? ''); setDGtd(l.gtdRnptNumber || ''); setDCountryUid(l.countryUid || ''); setDCountryName(l.countryName || '');
    setDraftOpen(true);
  };

  const recalcDraft = () => {
    const q = typeof dQuantity === 'number' ? dQuantity : 0;
    const p = typeof dPrice === 'number' ? dPrice : 0;
    const r = typeof dVatRate === 'number' ? dVatRate : 0;
    const sum = q * p;
    const vat = sum * r / 100;
    return { sum, vat };
  };

  const handleDraftSave = () => {
    if (!dMaterialUid || typeof dQuantity !== 'number' || dQuantity <= 0) return;
    const { sum, vat } = recalcDraft();
    const line: IncomingLine = {
      uid: draftEditUid || `line_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      materialUid: dMaterialUid,
      materialName: dMaterialName || null,
      materialArticle: dMaterialArticle || null,
      materialCode: dMaterialCode,
      article: dArticle || dMaterialArticle || null,
      quantity: dQuantity,
      measureUid: dMeasureUid || null,
      measureName: dMeasureName || null,
      price: typeof dPrice === 'number' ? dPrice : 0,
      sum,
      vatRate: typeof dVatRate === 'number' ? dVatRate : 0,
      vatAmount: vat,
      gtdRnptNumber: dGtd || null,
      countryUid: dCountryUid || null,
      countryName: dCountryName || null,
    };
    if (draftEditUid) {
      setLines(prev => prev.map(x => x.uid === draftEditUid ? line : x));
    } else {
      setLines(prev => [...prev, line]);
    }
    setDraftOpen(false);
    setDraftEditUid(null);
  };

  const handleCleanSelected = () => {
    if (!canAddLine || selectedIds.size === 0) return;
    setLines(prev => prev.filter(l => !selectedIds.has(l.uid)));
    setSelectedIds(new Set());
  };

  const handleMaterialSelect = (uidMat: string, name: string) => {
    setDMaterialUid(uidMat); setDMaterialName(name);
    const found = materialOptions.find(m => m.uid === uidMat);
    if (found) { setDMaterialArticle(found.article || ''); setDMaterialCode(found.code ?? null); if (!dArticle) setDArticle(found.article || ''); }
  };

  const handleFullListSelect = (uidMat: string, name: string, item?: any) => {
    setShowMaterialFullList(false);
    setDMaterialUid(uidMat); setDMaterialName(name);
    setDMaterialArticle(item?.article || '');
    setDMaterialCode(extractCode(item));
    if (!dArticle) setDArticle(item?.article || '');
  };

  const renderCell = (key: string, item: IncomingLine): string => {
    const v = (item as any)[key];
    if (v === null || v === undefined || v === '') return '—';
    if (key === 'price' || key === 'sum' || key === 'vatAmount') {
      const n = Number(v);
      return Number.isFinite(n) ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v);
    }
    if (key === 'vatRate') { const n = Number(v); return Number.isFinite(n) ? `${n}%` : String(v); }
    return String(v);
  };

  const handleRowClick = (uidRow: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uidRow) ? n.delete(uidRow) : n.add(uidRow); return n; }); };
  const handleCheckboxClick = (uidRow: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(uidRow) ? n.delete(uidRow) : n.add(uidRow); return n; }); };
  const handleSelectAll = (e: React.MouseEvent) => { e.stopPropagation(); const all = lines.length > 0 && lines.every(l => selectedIds.has(l.uid)); all ? setSelectedIds(new Set()) : setSelectedIds(new Set(lines.map(l => l.uid))); };
  const handleDoubleClick = (uidRow: string) => openDraftEdit(uidRow);

  const rowContextMenuItems = useCallback((uidRow: string): ContextMenuItem[] => {
    return [
      { id: 'add', label: 'Добавить', icon: CreateIcon14Black, iconWidth: 14, iconHeight: 14, disabled: !canAddLine, onClick: () => openDraftAdd() },
      { id: 'edit', label: 'Редактировать', icon: DescriptionIcon18Black, iconWidth: 16, iconHeight: 16, disabled: !canAddLine, onClick: () => openDraftEdit(uidRow) },
      { id: 'clean', label: 'Очистить', icon: CleanIcon18Black, iconWidth: 18, iconHeight: 17, disabled: !canAddLine, onClick: () => { setLines(prev => prev.filter(l => l.uid !== uidRow)); setSelectedIds(prev => { const n = new Set(prev); n.delete(uidRow); return n; }); } },
      { id: 'cancel', label: 'Отменить', icon: CancelIcon16BlackOne, iconWidth: 16, iconHeight: 16, disabled: true, onClick: () => {} },
    ];
  }, [lines, canAddLine]);

  const manageItems: ContextMenuItem[] = [
    { id: 'cancel', label: 'Отменить', icon: CancelIcon16BlackOne, iconWidth: 16, iconHeight: 16, disabled: !canCancelDoc || isCancelling, onClick: () => { setManageOpen(false); handleCancel(); } },
    { id: 'post', label: 'Провести', icon: WriteIcon21Black, iconWidth: 18, iconHeight: 18, disabled: !canPost || isPosting, onClick: () => { setManageOpen(false); handlePost(); } },
  ];

  const filterRightEdge = PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 2 + PANEL_BTN_SIZE;

  const bottomBtnStyle = (active: boolean): React.CSSProperties => ({
    height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS,
    border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059',
    cursor: active ? 'pointer' : 'not-allowed', opacity: active ? 1 : 0.5,
  });

  return (
    <div style={{ position: 'relative', height: '100%', backgroundColor: '#FAFBFF', overflow: 'hidden' }}>
      {isLoading ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#9CA3AF' }}>Загрузка...</span>
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', top: TITLE_TOP, left: TITLE_LEFT, display: 'flex', alignItems: 'center', gap: TITLE_TO_STATUS_GAP, zIndex: 2 }}>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 500, color: '#2D4059', margin: 0, lineHeight: '29px', whiteSpace: 'nowrap' }}>{titleText}</h1>
            {statusLabel && (<span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: statusColor, lineHeight: '29px' }}>{statusLabel}</span>)}
          </div>

          <div ref={manageWrapRef} style={{ position: 'absolute', top: MANAGE_BTN_TOP, right: MANAGE_BTN_RIGHT, zIndex: 20 }}>
            <button onClick={(e) => { e.stopPropagation(); setManageOpen(v => !v); }} style={{ ...btnBaseStyle, width: MANAGE_BTN_W, height: MANAGE_BTN_H, borderRadius: MANAGE_BTN_RADIUS, border: 'none', backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', padding: 0 }}>
              <img src={DescriptionIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>Меню управления</span>
            </button>
            <AnimatePresence>
              {manageOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: MANAGE_BTN_H + MANAGE_MENU_GAP, right: 0, width: MANAGE_MENU_W, backgroundColor: '#FFFFFF', borderRadius: MANAGE_MENU_RADIUS, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', paddingTop: MANAGE_MENU_PAD, paddingBottom: MANAGE_MENU_PAD, zIndex: 30 }}>
                  {manageItems.map((item, idx) => (
                    <div key={item.id} onClick={() => { if (!item.disabled) item.onClick(); }}
                      style={{ height: MANAGE_MENU_ITEM_H, display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.4 : 1, borderBottom: idx < manageItems.length - 1 ? '1px solid rgba(45,64,89,0.06)' : 'none' }}
                      onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.backgroundColor = 'rgba(102,110,254,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      {item.icon && <img src={item.icon} alt="" style={{ width: item.iconWidth ?? 16, height: item.iconHeight ?? 16, marginRight: 15 }} />}
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>{item.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ position: 'absolute', top: HEADER_TOP, left: HEADER_LEFT, width: HEADER_W, height: HEADER_H, backgroundColor: '#FFFFFF', borderRadius: HEADER_RADIUS, boxSizing: 'border-box' }}>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW1, left: HEADER_FIELD_LEFT_FIRST }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Номер:" labelPosition="inside" icon={CodeIcon20Gray} iconActive={CodeIcon20Blue} value={doc?.code != null ? String(doc.code).padStart(4, '0') : ''} type="input" disabled iconWidth={20} iconHeight={14} />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW1, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="От:" labelPosition="inside" icon={CalendarIcon16Gray} value={doc?.docDatetime ? formatDateWithSeconds(doc.docDatetime) : ''} type="input" disabled iconWidth={16} iconHeight={18} />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW1, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 2 }}>
              <FormField
                width={HEADER_FIELD_W} height={HEADER_FIELD_H}
                label="Склад-получатель:"
                labelPosition="inside"
                icon={StationIcon16Gray} iconActive={StationIcon16Blue}
                value={stationName}
                placeholder="Выберите склад"
                type="select"
                disabled={!canEditTop}
                searchOptions={stationOptions}
                onSelectOption={(id, name) => { setStationUid(id); setStationName(name); }}
                selectIconWidth={16} selectIconHeight={16}
                searchTitle="Найденный склад"
                searchNotFoundText="Склады не найдены"
              />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW1, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 3 }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Поставщик:" labelPosition="inside" icon={StationIcon16Gray} iconActive={StationIcon16Blue} value={supplierName} placeholder="Выберите поставщика" type="select" disabled={!canEditTop} searchOptions={supplierOptions} onSelectOption={(id, name) => { setSupplierUid(id); setSupplierName(name); }} onOpenFullList={() => { if (canEditTop) setShowSupplierSelect(true); }} selectIconWidth={16} selectIconHeight={16} searchTitle="Найденный поставщик" searchNotFoundText="Поставщики не найдены" />
            </div>

            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW2, left: HEADER_FIELD_LEFT_FIRST }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Ответственный:" labelPosition="inside" value={responsible} placeholder="ФИО" type="input" disabled={!canEditTop} onChange={e => setResponsible(e.target.value)} />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW2, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Документ-основание:" labelPosition="inside" value={baseDocument} placeholder="Например, счёт-фактура" type="input" disabled={!canEditTop} onChange={e => setBaseDocument(e.target.value)} />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW2, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 2 }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Договор:" labelPosition="inside" value={contract} placeholder="Название договора" type="input" disabled={!canEditTop} onChange={e => setContract(e.target.value)} />
            </div>
            <div style={{ position: 'absolute', top: HEADER_FIELD_TOP_ROW2, left: HEADER_FIELD_LEFT_FIRST + (HEADER_FIELD_W + HEADER_FIELD_GAP) * 3 }}>
              <FormField width={HEADER_FIELD_W} height={HEADER_FIELD_H} label="Заказ на поставку:" labelPosition="inside" value={purchaseOrder} placeholder="Название заказа" type="input" disabled={!canEditTop} onChange={e => setPurchaseOrder(e.target.value)} />
            </div>

            <div style={{ position: 'absolute', bottom: BASE_INFO_BOTTOM, left: BASE_INFO_LEFT, display: 'flex', alignItems: 'center', gap: BASE_ICON_TO_TEXT }}>
              <img src={InfoIcon18Black} alt="" style={{ width: BASE_ICON_SIZE, height: BASE_ICON_SIZE, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Документ создан вручную. Приход извне на склад-получатель.</span>
            </div>
          </div>

          <div style={{ position: 'absolute', top: PANEL_TOP, left: 0, right: 0, height: PANEL_H, zIndex: 6 }}>
            <motion.div style={{ position: 'absolute', left: PANEL_LEFT, top: 0, height: PANEL_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: panel === 'search' ? '#666EFE' : '#FFFFFF', border: panel === 'search' ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden', zIndex: panel === 'search' ? 20 : 5 }}
              animate={{ width: panel === 'search' ? 280 : PANEL_BTN_SIZE }} transition={{ type: 'tween', duration: 0.2 }}>
              <div onClick={() => { if (panel === 'search') { setPanel(null); setSearchValue(''); } else { setPanel('search'); } }} style={{ width: PANEL_BTN_SIZE, height: PANEL_BTN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <img src={panel === 'search' ? SearchIcon18White : SearchIcon18Black} alt="" style={{ width: 18, height: 18 }} />
              </div>
              <AnimatePresence>
                {panel === 'search' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginRight: 12 }}>
                    <input autoFocus type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Поиск" style={{ width: '100%', height: 38, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFFFFF', backgroundColor: 'transparent' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div style={{ position: 'absolute', left: PANEL_LEFT + PANEL_BTN_SIZE + PANEL_BTN_GAP, top: 0, width: PANEL_BTN_SIZE, height: PANEL_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPanel(prev => prev === 'sort' ? null : 'sort')}>
              <img src={SortingIcon20Black} alt="" style={{ width: 20, height: 14 }} />
            </div>
            <div style={{ position: 'absolute', left: PANEL_LEFT + (PANEL_BTN_SIZE + PANEL_BTN_GAP) * 2, top: 0, width: PANEL_BTN_SIZE, height: PANEL_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPanel(prev => prev === 'filter' ? null : 'filter')}>
              <img src={FilterIcon18Black} alt="" style={{ width: 18, height: 18 }} />
            </div>

            <button onClick={openDraftAdd} disabled={!canAddLine} style={{ ...btnBaseStyle, position: 'absolute', left: filterRightEdge + ADD_BTN_AFTER_PANEL, top: 0, width: ADD_BTN_W, height: PANEL_H, borderRadius: ADD_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', paddingLeft: 18, paddingRight: 18, boxSizing: 'border-box', gap: 12, cursor: canAddLine ? 'pointer' : 'not-allowed', opacity: canAddLine ? 1 : 0.5, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#2D4059' }}>
              <img src={CreateIcon14Black} alt="" style={{ width: 14, height: 14 }} /><span>Добавить</span>
            </button>
            <button onClick={handleCleanSelected} disabled={!canAddLine || selectedIds.size === 0} style={{ ...btnBaseStyle, position: 'absolute', left: filterRightEdge + ADD_BTN_AFTER_PANEL + ADD_BTN_W + CLEAN_BTN_GAP, top: 0, width: CLEAN_BTN_SIZE, height: CLEAN_BTN_SIZE, borderRadius: PANEL_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (canAddLine && selectedIds.size > 0) ? 'pointer' : 'not-allowed', opacity: (canAddLine && selectedIds.size > 0) ? 1 : 0.5, padding: 0 }}>
              <img src={CleanIcon18Black} alt="" style={{ width: 18, height: 17 }} />
            </button>

            <div style={{ position: 'absolute', right: RIGHT_INSET, top: 0, display: 'flex', gap: RIGHT_BTN_GAP }}>
              <button style={{ ...btnBaseStyle, width: RIGHT_BTN_SIZE, height: RIGHT_BTN_SIZE, borderRadius: RIGHT_BTN_RADIUS, backgroundColor: showHistory ? '#666EFE' : '#FFFFFF', border: showHistory ? 'none' : '1px solid rgba(102, 110, 254, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="История" onClick={handleToggleHistory}><img src={showHistory ? HistoryIcon18White : HistoryIcon18Black} alt="" style={{ width: 18, height: 18 }} /></button>
            </div>
          </div>

          <div style={{ position: 'absolute', top: TABLE_TOP, left: TABLE_LEFT, width: TABLE_W, height: TABLE_H }}>
            <AnimatePresence initial={false} mode="wait">
              {showHistory ? (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 0, left: 0 }}>
                  <HistoryTable events={historyEvents} isLoading={historyLoading} tableWidth={TABLE_W} visibleRows={TABLE_VISIBLE_ROWS} />
                </motion.div>
              ) : (
                <motion.div key="lines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: 0, left: 0 }}>
                  <DataTable
                    columns={ALL_COLUMNS}
                    visibleKeys={ALL_COLUMNS.map(c => c.key)}
                    data={lines}
                    selectedIds={selectedIds}
                    onCheckboxClick={handleCheckboxClick}
                    onSelectAll={handleSelectAll}
                    onRowClick={handleRowClick}
                    onDoubleClick={handleDoubleClick}
                    renderCell={renderCell}
                    isGrayColumn={(key) => key !== 'materialName' && key !== 'article'}
                    tableWidth={TABLE_W}
                    rowHeight={TABLE_ROW_H}
                    headerHeight={TABLE_HEADER_H}
                    visibleRows={TABLE_VISIBLE_ROWS}
                    centerColumns={[]}
                    rowIcon={NomenclatureIcon16Black}
                    rowContextMenuItems={rowContextMenuItems}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ position: 'absolute', bottom: BOTTOM_BTN_BOTTOM, right: BOTTOM_BTN_RIGHT, display: 'flex', alignItems: 'center', gap: BOTTOM_BTN_GAP, zIndex: 10 }}>
            <div style={{ width: 220, height: BOTTOM_BTN_H, borderRadius: BOTTOM_BTN_RADIUS, backgroundColor: '#FFFFFF', border: '1px solid rgba(102, 110, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#A0A3BD' }}>
              Интерактивная форма
            </div>
            <button onClick={handlePost} disabled={!canPost || isPosting} style={{ ...bottomBtnStyle(canPost && !isPosting), width: BTN_POST_W }}>
              {isPosting ? 'Обработка...' : 'Провести'}
            </button>
            <button onClick={handleSave} disabled={!canSave || isSaving} style={{ ...bottomBtnStyle(canSave && !isSaving), width: BTN_SAVE_W, gap: 15 }}>
              <img src={WriteIcon21Black} alt="" style={{ width: 21, height: 21 }} /><span>{isSaving ? 'Сохранение...' : 'Записать'}</span>
            </button>
            <button onClick={handleClose} style={{ ...bottomBtnStyle(true), width: BTN_CLOSE_W }}>Закрыть</button>
          </div>

          {/* Инлайн-панель добавления/редактирования строки */}
          {draftOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10002, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setDraftOpen(false); setDraftEditUid(null); }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 900, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <h3 style={{ gridColumn: '1 / -1', margin: 0, fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 500, color: '#2D4059', textAlign: 'center' }}>
                  {draftEditUid ? 'Изменение строки поступления' : 'Добавление строки поступления'}
                </h3>

                <FormField width={400} height={50} label="Номенклатура:" labelPosition="inside" value={dMaterialName} placeholder="Выберите номенклатуру" type="select" searchOptions={materialOptions.map(m => ({ uid: m.uid, name: m.name }))} onSelectOption={handleMaterialSelect} onOpenFullList={() => setShowMaterialFullList(true)} searchTitle="Найденная номенклатура" searchNotFoundText="Номенклатура не найдена" />

                <FormField width={400} height={50} label="Артикул:" labelPosition="inside" value={dArticle} placeholder="Артикул" type="input" onChange={e => setDArticle(e.target.value)} />

                <FormField width={400} height={50} label="Количество:" labelPosition="inside" value={typeof dQuantity === 'number' ? String(dQuantity) : ''} placeholder="0" type="input" inputType="text" onChange={e => { const digits = e.target.value.replace(/[^0-9]/g, ''); setDQuantity(digits === '' ? '' : Number(digits)); }} />

                <FormField width={400} height={50} label="Ед. изм.:" labelPosition="inside" value={dMeasureName} placeholder="Выберите" type="select" searchOptions={measureOptions} onSelectOption={(id, name) => { setDMeasureUid(id); setDMeasureName(name); }} onOpenFullList={() => {}} searchTitle="Ед. изм." searchNotFoundText="Не найдено" />

                <FormField width={400} height={50} label="Цена:" labelPosition="inside" value={typeof dPrice === 'number' ? String(dPrice) : ''} placeholder="0.00" type="input" inputType="text" onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setDPrice(v === '' ? '' : Number(v)); }} />

                <FormField width={400} height={50} label="Ставка НДС, %:" labelPosition="inside" value={typeof dVatRate === 'number' ? String(dVatRate) : ''} placeholder="20" type="input" inputType="text" onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setDVatRate(v === '' ? '' : Number(v)); }} />

                <FormField width={400} height={50} label="ГТД / РНПТ:" labelPosition="inside" value={dGtd} placeholder="Номер" type="input" onChange={e => setDGtd(e.target.value)} />

                <FormField width={400} height={50} label="Страна:" labelPosition="inside" value={dCountryName} placeholder="Выберите страну" type="select" searchOptions={countryOptions} onSelectOption={(id, name) => { setDCountryUid(id); setDCountryName(name); }} onOpenFullList={() => {}} searchTitle="Страна" searchNotFoundText="Не найдено" />

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 15 }}>
                  <button onClick={handleDraftSave} disabled={!dMaterialUid || typeof dQuantity !== 'number' || dQuantity <= 0} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: 'none', backgroundColor: '#666EFE', color: '#FFFFFF', cursor: (!dMaterialUid || typeof dQuantity !== 'number' || dQuantity <= 0) ? 'not-allowed' : 'pointer', opacity: (!dMaterialUid || typeof dQuantity !== 'number' || dQuantity <= 0) ? 0.5 : 1, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500 }}>
                    {draftEditUid ? 'Сохранить' : 'Добавить'}
                  </button>
                  <button onClick={() => { setDraftOpen(false); setDraftEditUid(null); }} style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 10, border: '1px solid rgba(102,110,254,0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 400, color: '#2D4059' }}>Отмена</button>
                </div>
              </div>
            </div>
          )}

          <CatalogSelectPopup isOpen={showSupplierSelect} onClose={() => setShowSupplierSelect(false)} onSelect={(id: string, name: string) => { setSupplierUid(id); setSupplierName(name); setShowSupplierSelect(false); }} popupType="supplier" />
          <CatalogSelectPopup isOpen={showMaterialFullList} onClose={() => setShowMaterialFullList(false)} onSelect={handleFullListSelect} popupType="analogSelect" />
        </>
      )}
    </div>
  );
};

export default IncomingCreatePage;