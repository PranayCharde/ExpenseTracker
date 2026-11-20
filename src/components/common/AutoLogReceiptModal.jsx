import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Loader2, 
  Receipt, 
  Calendar, 
  Tag, 
  CreditCard, 
  RotateCcw,
  AlertCircle,
  FileText
} from 'lucide-react';
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCurrency } from '../../hooks/useCurrency';
import { compressReceiptImage, compressReceiptToBlob } from '../../utils/receiptHelper';
import { scanWebReceipt, warmupReceiptScanner } from '../../utils/receiptScannerService';
import { uploadReceiptToCloudinary } from '../../services/cloudinaryService';

export default function AutoLogReceiptModal({ isOpen, onClose, onTransactionLogged }) {
  const { formatCurrency, CURRENCY_SYMBOL } = useCurrency();
  const fileInputRef = useRef(null);

  // Steps: 'upload' | 'scanning' | 'saving' | 'success' | 'error'
  const [step, setStep] = useState('upload');
  const [scanProgress, setScanProgress] = useState(0);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loggedData, setLoggedData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      warmupReceiptScanner();
      setStep('upload');
      setScanProgress(0);
      setReceiptPreview(null);
      setErrorMessage('');
      setLoggedData(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processAndAutoLog = async (file) => {
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('File size must be under 12MB.');
      setStep('error');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setErrorMessage('Please sign in to log receipts.');
      setStep('error');
      return;
    }

    // Set preview
    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target.result);
      reader.readAsDataURL(file);
    }

    // 1. Scanning Step
    setStep('scanning');
    setScanProgress(0);
    setErrorMessage('');

    let parsedResult = null;
    try {
      const scanRes = await scanWebReceipt(file, (p) => setScanProgress(p));
      if (scanRes.success && scanRes.data && scanRes.data.amount) {
        parsedResult = scanRes.data;
      } else {
        throw new Error(scanRes.error || 'Could not find bill amount. Please make sure the total amount is visible.');
      }
    } catch (scanErr) {
      console.warn('[AutoLog] OCR Scan notice:', scanErr);
      setErrorMessage(scanErr.message || 'Could not auto-read receipt data. Please verify image clarity.');
      setStep('error');
      return;
    }

    // 2. Saving Step (Automated logging)
    setStep('saving');

    try {
      const amountVal = parseFloat(parsedResult.amount);
      const isExpense = true;
      const finalAmount = -Math.abs(amountVal);
      const category = parsedResult.category || 'Shopping';
      const description = parsedResult.merchant || `${category} (Receipt)`;
      const paymentMethod = parsedResult.paymentMethod || 'Online / UPI';

      // Date parsing
      let txDate = new Date();
      if (parsedResult.date && /^\d{4}-\d{2}-\d{2}$/.test(parsedResult.date)) {
        const [y, m, d] = parsedResult.date.split('-').map(Number);
        txDate = new Date(y, m - 1, d, 12, 0, 0);
      }

      // Optimize and upload receipt image to Cloudinary
      let finalReceiptUrl = null;
      try {
        const [base64Fallback, blobToUpload] = await Promise.all([
          compressReceiptImage(file, 950, 0.75),
          compressReceiptToBlob(file, 950, 0.75)
        ]);

        const cloudRes = await uploadReceiptToCloudinary(blobToUpload || file);
        if (cloudRes.success && cloudRes.url) {
          finalReceiptUrl = cloudRes.url;
          console.log('[AutoLog] Stored receipt in Cloudinary:', finalReceiptUrl);
        } else {
          console.warn('[AutoLog] Cloudinary notice, using backup:', cloudRes.error);
          finalReceiptUrl = base64Fallback;
        }
      } catch (storageErr) {
        console.warn('[AutoLog] Upload notice, using backup:', storageErr);
        try {
          finalReceiptUrl = await compressReceiptImage(file, 800, 0.7);
        } catch (_) {
          finalReceiptUrl = null;
        }
      }

      // Write to Firestore Ledger
      const transactionPayload = {
        userId: user.uid,
        amount: finalAmount,
        type: 'expense',
        category: category,
        paymentMethod: paymentMethod,
        description: description,
        notesSummary: null,
        receiptUrl: finalReceiptUrl,
        date: Timestamp.fromDate(txDate),
        createdAt: serverTimestamp(),
        source: 'receipt_autolog'
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'transactions'), transactionPayload);

      const loggedInfo = {
        id: docRef.id,
        amount: amountVal,
        merchant: description,
        category: category,
        paymentMethod: paymentMethod,
        date: txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        receiptUrl: finalReceiptUrl
      };

      setLoggedData(loggedInfo);
      setStep('success');

      if (onTransactionLogged) {
        onTransactionLogged(loggedInfo);
      }
    } catch (saveErr) {
      console.error('[AutoLog] Save error:', saveErr);
      setErrorMessage('Failed to record transaction in ledger. Please check connection.');
      setStep('error');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processAndAutoLog(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndAutoLog(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-teal-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <Camera size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900">Auto-Log Receipt</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> 100% Automated
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-500">
                Drop your bill — AI reads & logs everything automatically
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden File Input */}
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: Upload Dropzone */}
          {step === 'upload' && (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                  : 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40 hover:border-emerald-400'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-100 mb-4 animate-bounce">
                <Upload size={28} />
              </div>
              <h4 className="text-base font-bold text-gray-900">
                Click to Upload or Drag & Drop Receipt
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
                Supports JPG, PNG, WebP or Camera snaps. You don't have to enter any fields manually!
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
                  ⚡ Auto-Extracts Amount
                </span>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-3 py-1 rounded-full">
                  🏪 Auto-Extracts Vendor
                </span>
                <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-100/70 px-3 py-1 rounded-full">
                  📅 Auto-Logs to Ledger
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Scanning & Progress */}
          {step === 'scanning' && (
            <div className="py-8 flex flex-col items-center text-center">
              {receiptPreview && (
                <div className="relative mb-6">
                  <img 
                    src={receiptPreview} 
                    alt="Receipt scanning" 
                    className="w-32 h-40 object-cover rounded-2xl border-2 border-emerald-300 shadow-md"
                  />
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                    <div className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-emerald-600">
                      <Loader2 size={22} className="animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm mb-2">
                <Sparkles size={18} className="animate-pulse" />
                <span>AI Reading Receipt ({scanProgress}%)</span>
              </div>

              <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(10, scanProgress)}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 font-medium">
                Detecting bill amount, store name, category and date...
              </p>
            </div>
          )}

          {/* STEP 3: Saving */}
          {step === 'saving' && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Loader2 size={30} className="animate-spin" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Recording to Your Ledger...</h4>
              <p className="text-xs text-gray-500 mt-1">
                Compressing receipt photo and creating transaction entry...
              </p>
            </div>
          )}

          {/* STEP 4: Success Result */}
          {step === 'success' && loggedData && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">Successfully Logged to Ledger!</h4>
                  <p className="text-xs font-semibold text-emerald-700">
                    All transaction data was extracted and saved automatically.
                  </p>
                </div>
              </div>

              {/* Parsed Summary Card */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-baseline justify-between pb-3 border-b border-gray-200">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount Paid</p>
                    <p className="text-2xl font-black text-rose-600 tracking-tight">
                      -{formatCurrency(loggedData.amount)}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    Auto-Logged
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Receipt size={14} className="text-gray-400 shrink-0" />
                    <span className="font-bold truncate">{loggedData.merchant}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Tag size={14} className="text-gray-400 shrink-0" />
                    <span className="font-semibold truncate">{loggedData.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    <span className="font-semibold truncate">{loggedData.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CreditCard size={14} className="text-gray-400 shrink-0" />
                    <span className="font-semibold truncate">{loggedData.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setLoggedData(null);
                    setReceiptPreview(null);
                  }}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw size={15} />
                  Scan Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {step === 'error' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Couldn't Auto-Log Receipt</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">{errorMessage}</p>
              </div>
              <div className="flex gap-2 pt-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setErrorMessage('');
                  }}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Try Another Photo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

