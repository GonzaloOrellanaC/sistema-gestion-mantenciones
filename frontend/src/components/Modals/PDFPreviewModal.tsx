import { IonButton, IonCol, IonContent, IonFab, IonFabButton, IonFooter, IonGrid, IonIcon, IonModal, IonRange, IonRow } from "@ionic/react";
import { addOutline, chevronDownOutline, chevronUpOutline, closeOutline, removeOutline } from "ionicons/icons";
import { useState, useRef, useEffect } from "react";
import { pdfjs, Document, Page } from 'react-pdf';
import './Modal.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Input } from "../Widgets/Input.widget";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();


type PDFPreviewModalProps = {
  isOpen: boolean;
  onDidDismiss: () => void;
  pdfUrl: string | null;
};

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ isOpen, onDidDismiss, pdfUrl }) => {

    const [numPages, setNumPages] = useState<number>(1);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [maxWidth, setMaxWidth] = useState<number>(600);
    const [scale, setScale] = useState<number>(1.0);
    const PAGE_SCALE_STEP = 0.1;
    const PAGE_SCALE_MIN = 0.3;
    const PAGE_SCALE_MAX = 2.5;
    const containerRef = useRef<HTMLElement | null>(null);
    const lastWidthRef = useRef<number | null>(null);
    const roRef = useRef<ResizeObserver | null>(null);
    const observedElRef = useRef<HTMLElement | null>(null);
    const WIDTH_TOLERANCE = 2; // pixels
    const rafRef = useRef<number | null>(null);
    const prevIsOpenRef = useRef<boolean>(false);

    const scheduleSetWidth = (w: number) => {
        // cancel pending
        if (rafRef.current !== null) {
            try { cancelAnimationFrame(rafRef.current); } catch (e) { /* ignore */ }
            rafRef.current = null;
        }
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            // only set when different enough
            if (lastWidthRef.current === null || Math.abs((lastWidthRef.current || 0) - w) > WIDTH_TOLERANCE) {
                lastWidthRef.current = w;
                setMaxWidth(w);
            }
        });
    };

    // callback for Document inputRef
    const handleInputRef = (el: any) => {
        // Document may pass an element or null
        containerRef.current = el;
        if (el && typeof el.getBoundingClientRect === 'function') {
            const w = Math.floor(el.getBoundingClientRect().width || el.clientWidth || 600);
            // schedule update (debounced via RAF) to avoid sync state during ref attach
            scheduleSetWidth(w);
            // attach ResizeObserver (create once) and ensure we observe the current element
            if ((window as any).ResizeObserver) {
                try {
                    if (!roRef.current) {
                        roRef.current = new (window as any).ResizeObserver(() => {
                            const el2 = containerRef.current as any;
                            if (!el2) return;
                            const nw = Math.floor(el2.getBoundingClientRect().width || el2.clientWidth || 600);
                            scheduleSetWidth(nw);
                        });
                    }
                    if (roRef.current) {
                        // if observing a different element, unobserve previous
                        if (observedElRef.current && observedElRef.current !== el) {
                            try { roRef.current.unobserve(observedElRef.current); } catch (e) { console.log({e}) }
                            observedElRef.current = null;
                        }
                        if (!observedElRef.current) {
                            roRef.current.observe(el);
                            observedElRef.current = el;
                        }
                    }
                } catch (e) {
                    roRef.current = null;
                }
            }
        }
    };

    useEffect(() => {
        return () => {
            if (roRef.current && observedElRef.current) {
                try { roRef.current.unobserve(observedElRef.current); } catch (e) { /* ignore */ }
            }
            roRef.current = null;
            observedElRef.current = null;
            if (rafRef.current !== null) {
                try { cancelAnimationFrame(rafRef.current); } catch (e) { /* ignore */ }
                rafRef.current = null;
            }
        };
    }, []);

    // reset page and scale when modal closes
    useEffect(() => {
        const prev = prevIsOpenRef.current;
        prevIsOpenRef.current = isOpen;
        if (prev && !isOpen) {
            // modal was open and now closed
            setPageNumber(1);
            setScale(1);
        }
    }, [isOpen]);

    // wheel + ctrl to zoom on container
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (ev: WheelEvent) => {
            if (!ev.ctrlKey) return;
            ev.preventDefault();
            const delta = ev.deltaY;
            if (delta < 0) {
                setScale(s => Math.min(PAGE_SCALE_MAX, +(s + PAGE_SCALE_STEP).toFixed(2)));
            } else if (delta > 0) {
                setScale(s => Math.max(PAGE_SCALE_MIN, +(s - PAGE_SCALE_STEP).toFixed(2)));
            }
        };
        el.addEventListener('wheel', onWheel as EventListener, { passive: false });
        return () => {
            try { el.removeEventListener('wheel', onWheel as EventListener); } catch (e) { /* ignore */ }
        };
    }, [containerRef.current]);

    function onDocumentLoadSuccess(data: any): void {
        setNumPages(data.numPages);
    }

    // clamp pageNumber if numPages changes
    useEffect(() => {
        if (!numPages) return;
        if (pageNumber < 1) setPageNumber(1);
        else if (pageNumber > numPages) setPageNumber(numPages);
    }, [numPages]);

    // scroll to the active page when pageNumber changes
    useEffect(() => {
        const container = containerRef.current as HTMLElement | null;
        if (!container) return;
        const target = container.querySelector(`#pdf-page-${pageNumber}`) as HTMLElement | null;
        if (target) {
            try {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                // fallback
                container.scrollTop = target.offsetTop;
            }
        }
    }, [pageNumber]);

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss} className="pdf-modal">
            <IonContent className="ion-text-center" style={{  }}>
                <IonGrid style={{height: '100%'}}>
                    <IonRow style={{height: '100%'}}>
                        <IonCol sizeXs="10.3" sizeSm="10.8" sizeMd="11.1" sizeLg="11.5" >
                            <IonContent className="pdf-modal-content" style={{position: 'relative'}}>
                                {pdfUrl ? (
                                <div style={{width: '100%', padding: 10, height: '100%', overflowY: 'auto'}}>
                                    <div style={{maxWidth, width: '100%', margin: '0 auto'}}>
                                        <div ref={handleInputRef}>
                                            <Document scale={scale} file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                                                {numPages ? Array.from({ length: numPages }).map((_, idx) => (
                                                    <div key={idx} id={`pdf-page-${idx + 1}`} style={{ marginBottom: 16 }}>
                                                        <Page pageNumber={idx + 1} width={Math.max(100, Math.floor(maxWidth))} scale={scale} />
                                                    </div>
                                                )) : (
                                                    <Page pageNumber={1} width={Math.max(100, Math.floor(maxWidth))} scale={scale} />
                                                )}
                                            </Document>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: 'calc(100vh)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p>No hay documento PDF disponible</p>
                                </div>
                            )}

                            </IonContent>
                            
                        </IonCol>
                        <IonCol sizeXs="1.7" sizeSm="1.2" sizeMd="0.9" sizeLg="0.5" >
                            <div style={{height: '100%', width: '100%', backgroundColor: '#f6f6f6'}}>
                                <IonButton fill={'clear'} onClick={onDidDismiss}>
                                    <IonIcon color="dark" slot="icon-only" icon={closeOutline} />
                                </IonButton>
                                <br />
                                <br />
                                <p>Pages</p>
                                <br />
                                <Input
                                    type={'text'}
                                    value={pageNumber}
                                    onChange={(e) => { numPages && (Number(e.target.value) > numPages || Number(e.target.value) < 1) ? setPageNumber(pageNumber) : setPageNumber(Number(e.target.value)); }}
                                    onBlur={(e) => { numPages && (Number(e.target.value) > numPages || Number(e.target.value) < 1) ? setPageNumber(pageNumber) : setPageNumber(Number(e.target.value)); }}
                                    disabled={numPages === undefined || numPages === pageNumber}
                                />
                                <IonButton fill="clear" disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)}>
                                    <IonIcon color="dark" slot="icon-only" icon={chevronUpOutline} />
                                </IonButton>
                                <IonButton fill="clear" disabled={numPages !== undefined ? pageNumber >= numPages : true} onClick={() => setPageNumber(pageNumber + 1)}>
                                    <IonIcon color="dark" slot="icon-only" icon={chevronDownOutline} />
                                </IonButton>
                                <p>{numPages}</p>
                                {/* Controles de zoom */}
                                <div style={{marginTop: 30}}>
                                    <IonButton color={'dark'} fill={'clear'} size="small" onClick={() => setScale(s => Math.max(PAGE_SCALE_MIN, +(s + PAGE_SCALE_STEP).toFixed(2)))}>
                                        <IonIcon icon={addOutline} slot={'icon-only'} />
                                    </IonButton>
                                    <div style={{minWidth: 72, textAlign: 'center', color: '#999999'}}>{Math.round(scale * 100)}%</div>
                                    <IonButton color={'dark'} fill={'clear'} size="small" onClick={() => setScale(s => Math.min(PAGE_SCALE_MAX, +(s - PAGE_SCALE_STEP).toFixed(2)))}>
                                        <IonIcon icon={removeOutline} slot={'icon-only'} />
                                    </IonButton>
                                    <br />
                                    <IonButton color={'dark'} fill={'clear'} size="small" onClick={() => setScale(1)}>
                                        Fit
                                    </IonButton>
                                </div>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonModal>
    );
};