// CellDetailsPopup.tsx — ПОЛНЫЙ ФАЙЛ (без createPortal, чтобы state сохранялся между вкладками)
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { useTabs } from '../../../context/TabContext';
import { motion } from 'framer-motion';
import FormField from '../../elements/FormField';
import CatalogSelectPopup from '../../../components/ReferencesPage/NomenclaturePage/CatalogSelectPopup';

import AccountingIcon16Blue from '../../../assets/Icons/AccountingIcons/AccountingIcon16Blue.svg';
import AccountingIcon16Gray from '../../../assets/Icons/AccountingIcons/AccountingIcon16Gray.svg';
import NomenclatureIcon16Blue from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Blue.svg';
import NomenclatureIcon16Gray from '../../../assets/Icons/NomenclatureIcons/NomenclatureIcon16Gray.svg';
import CodeIcon20Blue from '../../../assets/Icons/CodeIcons/CodeIcon20Blue.svg';
import CodeIcon20Gray from '../../../assets/Icons/CodeIcons/CodeIcon20Gray.svg';
import InfoIcon18Blue from '../../../assets/Icons/InfoIcons/InfoIcon18Blue.svg';

import ArticleIcon18Blue from '../../../assets/Icons/ArticleIcons/ArticleIcon18Blue.svg';
import ArticleIcon18Gray from '../../../assets/Icons/ArticleIcons/ArticleIcon18Gray.svg';
import ManyUsageIcon16Blue from '../../../assets/Icons/UsageIcons/ManyUsageIcon16Blue.svg';
import OneUsageIcon16Gray from '../../../assets/Icons/UsageIcons/OneUsageIcon16Gray.svg';
import TypeIcon16Blue from '../../../assets/Icons/TypeIcons/TypeIcon16Blue.svg';
import TypeIcon16Gray from '../../../assets/Icons/TypeIcons/TypeIcon16Gray.svg';
import SKUIcon20Blue from '../../../assets/Icons/SKUIcons/SKUIcon20Blue.svg';
import SKUIcon20Gray from '../../../assets/Icons/SKUIcons/SKUIcon20Gray.svg';
import ReleaseIcon10Blue from '../../../assets/Icons/ReleaseIcons/ReleaseIcon10Blue.svg';
import ReleaseIcon10Gray from '../../../assets/Icons/ReleaseIcons/ReleaseIcon10Gray.svg';

import LinkIcons14Blue from '../../../assets/Icons/LinkIcons/LinkIcons14Blue.svg';
import WriteIcon20White from '../../../assets/Icons/WriteIcons/WriteIcon20White.svg';

import CellTypeIcon57Red from '../../../assets/Icons/CellTypeIcons/CellTypeIcon57Red.svg';
import CellTypeIcon200Red from '../../../assets/Icons/CellTypeIcons/CellTypeIcon200Red.svg';
import CellTypeIcon87Purple from '../../../assets/Icons/CellTypeIcons/CellTypeIcon87Purple.svg';
import CellTypeIcon200Purple from '../../../assets/Icons/CellTypeIcons/CellTypeIcon200Purple.svg';
import CellTypeIcon200Black from '../../../assets/Icons/CellTypeIcons/CellTypeIcon200Black.svg';
import CellTypeIcon62Green from '../../../assets/Icons/CellTypeIcons/CellTypeIcon62Green.svg';
import CellTypeIcon62Red from '../../../assets/Icons/CellTypeIcons/CellTypeIcon62Red.svg';
import CellTypeIcon89Yellow from '../../../assets/Icons/CellTypeIcons/CellTypeIcon89Yellow.svg';

interface CellAssignment {
  uid: string;
  name: string;
  typeUid: string | null;
  typeName: string | null;
}

interface CellData {
  uid?: string;
  numberCell?: number;
  columnNumber?: number;
  drumNumber?: number;
  cellAssignmentUid?: string | null;
  cellAssignmentName?: string | null;
  cellAssignmentTypeUid?: string | null;
  cellAssignmentTypeName?: string | null;
  materialUid?: string | null;
  materialName?: string | null;
  materialArticle?: string | null;
  quantity?: number | null;
  returnToThisCell?: boolean | null;
  isIndividual?: boolean | null;
}

interface CellDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cellId: number;
  cellName: string;
  selectedColumn: number;
  selectedDrum: number;
  cellData?: CellData | null;
  onSaved: (updated: CellData | null, key: { numberCell: number; columnNumber: number; drumNumber: number }) => void;
  stationUid?: string | null;
  stationName?: string | null;
  isTmc?: boolean;
  isSgd?: boolean;
  getOtherQuantityForMaterial?: (materialUid: string, excludeKey?: { numberCell: number; columnNumber: number; drumNumber: number }) => number;
}

interface MaterialDetail {
  uid: string;
  nameMaterial: string;
  article: string;
  codeMaterial: number | null;
  sku: string | null;
  releaseName: string | null;
  typeProductName: string | null;
  usage: boolean | null;
  imageUrl: string | null;
}

interface StockLevelReg {
  uid: string;
  stationUid: string | null;
  materialUid: string | null;
  minStock: number | null;
  criticalStock: number | null;
}

interface RawMaterialOption {
  uid: string;
  name: string;
  typeMaterialName: string;
}

const ToggleSwitch = React.memo(({ value, onChange }: { value: boolean; onChange: () => void }) => {
  const trackWidth = 26; const trackHeight = 13; const knobSize = 11; const padding = (trackHeight - knobSize) / 2;
  return (
    <div onClick={(e) => { e.stopPropagation(); onChange(); }} style={{ width: trackWidth, height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: value ? '#666EFE' : 'rgba(45, 64, 89, 0.44)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background-color 0.3s ease' }}>
      <motion.div initial={false} animate={{ x: value ? trackWidth - knobSize - padding * 2 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }} style={{ width: knobSize, height: knobSize, borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: padding, left: padding }} />
    </div>
  );
});

const sanitizeQuantity = (raw: string): number => {
  if (raw === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  const int = Math.floor(n);
  if (int < 0) return 0;
  return int;
};

const CellDetailsPopup: React.FC<CellDetailsPopupProps> = ({
  isOpen, onClose, cellId, cellName, selectedColumn, selectedDrum, cellData, onSaved,
  stationUid, stationName, isTmc: stationIsTmc, isSgd: stationIsSgd, getOtherQuantityForMaterial,
}) => {
  const { openTab } = useTabs();

  const [assignments, setAssignments] = useState<CellAssignment[]>([]);
  const [cellAssignmentUid, setCellAssignmentUid] = useState<string>('');

  const [returnToThisCell, setReturnToThisCell] = useState(false);
  const [individualCell, setIndividualCell] = useState(false);

  const [selectedMaterialUid, setSelectedMaterialUid] = useState<string>('');
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>('');
  const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [showCatalog, setShowCatalog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);

  const [rawMaterialOptions, setRawMaterialOptions] = useState<RawMaterialOption[]>([]);

  const [regLoading, setRegLoading] = useState(false);
  const [regData, setRegData] = useState<StockLevelReg | null>(null);
  const [regLoaded, setRegLoaded] = useState(false);

  // === Ключ, по которому инициализируется состояние попапа ===
  // Пока этот ключ не меняется — useEffect не перезаписывает локальные правки.
  // Меняется только при открытии новой ячейки или при изменении cellData с бэка.
  const initializedKeyRef = useRef<string>('');

  const materialDetailRef = useRef<MaterialDetail | null>(null);
  const selectedMaterialUidRef = useRef<string>('');
  useEffect(() => { materialDetailRef.current = materialDetail; }, [materialDetail]);
  useEffect(() => { selectedMaterialUidRef.current = selectedMaterialUid; }, [selectedMaterialUid]);

  const title = `Выбранная ячейка: ${selectedColumn} - ${cellId}`;

  useEffect(() => {
    if (!isOpen) return;
    if (assignments.length > 0) return;
    AxiosService.get(ConstantInfo.restApiCellAssignments)
      .then(res => {
        const list = (res.data || []) as CellAssignment[];
        setAssignments(list);
      })
      .catch(e => console.error('Ошибка загрузки назначений:', e));
  }, [isOpen]);

  const filteredAssignments = useMemo(() => {
    if (!stationIsTmc && !stationIsSgd) return assignments;
    return assignments.filter(a => {
      if (a.typeName === 'ТМЦ' && stationIsTmc) return true;
      if (a.typeName === 'Готовая деталь' && stationIsSgd) return true;
      return false;
    });
  }, [assignments, stationIsTmc, stationIsSgd]);

  const assignmentExpandOptions = useMemo(
    () => filteredAssignments.map(a => ({ uid: a.uid, name: a.name })),
    [filteredAssignments]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (rawMaterialOptions.length > 0) return;

    const loadMaterials = async () => {
      try {
        const res = await AxiosService.get(ConstantInfo.restApiNomenclatureTree);
        const flat: RawMaterialOption[] = [];
        const walk = (nodes: any[]) => {
          nodes.forEach((n: any) => {
            if (n.materials && Array.isArray(n.materials)) {
              n.materials.forEach((m: any) => {
                const typeMaterialName =
                  m.typeMaterialName
                  || m.typeMainName
                  || m.typeMaterialTypeName
                  || m.typeName
                  || '';
                flat.push({
                  uid: m.uid,
                  name: m.name || m.nameMaterial || 'Без названия',
                  typeMaterialName,
                });
              });
            }
            if (n.children && Array.isArray(n.children)) walk(n.children);
          });
        };
        walk(res.data || []);
        setRawMaterialOptions(flat);
      } catch (e) {
        console.error('Ошибка загрузки списка номенклатуры для поиска:', e);
      }
    };
    loadMaterials();
  }, [isOpen, rawMaterialOptions.length]);

  // === Инициализация состояния попапа ===
  // Срабатывает только когда меняется ключ (cellId/column/drum). Если попап остаётся
  // открытым и мы просто переключаем вкладку — useEffect не сработает повторно,
  // и локальные правки сохранятся.
  useEffect(() => {
    if (!isOpen) return;

    const key = `${cellId}-${selectedColumn}-${selectedDrum}`;
    if (initializedKeyRef.current === key) return;
    initializedKeyRef.current = key;

    setCellAssignmentUid(cellData?.cellAssignmentUid || '');
    setReturnToThisCell(cellData?.returnToThisCell === true);
    setIndividualCell(cellData?.isIndividual === true);

    if (cellData?.materialUid) {
      setSelectedMaterialUid(cellData.materialUid);
      selectedMaterialUidRef.current = cellData.materialUid;
      setSelectedMaterialName(cellData.materialName || '');
      setIsLoading(true);
      loadMaterialDetail(cellData.materialUid).then(detail => {
        if (detail?.usage === true) setQuantity(1);
        else setQuantity(sanitizeQuantity(String(cellData.quantity ?? 0)));
      }).finally(() => setIsLoading(false));
    } else {
      setSelectedMaterialUid('');
      selectedMaterialUidRef.current = '';
      setSelectedMaterialName('');
      setMaterialDetail(null);
      materialDetailRef.current = null;
      setQuantity(0);
    }
    setShowCatalog(false);
    setIsLoading(false);
    setFullscreenImage(false);
  }, [isOpen, cellId, selectedColumn, selectedDrum, cellData]);

  const loadMaterialDetail = useCallback(async (uid: string): Promise<MaterialDetail | null> => {
    try {
      const res = await AxiosService.get(ConstantInfo.restApiNomenclatureGetMaterial(uid));
      const data = res.data;

      let imageUrl: string | null = null;
      try {
        const imagesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureImages(uid));
        const images = imagesRes.data || [];
        if (images.length > 0) {
          imageUrl = `${ConstantInfo.fileDir}uploads/nomenclature/${uid}/${images[0].filePath}`;
        }
      } catch {}

      let skuValue: string | null = null;
      let codeValue: number | null = data.codeMaterial ?? data.code ?? null;
      try {
        const codesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid));
        const codes = (codesRes.data || []) as Array<{ codeKind: string; codeValue: string }>;
        const skuCode = codes.find(c => c.codeKind === 'SKU');
        if (skuCode) skuValue = skuCode.codeValue || null;
        const codeEntry = codes.find(c => c.codeKind === 'CODE');
        if (codeEntry && codeEntry.codeValue) {
          const parsed = Number(codeEntry.codeValue);
          if (!Number.isNaN(parsed)) codeValue = parsed;
        }
      } catch {}

      const detail: MaterialDetail = {
        uid: data.uid,
        nameMaterial: data.nameMaterial || data.name || data.materialName || '',
        article: data.article || '',
        codeMaterial: codeValue,
        sku: skuValue,
        releaseName: data.releaseName || data.release || null,
        typeProductName: data.typeProductName ?? null,
        usage: typeof data.usage === 'boolean' ? data.usage : null,
        imageUrl,
      };
      setMaterialDetail(detail);
      materialDetailRef.current = detail;
      return detail;
    } catch (e) {
      console.error('Ошибка загрузки материала:', e);
      return null;
    }
  }, []);

  const loadReg = useCallback(async (materialUid: string) => {
    if (!stationUid || !materialUid) {
      setRegData(null);
      setRegLoaded(false);
      return;
    }
    setRegLoading(true);
    try {
      const res = await AxiosService.get(ConstantInfo.restApiStockLevelControlReg(stationUid, materialUid));
      setRegData(res.data || null);
      setRegLoaded(true);
    } catch (e) {
      console.error('Ошибка загрузки регистра остатков:', e);
      setRegData(null);
      setRegLoaded(true);
    } finally {
      setRegLoading(false);
    }
  }, [stationUid]);

  useEffect(() => {
    if (!isOpen) return;
    if (!stationUid) { setRegData(null); setRegLoaded(false); return; }
    if (selectedMaterialUid) {
      loadReg(selectedMaterialUid);
    } else {
      setRegData(null);
      setRegLoaded(false);
    }
  }, [isOpen, stationUid, selectedMaterialUid, loadReg]);

  const handleSelectMaterial = async (uid: string, name: string) => {
    setIsLoading(true);
    setSelectedMaterialUid(uid);
    selectedMaterialUidRef.current = uid;
    setSelectedMaterialName(name);
    setShowCatalog(false);
    const detail = await loadMaterialDetail(uid);
    if (detail?.usage === true) setQuantity(1);
    setIsLoading(false);
  };

  const handleSelectMaterialFromSearch = (uid: string, name: string) => {
    handleSelectMaterial(uid, name);
  };

  const handleAssignmentChange = (newUid: string) => {
    if (newUid !== cellAssignmentUid) {
      setSelectedMaterialUid('');
      selectedMaterialUidRef.current = '';
      setSelectedMaterialName('');
      setMaterialDetail(null);
      materialDetailRef.current = null;
      setQuantity(0);
      setReturnToThisCell(false);
      setIndividualCell(false);
      setRegData(null);
      setRegLoaded(false);
    }
    setCellAssignmentUid(newUid);
  };

  const currentAssignment = filteredAssignments.find(a => a.uid === cellAssignmentUid)
    || assignments.find(a => a.uid === cellAssignmentUid)
    || null;
  const currentAssignmentName = currentAssignment?.name || '';
  const assignmentTypeName = currentAssignment?.typeName || null;

  const isTmcAssignment = assignmentTypeName === 'ТМЦ';
  const isReadyDetail = assignmentTypeName === 'Готовая деталь';
  const isLom = currentAssignmentName === 'Лом';
  const isBrak = currentAssignmentName === 'Возврат брака ТМЦ';
  const isPeretochka = currentAssignmentName === 'Инструмент на переточку';
  const isReadyDetailFromProduction = currentAssignmentName === 'Готовая деталь (с производства)';
  const isReadyDetailPassed = currentAssignmentName === 'Готовая деталь (контроль качества пройден)';
  const isReadyDetailFailed = currentAssignmentName === 'Готовая деталь (контроль качества не пройден)';

  const showIndividualToggle = isBrak || isPeretochka;
  const showNomenclatureFields =
    (isTmcAssignment && !isLom && (!showIndividualToggle || individualCell))
    || isReadyDetail;
  const showReturnToggle = currentAssignmentName === 'ТМЦ' && materialDetail?.usage === true;

  const showRightPart = !!cellAssignmentUid;

  const isMultiUsage = materialDetail?.usage === true;
  const isSingleUsage = materialDetail?.usage === false;

  const nomenclatureTypeFilter: 'ТМЦ' | 'Готовая деталь' | undefined =
    isTmcAssignment ? 'ТМЦ'
    : isReadyDetail ? 'Готовая деталь'
    : undefined;

  const materialSearchOptions = useMemo(() => {
    if (!nomenclatureTypeFilter) {
      return rawMaterialOptions.map(m => ({ uid: m.uid, name: m.name }));
    }
    return rawMaterialOptions
      .filter(m => m.typeMaterialName === nomenclatureTypeFilter)
      .map(m => ({ uid: m.uid, name: m.name }));
  }, [rawMaterialOptions, nomenclatureTypeFilter]);

  const otherQty = (selectedMaterialUid && getOtherQuantityForMaterial)
    ? getOtherQuantityForMaterial(selectedMaterialUid, {
        numberCell: cellId,
        columnNumber: selectedColumn,
        drumNumber: selectedDrum,
      })
    : 0;
  const totalQty = otherQty + (Number(quantity) || 0);

  const minStock = regData?.minStock ?? null;
  const hasReg = !!regData;
  const needToAdd = minStock != null ? Math.max(0, minStock - totalQty) : 0;
  const needInfo = hasReg && minStock != null && totalQty < minStock;

  const requiresNomenclature = showNomenclatureFields;
  const quantityIsRequired = showNomenclatureFields;
  const quantityIsEmpty = quantity <= 0;

  const isSaveDisabled =
    (requiresNomenclature && !selectedMaterialUid) ||
    (quantityIsRequired && quantityIsEmpty);

  const handleOpenCreateDocument = () => {
    if (!stationUid || !selectedMaterialUid) return;

    let newUid: string;
    try {
      newUid = crypto.randomUUID();
    } catch {
      newUid = 'uid-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }

    const params = new URLSearchParams();
    params.set('stationUid', stationUid);
    if (stationName) params.set('stationName', stationName);
    params.set('materialUid', selectedMaterialUid);
    const detail = materialDetailRef.current;
    if (detail?.nameMaterial) params.set('materialName', detail.nameMaterial);
    if (detail?.article) params.set('materialArticle', detail.article);

    const path = `/documents/stock-level-control/create/${newUid}?${params.toString()}`;
    openTab(path, 'Контроль остатков (новый)', null);
    // onClose() не вызываем — попап остаётся открытым и с сохранённым состоянием.
  };

  const handleSave = () => {
    if (isSaveDisabled) return;

    const key = { numberCell: cellId, columnNumber: selectedColumn, drumNumber: selectedDrum };
    const uid = selectedMaterialUidRef.current;
    const detail = materialDetailRef.current;

    if (isLom) {
      onSaved({
        cellAssignmentUid: cellAssignmentUid || null,
        cellAssignmentName: currentAssignmentName || null,
        cellAssignmentTypeUid: currentAssignment?.typeUid || null,
        cellAssignmentTypeName: currentAssignment?.typeName || null,
        materialUid: null, materialName: null, materialArticle: null, quantity: null,
        returnToThisCell: false, isIndividual: false,
      }, key);
      onClose();
      return;
    }

    if (showNomenclatureFields && uid) {
      const safeQuantity = sanitizeQuantity(String(quantity));
      onSaved({
        cellAssignmentUid: cellAssignmentUid || null,
        cellAssignmentName: currentAssignmentName || null,
        cellAssignmentTypeUid: currentAssignment?.typeUid || null,
        cellAssignmentTypeName: currentAssignment?.typeName || null,
        materialUid: uid,
        materialName: detail?.nameMaterial || '',
        materialArticle: detail?.article || '',
        quantity: detail?.usage === true ? 1 : safeQuantity,
        returnToThisCell: returnToThisCell,
        isIndividual: showIndividualToggle ? individualCell : false,
      }, key);
    } else if (cellData?.materialUid || cellData?.cellAssignmentUid) {
      if (!cellAssignmentUid) { onSaved(null, key); }
      else {
        onSaved({
          cellAssignmentUid, cellAssignmentName: currentAssignmentName || null,
          cellAssignmentTypeUid: currentAssignment?.typeUid || null, cellAssignmentTypeName: currentAssignment?.typeName || null,
          materialUid: null, materialName: null, materialArticle: null, quantity: null,
          returnToThisCell: false, isIndividual: showIndividualToggle ? individualCell : false,
        }, key);
      }
    } else if (cellAssignmentUid) {
      onSaved({
        cellAssignmentUid, cellAssignmentName: currentAssignmentName || null,
        cellAssignmentTypeUid: currentAssignment?.typeUid || null, cellAssignmentTypeName: currentAssignment?.typeName || null,
        materialUid: null, materialName: null, materialArticle: null, quantity: null,
        returnToThisCell: false, isIndividual: showIndividualToggle ? individualCell : false,
      }, key);
    }
    onClose();
  };

  const handleCancel = () => onClose();

  const handleOpenNomenclatureCard = () => {
    const uid = selectedMaterialUidRef.current;
    const detail = materialDetailRef.current;
    if (!uid) return;
    const code = detail?.codeMaterial ?? 0;
    openTab(`/references/nomenclature/edit/${uid}/${code}`, `Номенклатура: ${detail?.nameMaterial || uid}`, null);
    // onClose() тоже не вызываем — попап сохраняется.
  };

  const renderImageBlock = () => {
    const BOX = 200;
    const EMPTY_BORDER = '1px solid #E6E8F8';
    const EMPTY_BG = '#FFFFFF';
    const ACTIVE_BORDER = '1px solid #666EFE';

    if (isLom) {
      return (
        <div style={{ width: BOX, height: BOX, borderRadius: 14, backgroundColor: EMPTY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <img src={CellTypeIcon200Black} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      );
    }

    if (isPeretochka) {
      if (!individualCell) {
        return (
          <div style={{ width: BOX, height: BOX, borderRadius: 14, backgroundColor: EMPTY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src={CellTypeIcon200Purple} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        );
      }
      const hasImage = !!materialDetail?.imageUrl;
      return (
        <div style={{ width: BOX, height: BOX, borderRadius: 14, border: hasImage ? ACTIVE_BORDER : EMPTY_BORDER, backgroundColor: EMPTY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative', cursor: hasImage ? 'pointer' : 'default' }}
          onClick={(e) => { e.stopPropagation(); if (hasImage) setFullscreenImage(true); }}>
          {hasImage ? (
            <img src={materialDetail!.imageUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: '#A0A3BD' }}>Нет изображения</span>
          )}
          <img src={CellTypeIcon87Purple} alt="" style={{ position: 'absolute', top: 12, right: 12, width: 87, height: 23, pointerEvents: 'none' }} />
        </div>
      );
    }

    if (isBrak) {
      if (!individualCell) {
        return (
          <div style={{ width: BOX, height: BOX, borderRadius: 14, backgroundColor: EMPTY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src={CellTypeIcon200Red} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        );
      }
      const hasImage = !!materialDetail?.imageUrl;
      return (
        <div style={{ width: BOX, height: BOX, borderRadius: 14, border: hasImage ? ACTIVE_BORDER : EMPTY_BORDER, backgroundColor: EMPTY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative', cursor: hasImage ? 'pointer' : 'default' }}
          onClick={(e) => { e.stopPropagation(); if (hasImage) setFullscreenImage(true); }}>
          {hasImage ? (
            <img src={materialDetail!.imageUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: '#A0A3BD' }}>Нет изображения</span>
          )}
          <img src={CellTypeIcon57Red} alt="" style={{ position: 'absolute', top: 12, right: 12, width: 57, height: 23, pointerEvents: 'none' }} />
        </div>
      );
    }

    if (isReadyDetail) {
      let icon = CellTypeIcon62Green;
      if (isReadyDetailFromProduction) icon = CellTypeIcon89Yellow;
      else if (isReadyDetailFailed) icon = CellTypeIcon62Red;
      else if (isReadyDetailPassed) icon = CellTypeIcon62Green;

      const isProduction = isReadyDetailFromProduction;
      const iconW = isProduction ? 89 : 62;
      const iconH = isProduction ? 38 : 53;
      const iconOffsetTop = isProduction ? 10 : 6;
      const iconOffsetRight = isProduction ? 10 : 6;

      const hasImage = !!materialDetail?.imageUrl;

      return (
        <div style={{ width: BOX, height: BOX, borderRadius: 14, border: hasImage ? ACTIVE_BORDER : EMPTY_BORDER, backgroundColor: EMPTY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative', cursor: hasImage ? 'pointer' : 'default' }}
          onClick={(e) => { e.stopPropagation(); if (hasImage) setFullscreenImage(true); }}>
          {hasImage ? (
            <img src={materialDetail!.imageUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: '#A0A3BD' }}>Нет изображения</span>
          )}
          <img src={icon} alt="" style={{ position: 'absolute', top: iconOffsetTop, right: iconOffsetRight, width: iconW, height: iconH, pointerEvents: 'none' }} />
        </div>
      );
    }

    const hasImage = !!materialDetail?.imageUrl;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); if (hasImage) setFullscreenImage(true); }}
        style={{
          width: BOX, height: BOX, borderRadius: 14,
          border: hasImage ? ACTIVE_BORDER : EMPTY_BORDER,
          backgroundColor: EMPTY_BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          cursor: hasImage ? 'pointer' : 'default',
        }}
      >
        {hasImage ? (
          <img src={materialDetail!.imageUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14, color: '#A0A3BD' }}>Нет изображения</span>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const POPUP_W = 1052;
  const POPUP_H = 602;

  const LEFT_OFFSET = 40;
  const LEFT_TOP = 89;
  const FIELD_WIDTH = 446;
  const FIELD_HEIGHT = 44;
  const LABEL_HEIGHT = 17;
  const LABEL_TO_FIELD = 11;
  const FIELD_TO_FIELD = 25;
  const EXTRA_GAP = 30;

  const posAssignmentLabel = LEFT_TOP;
  const posAssignmentField = posAssignmentLabel + LABEL_HEIGHT + LABEL_TO_FIELD;

  const posIndividualRow = posAssignmentField + FIELD_HEIGHT + EXTRA_GAP;
  const individualRowHeight = 18;

  const posNomenclatureLabelBase = posAssignmentField + FIELD_HEIGHT + FIELD_TO_FIELD;
  const posNomenclatureLabel =
    (showIndividualToggle && individualCell)
      ? posIndividualRow + individualRowHeight + EXTRA_GAP
      : posNomenclatureLabelBase;

  const posNomenclatureField = posNomenclatureLabel + LABEL_HEIGHT + LABEL_TO_FIELD;
  const posQuantityLabel = posNomenclatureField + FIELD_HEIGHT + FIELD_TO_FIELD;
  const posQuantityField = posQuantityLabel + LABEL_HEIGHT + LABEL_TO_FIELD;
  const posReturnToggle = posQuantityField + FIELD_HEIGHT + 30;

  const infoOffset = (showIndividualToggle && individualCell) ? 40 : (isMultiUsage ? 80 : 40);
  const posInfoTop = posQuantityField + FIELD_HEIGHT + infoOffset;

  const POS_NOTSET_TOP = posInfoTop;

  const POS_INFO_TEXT_TOP = LABEL_HEIGHT + 15;
  const POS_INFO_TEXT_LEFT = 76;

  const INFO_ICON_LEFT = 40;
  const INFO_TEXT_LEFT = 66;

  const RIGHT_TOP = 89;
  const RIGHT_LEFT = POPUP_W / 2 + 40;
  const RIGHT_FIELD_W = 216;
  const RIGHT_FIELD_H = 44;

  const posCodeLabel = RIGHT_TOP;
  const posCodeField = posCodeLabel + LABEL_HEIGHT + LABEL_TO_FIELD;
  const posArticleLabel = posCodeField + RIGHT_FIELD_H + FIELD_TO_FIELD;
  const posArticleField = posArticleLabel + LABEL_HEIGHT + LABEL_TO_FIELD;
  const posUsageLabel = posArticleField + RIGHT_FIELD_H + FIELD_TO_FIELD;
  const posUsageField = posUsageLabel + LABEL_HEIGHT + LABEL_TO_FIELD;
  const posTypeLabel = posUsageField + RIGHT_FIELD_H + FIELD_TO_FIELD;
  const posTypeField = posTypeLabel + LABEL_HEIGHT + LABEL_TO_FIELD;

  const IMAGE_COL_LEFT = RIGHT_LEFT + RIGHT_FIELD_W + 30;
  const posImageLabel = posCodeLabel;
  const posImageField = posImageLabel + LABEL_HEIGHT + 11;

  const CARD_BTN_W = 200;
  const CARD_BTN_H = 38;
  const IMAGE_FIELD_H = 200;
  const posCardButton = posImageField + IMAGE_FIELD_H + 30;

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: '#2D4059',
    lineHeight: `${LABEL_HEIGHT}px`,
    display: 'block',
  };

  const codeValue = materialDetail?.codeMaterial != null ? String(materialDetail.codeMaterial).padStart(4, '0') : '';
  const articleValue = materialDetail?.article || '';
  const usageValue = materialDetail?.usage === true ? 'Многоразовое' : materialDetail?.usage === false ? 'Одноразовое' : '';
  const skuValue = materialDetail?.sku || '';
  const typeValue = materialDetail?.typeProductName || '';
  const releaseValue = materialDetail?.releaseName || '';

  const usageIcon = materialDetail?.usage === true ? ManyUsageIcon16Blue : OneUsageIcon16Gray;

  const showNomenclatureCardButton =
    !!selectedMaterialUid &&
    !isLom &&
    (isTmcAssignment || isReadyDetail || (showIndividualToggle && individualCell));

  const showKuoBlock = !!stationUid;

  const quantityFieldValue = isMultiUsage ? '1' : (quantity > 0 ? String(quantity) : '');
  const quantityFieldIcon = quantity > 0 ? CodeIcon20Blue : CodeIcon20Gray;
  const quantityFieldIconActive = CodeIcon20Blue;

  const content = (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div style={{ width: `${POPUP_W}px`, height: `${POPUP_H}px`, backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', position: 'relative' }}>

          <div style={{ position: 'absolute', top: 30, left: 0, right: 0, height: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: '#2D4059', lineHeight: '19px' }}>{title}</span>
          </div>

          <div style={{ position: 'absolute', top: 79, left: '50%', transform: 'translateX(-50%)', width: '1px', height: '493px', backgroundColor: 'rgba(160, 163, 189, 0.2)' }} />

          {/* ЛЕВАЯ ЧАСТЬ */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%' }}>

            <div style={{ position: 'absolute', top: posAssignmentLabel, left: LEFT_OFFSET }}>
              <span style={labelStyle}>Назначение ячейки:</span>
            </div>
            <div style={{ position: 'absolute', top: posAssignmentField, left: LEFT_OFFSET }}>
              <FormField
                width={FIELD_WIDTH}
                height={FIELD_HEIGHT}
                value={currentAssignmentName}
                placeholder="Выберите назначение"
                type="expand"
                icon={AccountingIcon16Gray}
                iconActive={AccountingIcon16Blue}
                selectIconWidth={16}
                selectIconHeight={16}
                expandOptions={assignmentExpandOptions}
                onSelectOption={(uid) => handleAssignmentChange(uid)}
                labelMarginBottom={LABEL_TO_FIELD}
              />
            </div>

            {showIndividualToggle && (
              <div style={{ position: 'absolute', top: posIndividualRow, left: 0, height: individualRowHeight, display: 'flex', alignItems: 'center' }}>
                <img
                  src={InfoIcon18Blue}
                  alt=""
                  style={{ width: 18, height: 18, position: 'absolute', left: INFO_ICON_LEFT, top: '50%', transform: 'translateY(-50%)' }}
                />
                <div style={{ marginLeft: INFO_TEXT_LEFT, display: 'flex', alignItems: 'center', height: individualRowHeight }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 15, color: '#2D4059', lineHeight: `${individualRowHeight}px` }}>
                    Под каждую номенклатуру индивидуальная ячейка
                  </span>
                  <div style={{ marginLeft: 18 }}>
                    <ToggleSwitch value={individualCell} onChange={() => setIndividualCell(!individualCell)} />
                  </div>
                </div>
              </div>
            )}

            {showNomenclatureFields && (
              <>
                <div style={{ position: 'absolute', top: posNomenclatureLabel, left: LEFT_OFFSET }}>
                  <FormField
                    width={FIELD_WIDTH}
                    height={FIELD_HEIGHT}
                    label="Номенклатура:"
                    value={selectedMaterialName}
                    placeholder="Выберите номенклатуру"
                    type="select"
                    icon={NomenclatureIcon16Gray}
                    iconActive={NomenclatureIcon16Blue}
                    selectIconWidth={16}
                    selectIconHeight={18}
                    searchOptions={materialSearchOptions}
                    onSelectOption={handleSelectMaterialFromSearch}
                    onOpenFullList={() => setShowCatalog(true)}
                    searchTitle="Найденная номенклатура"
                    searchNotFoundText="Номенклатура не найдена"
                    labelMarginBottom={LABEL_TO_FIELD}
                  />
                </div>

                <div style={{ position: 'absolute', top: posQuantityLabel, left: LEFT_OFFSET }}>
                  <FormField
                    width={FIELD_WIDTH}
                    height={FIELD_HEIGHT}
                    label="Количество в ячейке:"
                    value={quantityFieldValue}
                    placeholder="0"
                    type="input"
                    inputType="number"
                    disabled={isMultiUsage}
                    icon={quantityFieldIcon}
                    iconActive={quantityFieldIconActive}
                    iconWidth={20}
                    iconHeight={14}
                    onChange={e => setQuantity(sanitizeQuantity(e.target.value))}
                    labelMarginBottom={LABEL_TO_FIELD}
                  />
                </div>

                {showReturnToggle && (
                  <div style={{ position: 'absolute', top: posReturnToggle, left: 0, height: 18, display: 'flex', alignItems: 'center' }}>
                    <img
                      src={InfoIcon18Blue}
                      alt=""
                      style={{ width: 18, height: 18, position: 'absolute', left: INFO_ICON_LEFT, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <div style={{ marginLeft: INFO_TEXT_LEFT, display: 'flex', alignItems: 'center', height: 18 }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 15, color: '#2D4059', lineHeight: '18px' }}>
                        Возвращать в эту ячейку
                      </span>
                      <div style={{ marginLeft: 18 }}>
                        <ToggleSwitch value={returnToThisCell} onChange={() => setReturnToThisCell(!returnToThisCell)} />
                      </div>
                    </div>
                  </div>
                )}

                {showKuoBlock && selectedMaterialUid && (isMultiUsage || isSingleUsage || (showIndividualToggle && individualCell)) && !regLoading && (
                  <>
                    {hasReg ? (
                      needInfo ? (
                        <div style={{ position: 'absolute', top: posInfoTop, left: 0, width: FIELD_WIDTH }}>
                          <img
                            src={InfoIcon18Blue}
                            alt=""
                            style={{ width: 18, height: 18, position: 'absolute', left: INFO_ICON_LEFT, top: 0 }}
                          />
                          <span style={{
                            position: 'absolute', left: INFO_TEXT_LEFT, top: 0,
                            fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14,
                            color: '#2D4059', lineHeight: `${LABEL_HEIGHT}px`, display: 'block',
                          }}>
                            Информация
                          </span>

                          <div style={{
                            position: 'absolute',
                            top: POS_INFO_TEXT_TOP,
                            left: POS_INFO_TEXT_LEFT,
                            width: 410,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                          }}>
                            <div>
                              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 14, color: '#2D4059', lineHeight: '20px' }}>
                                Минимально определенный остаток этой номенклатуры
                              </div>
                              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 14, color: '#2D4059', lineHeight: '20px' }}>
                                на этой станции:{' '}
                                <span style={{ fontWeight: 700, color: '#666EFE' }}>{minStock ?? 0}</span>{' '}
                                единицы
                              </div>
                            </div>

                            <div>
                              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 14, color: '#2D4059', lineHeight: '20px' }}>
                                Забронируйте ячейки для этой номенклатуры еще
                              </div>
                              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 14, color: '#2D4059', lineHeight: '20px' }}>
                                минимум на:{' '}
                                <span style={{ fontWeight: 700, color: '#666EFE' }}>{needToAdd}</span>{' '}
                                единицы
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null
                    ) : (
                      <div style={{ position: 'absolute', top: POS_NOTSET_TOP, left: 0, width: FIELD_WIDTH }}>
                        <img
                          src={InfoIcon18Blue}
                          alt=""
                          style={{ width: 18, height: 18, position: 'absolute', left: INFO_ICON_LEFT, top: 0 }}
                        />
                        <span style={{
                          position: 'absolute', left: INFO_TEXT_LEFT, top: 0,
                          fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14,
                          color: '#2D4059', lineHeight: `${LABEL_HEIGHT}px`, display: 'block',
                        }}>
                          Информация
                        </span>

                        <div
                          onClick={handleOpenCreateDocument}
                          style={{
                            position: 'absolute',
                            top: POS_INFO_TEXT_TOP,
                            left: POS_INFO_TEXT_LEFT,
                            width: 410,
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            color: '#FF3052',
                            lineHeight: '18px',
                            userSelect: 'none',
                          }}
                        >
                          Для выбранной номенклатуры не установлен контроль уровня остатков. Для работы функции автоматического контроля уровня остатка определите уровни остатков данной номенклатуры в документе "Контроль уровней остатков"
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          {showRightPart && (
            <>
              {showNomenclatureFields && (
                <>
                  <div style={{ position: 'absolute', top: posCodeLabel, left: RIGHT_LEFT }}>
                    <FormField
                      width={RIGHT_FIELD_W}
                      height={RIGHT_FIELD_H}
                      label="Код номенклатуры:"
                      value={codeValue}
                      type="input"
                      disabled
                      icon={CodeIcon20Gray}
                      iconActive={CodeIcon20Blue}
                      iconWidth={20}
                      iconHeight={14}
                      labelMarginBottom={LABEL_TO_FIELD}
                    />
                  </div>

                  <div style={{ position: 'absolute', top: posArticleLabel, left: RIGHT_LEFT }}>
                    <FormField
                      width={RIGHT_FIELD_W}
                      height={RIGHT_FIELD_H}
                      label="Артикул:"
                      value={articleValue}
                      type="input"
                      disabled
                      icon={ArticleIcon18Gray}
                      iconActive={ArticleIcon18Blue}
                      iconWidth={16}
                      iconHeight={9}
                      labelMarginBottom={LABEL_TO_FIELD}
                    />
                  </div>

                  {!isReadyDetail && (
                    <div style={{ position: 'absolute', top: posUsageLabel, left: RIGHT_LEFT }}>
                      <FormField
                        width={RIGHT_FIELD_W}
                        height={RIGHT_FIELD_H}
                        label="Использование:"
                        value={usageValue}
                        type="input"
                        disabled
                        icon={usageIcon}
                        iconWidth={16}
                        iconHeight={16}
                        labelMarginBottom={LABEL_TO_FIELD}
                      />
                    </div>
                  )}
                  {isReadyDetail && (
                    <div style={{ position: 'absolute', top: posUsageLabel, left: RIGHT_LEFT }}>
                      <FormField
                        width={RIGHT_FIELD_W}
                        height={RIGHT_FIELD_H}
                        label="СКУ:"
                        value={skuValue}
                        type="input"
                        disabled
                        icon={SKUIcon20Gray}
                        iconActive={SKUIcon20Blue}
                        iconWidth={20}
                        iconHeight={14}
                        labelMarginBottom={LABEL_TO_FIELD}
                      />
                    </div>
                  )}

                  {!isReadyDetail && (
                    <div style={{ position: 'absolute', top: posTypeLabel, left: RIGHT_LEFT }}>
                      <FormField
                        width={RIGHT_FIELD_W}
                        height={RIGHT_FIELD_H}
                        label="Вид номенклатуры:"
                        value={typeValue}
                        type="input"
                        disabled
                        icon={TypeIcon16Gray}
                        iconActive={TypeIcon16Blue}
                        iconWidth={16}
                        iconHeight={16}
                        labelMarginBottom={LABEL_TO_FIELD}
                      />
                    </div>
                  )}
                  {isReadyDetail && (
                    <div style={{ position: 'absolute', top: posTypeLabel, left: RIGHT_LEFT }}>
                      <FormField
                        width={RIGHT_FIELD_W}
                        height={RIGHT_FIELD_H}
                        label="Выпуск:"
                        value={releaseValue}
                        type="input"
                        disabled
                        icon={ReleaseIcon10Gray}
                        iconActive={ReleaseIcon10Blue}
                        iconWidth={10}
                        iconHeight={16}
                        labelMarginBottom={LABEL_TO_FIELD}
                      />
                    </div>
                  )}
                </>
              )}

              <div style={{ position: 'absolute', top: posImageLabel, left: IMAGE_COL_LEFT }}>
                <span style={labelStyle}>Изображение</span>
              </div>
              <div style={{ position: 'absolute', top: posImageField, left: IMAGE_COL_LEFT }}>
                {renderImageBlock()}
              </div>

              {showNomenclatureCardButton && (
                <div
                  onClick={handleOpenNomenclatureCard}
                  style={{
                    position: 'absolute',
                    top: posCardButton,
                    left: IMAGE_COL_LEFT,
                    width: CARD_BTN_W,
                    height: CARD_BTN_H,
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center',
                    cursor: 'pointer',
                    paddingLeft: 16,
                    paddingRight: 13,
                    boxSizing: 'border-box',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 12, color: '#2D4059', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Карточка номенклатуры
                  </span>
                  <img src={LinkIcons14Blue} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
                </div>
              )}
            </>
          )}

          {/* КНОПКИ ВНИЗУ СПРАВА */}
          <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 30 }}>
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              style={{
                width: 156,
                height: 44,
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#666EFE',
                cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
                opacity: isSaveDisabled ? 0.5 : 1,
                pointerEvents: isSaveDisabled ? 'none' : 'auto',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 18,
                paddingRight: 18,
                boxSizing: 'border-box',
                gap: 17,
              }}
            >
              <img src={WriteIcon20White} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>
                Сохранить
              </span>
            </button>

            <button
              onClick={handleCancel}
              style={{
                width: 111,
                height: 44,
                borderRadius: 10,
                border: '1px solid rgba(102, 110, 254, 0.15)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                color: '#2D4059',
                padding: 0,
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>

      {fullscreenImage && materialDetail?.imageUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullscreenImage(false)}>
          <img src={materialDetail.imageUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', pointerEvents: 'none' }} />
        </div>
      )}

      {showCatalog && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <CatalogSelectPopup
            isOpen={showCatalog}
            onClose={() => setShowCatalog(false)}
            onSelect={handleSelectMaterial}
            popupType="analogSelect"
            nomenclatureTypeFilter={nomenclatureTypeFilter}
          />
        </div>
      )}
    </>
  );

  return content;
};

export default CellDetailsPopup;