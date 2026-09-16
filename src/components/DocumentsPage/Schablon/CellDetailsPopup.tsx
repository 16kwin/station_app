// CellDetailsPopup.tsx — ПОЛНЫЙ ФАЙЛ (сброс при смене типа + SKU из /codes)
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AxiosService from '../../../services/AxiosService';
import ConstantInfo from '../../../info/ConstantInfo';
import { useTabs } from '../../../context/TabContext';
import CatalogSelectPopup from '../../../components/ReferencesPage/NomenclaturePage/CatalogSelectPopup';

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

const CellDetailsPopup: React.FC<CellDetailsPopupProps> = ({
  isOpen, onClose, cellId, cellName, selectedColumn, selectedDrum, cellData, onSaved,
  stationUid, stationName, isTmc: stationIsTmc, isSgd: stationIsSgd, getOtherQuantityForMaterial,
}) => {
  const { openTab } = useTabs();

  const [assignments, setAssignments] = useState<CellAssignment[]>([]);
  const [cellAssignmentUid, setCellAssignmentUid] = useState<string>('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const [returnToThisCell, setReturnToThisCell] = useState(false);
  const [individualCell, setIndividualCell] = useState(false);

  const [selectedMaterialUid, setSelectedMaterialUid] = useState<string>('');
  const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [showCatalog, setShowCatalog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [regLoading, setRegLoading] = useState(false);
  const [regData, setRegData] = useState<StockLevelReg | null>(null);
  const [regLoaded, setRegLoaded] = useState(false);

  const materialDetailRef = useRef<MaterialDetail | null>(null);
  const selectedMaterialUidRef = useRef<string>('');
  useEffect(() => { materialDetailRef.current = materialDetail; }, [materialDetail]);
  useEffect(() => { selectedMaterialUidRef.current = selectedMaterialUid; }, [selectedMaterialUid]);

  const title = `Выбранная ячейка ${selectedColumn}-${cellId}`;

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

  useEffect(() => {
    if (!isOpen) return;

    setCellAssignmentUid(cellData?.cellAssignmentUid || '');
    setTypeDropdownOpen(false);
    setReturnToThisCell(cellData?.returnToThisCell === true);
    setIndividualCell(cellData?.isIndividual === true);

    if (cellData?.materialUid) {
      setSelectedMaterialUid(cellData.materialUid);
      selectedMaterialUidRef.current = cellData.materialUid;
      setIsLoading(true);
      loadMaterialDetail(cellData.materialUid).finally(() => setIsLoading(false));
      setQuantity(cellData.quantity || 0);
    } else {
      setSelectedMaterialUid('');
      selectedMaterialUidRef.current = '';
      setMaterialDetail(null);
      materialDetailRef.current = null;
      setQuantity(0);
    }
    setShowCatalog(false);
    setIsLoading(false);
  }, [isOpen, cellData]);

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

      // SKU берём из /codes, где codeKind === 'SKU'
      let skuValue: string | null = null;
      try {
        const codesRes = await AxiosService.get(ConstantInfo.restApiNomenclatureCodes(uid));
        const codes = (codesRes.data || []) as Array<{ codeKind: string; codeValue: string }>;
        const skuCode = codes.find(c => c.codeKind === 'SKU');
        if (skuCode) skuValue = skuCode.codeValue || null;
      } catch {}

      const detail: MaterialDetail = {
        uid: data.uid,
        nameMaterial: data.nameMaterial || data.name || data.materialName || '',
        article: data.article || '',
        codeMaterial: data.codeMaterial ?? null,
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

  const handleSelectMaterial = async (uid: string, _name: string) => {
    setIsLoading(true);
    setSelectedMaterialUid(uid);
    selectedMaterialUidRef.current = uid;
    setShowCatalog(false);
    await loadMaterialDetail(uid);
    setIsLoading(false);
  };

  // Смена типа ячейки: если на другой uid — сбрасываем всё, что связано с номенклатурой
  const handleAssignmentChange = (newUid: string) => {
    if (newUid !== cellAssignmentUid) {
      setSelectedMaterialUid('');
      selectedMaterialUidRef.current = '';
      setMaterialDetail(null);
      materialDetailRef.current = null;
      setQuantity(0);
      setReturnToThisCell(false);
      setIndividualCell(false);
      setRegData(null);
      setRegLoaded(false);
    }
    setCellAssignmentUid(newUid);
    setTypeDropdownOpen(false);
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

  const showIndividualToggle = isBrak || isPeretochka;
  const showNomenclatureFields =
    (isTmcAssignment && !isLom && (!showIndividualToggle || individualCell))
    || isReadyDetail;
  const showReturnToggle = currentAssignmentName === 'ТМЦ' && materialDetail?.usage === true;

  const nomenclatureTypeFilter: 'ТМЦ' | 'Готовая деталь' | undefined =
    isTmcAssignment ? 'ТМЦ'
    : isReadyDetail ? 'Готовая деталь'
    : undefined;

  const otherQty = (selectedMaterialUid && getOtherQuantityForMaterial)
    ? getOtherQuantityForMaterial(selectedMaterialUid, {
        numberCell: cellId,
        columnNumber: selectedColumn,
        drumNumber: selectedDrum,
      })
    : 0;
  const totalQty = otherQty + (Number(quantity) || 0);

  const showStockWarning = !!stationUid && !!selectedMaterialUid && showNomenclatureFields && regLoaded;

  let stockWarningType: 'ok' | 'min' | 'critical' | 'none' | 'notSet' = 'none';
  let stockWarningText = '';
  if (showStockWarning) {
    if (!regData) {
      stockWarningType = 'notSet';
      stockWarningText = 'Контроль уровня остатков по данной номенклатуре не установлен';
    } else {
      const min = regData.minStock;
      const crit = regData.criticalStock;
      if (crit != null && totalQty < crit) {
        stockWarningType = 'critical';
        stockWarningText = `Критический остаток! По регистру минимально требуется ${crit} ед., а получится ${totalQty} ед. Нужно добавить ещё ${crit - totalQty} ед.`;
      } else if (min != null && totalQty < min) {
        stockWarningType = 'min';
        stockWarningText = `По регистру минимальный остаток ${min} ед., а получится ${totalQty} ед. Нужно положить ещё ${min - totalQty} ед.`;
      } else {
        stockWarningType = 'ok';
        stockWarningText = `Остаток по регистру: мин. ${min ?? '—'}, крит. ${crit ?? '—'}. Текущее количество: ${totalQty} ед.`;
      }
    }
  }

  const handleOpenCreateDocument = () => {
    if (!stationUid || !selectedMaterialUid) return;

    const newUid = crypto.randomUUID();
    const params = new URLSearchParams();
    params.set('stationUid', stationUid);
    if (stationName) params.set('stationName', stationName);
    params.set('materialUid', selectedMaterialUid);
    const detail = materialDetailRef.current;
    if (detail?.nameMaterial) params.set('materialName', detail.nameMaterial);
    if (detail?.article) params.set('materialArticle', detail.article);

    const path = `/documents/stock-level-control/create/${newUid}?${params.toString()}`;
    openTab(path, 'Контроль остатков (новый)', null);
    onClose();
  };

  const handleSave = () => {
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
      onSaved({
        cellAssignmentUid: cellAssignmentUid || null,
        cellAssignmentName: currentAssignmentName || null,
        cellAssignmentTypeUid: currentAssignment?.typeUid || null,
        cellAssignmentTypeName: currentAssignment?.typeName || null,
        materialUid: uid,
        materialName: detail?.nameMaterial || '',
        materialArticle: detail?.article || '',
        quantity: quantity ?? null,
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
  };

  if (!isOpen) return null;

  const cellBg = '#E9F2F9';

  const statusIndicator = (() => {
    if (isBrak) return { color: '#FF3052', label: 'БРАК' };
    if (isPeretochka) return { color: '#FF8A00', label: 'ПТЧ' };
    if (currentAssignmentName === 'Готовая деталь (контроль качества пройден)') return { color: '#07E098', label: 'КП' };
    if (currentAssignmentName === 'Готовая деталь (контроль качества не пройден)') return { color: '#FF3052', label: 'КНП' };
    if (currentAssignmentName === 'Готовая деталь (с производства)') return { color: '#666EFE', label: 'СП' };
    return null;
  })();

  const warningColor = stockWarningType === 'critical' ? '#FF3052'
    : stockWarningType === 'min' ? '#FF8A00'
    : stockWarningType === 'ok' ? '#07E098'
    : '#9CA3AF';

  const isNotSet = stockWarningType === 'notSet';

  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
        <div style={{ width: '1052px', height: '602px', backgroundColor: '#FFFFFF', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', position: 'relative' }}>

          <div style={{ position: 'absolute', top: '30px', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#2D4059' }}>{title}</span>
          </div>

          <div style={{ position: 'absolute', top: '76px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '400px', backgroundColor: '#E9EDFF', borderRadius: '1px' }} />

          {statusIndicator && (
            <div style={{
              position: 'absolute', top: '150px', left: '50%', transform: 'translateX(-50%)',
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: statusIndicator.color, opacity: 0.9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 5,
            }}>
              {statusIndicator.label}
            </div>
          )}

          <div style={{ position: 'absolute', top: '77px', left: '30px', width: '460px' }}>

            <div style={{ position: 'relative' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Тип ячейки</span>
              <div
                onClick={() => setTypeDropdownOpen(v => !v)}
                style={{
                  width: '100%', height: '44px', backgroundColor: '#FFFFFF',
                  borderRadius: '8px', border: '1px solid rgba(102, 110, 254, 0.3)',
                  display: 'flex', alignItems: 'center', paddingLeft: '15px', paddingRight: '15px',
                  cursor: 'pointer', marginTop: '11px', boxSizing: 'border-box',
                }}
              >
                <span style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: cellAssignmentUid ? '#2D4059' : '#A0A3BD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentAssignmentName || 'Выберите тип'}
                </span>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: typeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  <path d="M1 1L6 6L11 1" stroke="#2D4059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {typeDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                  backgroundColor: '#FFFFFF', borderRadius: '10px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)', border: '1px solid rgba(102, 110, 254, 0.15)',
                  zIndex: 50, padding: '8px 0', maxHeight: '320px', overflowY: 'auto',
                }}>
                  {filteredAssignments.length === 0 ? (
                    <div style={{ padding: '10px 15px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#9CA3AF' }}>
                      Нет доступных типов
                    </div>
                  ) : filteredAssignments.map(a => (
                    <div
                      key={a.uid}
                      onClick={() => handleAssignmentChange(a.uid)}
                      style={{
                        padding: '10px 15px', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                        color: cellAssignmentUid === a.uid ? '#666EFE' : '#2D4059',
                        backgroundColor: cellAssignmentUid === a.uid ? '#F0F2FF' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (cellAssignmentUid !== a.uid) e.currentTarget.style.backgroundColor = '#F5F6FA'; }}
                      onMouseLeave={(e) => { if (cellAssignmentUid !== a.uid) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {a.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showIndividualToggle && (
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2D4059', cursor: 'pointer' }}>
                  <input type="checkbox" checked={individualCell} onChange={e => setIndividualCell(e.target.checked)} />
                  Под каждую номенклатуру индивидуальную ячейку?
                </label>
              </div>
            )}

            {showReturnToggle && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Возвращать в эту ячейку</span>
                <div style={{ marginTop: '11px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2D4059', cursor: 'pointer' }}>
                    <input type="checkbox" checked={returnToThisCell} onChange={e => setReturnToThisCell(e.target.checked)} />
                    Да, возвращать
                  </label>
                </div>
              </div>
            )}

            {showNomenclatureFields && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Номенклатура</span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '11px', alignItems: 'center' }}>
                  <div style={{ flex: 1, height: '44px', backgroundColor: cellBg, borderRadius: '8px', display: 'flex', alignItems: 'center', paddingLeft: '15px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: materialDetail ? '#2D4059' : '#6C7A8B', overflow: 'hidden' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isLoading ? 'Загрузка...' : (materialDetail ? materialDetail.nameMaterial : 'Не выбрано')}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCatalog(true)}
                    style={{ width: '44px', height: '44px', borderRadius: '8px', border: 'none', backgroundColor: '#666EFE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="#FFFFFF" strokeWidth="1.5"/>
                      <path d="M11 11L14.5 14.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {showNomenclatureFields && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Количество в ячейке</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  placeholder="0"
                  min={0}
                  style={{ width: '100%', height: '44px', backgroundColor: cellBg, borderRadius: '8px', border: 'none', padding: '0 15px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#2D4059', outline: 'none', boxSizing: 'border-box', marginTop: '11px' }}
                />
              </div>
            )}

            {showStockWarning && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#2D4059' }}>Контроль уровня остатков</span>
                <div
                  onClick={isNotSet ? handleOpenCreateDocument : undefined}
                  style={{
                    marginTop: '11px',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    border: `1px solid ${warningColor}`,
                    backgroundColor: `${warningColor}14`,
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    cursor: isNotSet ? 'pointer' : 'default',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => { if (isNotSet) e.currentTarget.style.backgroundColor = `${warningColor}28`; }}
                  onMouseLeave={(e) => { if (isNotSet) e.currentTarget.style.backgroundColor = `${warningColor}14`; }}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: warningColor, marginTop: '5px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#2D4059', lineHeight: '18px' }}>
                      {regLoading ? 'Загрузка...' : stockWarningText}
                    </div>
                    {isNotSet && (
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#666EFE', marginTop: '6px', lineHeight: '16px', fontWeight: 500 }}>
                        Нажмите, чтобы создать документ контроля остатков для этой номенклатуры
                      </div>
                    )}
                    {stockWarningType === 'min' || stockWarningType === 'critical' ? (
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(45, 64, 89, 0.6)', marginTop: '4px', lineHeight: '16px' }}>
                        В других ячейках: {otherQty} ед. + текущая: {Number(quantity) || 0} ед. = {totalQty} ед.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showNomenclatureFields && (
            <div style={{ position: 'absolute', top: '77px', right: '30px', width: '460px' }}>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ width: '120px', height: '120px', backgroundColor: cellBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {materialDetail?.imageUrl
                    ? <img src={materialDetail.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', color: '#6C7A8B' }}>Нет фото</span>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Код номенклатуры</span>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>{materialDetail?.codeMaterial ?? '—'}</div>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Артикул</span>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>{materialDetail?.article || '—'}</div>
                  </div>
                </div>
              </div>

              {isTmcAssignment && (
                <>
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Использование</span>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>
                      {materialDetail?.usage === true ? 'Многоразовое' : materialDetail?.usage === false ? 'Одноразовое' : '—'}
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Вид номенклатуры</span>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>
                      {materialDetail?.typeProductName || '—'}
                    </div>
                  </div>
                </>
              )}

              {isReadyDetail && (
                <>
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>СКУ</span>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>
                      {materialDetail?.sku || '—'}
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'rgba(45, 64, 89, 0.5)' }}>Выпуск</span>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2D4059', marginTop: '2px' }}>
                      {materialDetail?.releaseName || '—'}
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={handleOpenNomenclatureCard}
                  disabled={!selectedMaterialUid}
                  style={{
                    height: '40px', paddingLeft: '20px', paddingRight: '20px', borderRadius: '10px',
                    border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF',
                    cursor: selectedMaterialUid ? 'pointer' : 'not-allowed',
                    fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                    color: '#2D4059', opacity: selectedMaterialUid ? 1 : 0.5,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  Перейти в карточку номенклатуры
                </button>
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '30px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              onClick={handleSave}
              style={{
                height: '44px', paddingLeft: '30px', paddingRight: '30px', borderRadius: '10px',
                border: 'none', backgroundColor: '#666EFE', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#FFFFFF',
              }}
            >
              Сохранить
            </button>
            <button
              onClick={handleCancel}
              style={{
                height: '44px', paddingLeft: '30px', paddingRight: '30px', borderRadius: '10px',
                border: '1px solid rgba(102, 110, 254, 0.15)', backgroundColor: '#FFFFFF', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 400, color: '#2D4059',
              }}
            >
              Отмена
            </button>
          </div>

          <div style={{ position: 'absolute', top: '17px', right: '30px' }}>
            <button
              onClick={handleCancel}
              style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
                <line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="#2D4059" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

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
};

export default CellDetailsPopup;