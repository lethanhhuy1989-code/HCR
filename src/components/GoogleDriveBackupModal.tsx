import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Database,
  ExternalLink,
  RefreshCw,
  LogOut,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import {
  signInWithGoogle,
  signOutGoogle,
  initGoogleAuth,
  uploadFileToDrive,
  listBackupFiles,
  DriveBackupFile,
} from '../services/googleDriveService';
import { useHRM } from '../context/HRMContext';

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    employees,
    departments,
    projects,
    timesheets,
    contracts,
    payrollItems,
    currentMonth,
    showToast,
  } = useHRM();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupActionName, setBackupActionName] = useState<string>('');
  const [backupFiles, setBackupFiles] = useState<DriveBackupFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Confirmation dialog state (mandatory for user confirmation on operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  // Listen to auth state
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initGoogleAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        fetchDriveFiles();
      },
      () => {
        setUser(null);
        setToken(null);
        setBackupFiles([]);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Fetch list of backed up files from Google Drive
  const fetchDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listBackupFiles();
      setBackupFiles(files);
    } catch (err) {
      console.warn('Failed to fetch backup files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(`Đã kết nối tài khoản Google: ${res.user.email}`, 'success');
        await fetchDriveFiles();
      }
    } catch (err: any) {
      showToast(err.message || 'Đăng nhập Google thất bại.', 'error');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setUser(null);
    setToken(null);
    setBackupFiles([]);
    showToast('Đã ngắt kết nối tài khoản Google.', 'info');
  };

  // 1. Backup Payroll Report to Google Drive
  const triggerBackupPayroll = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Sao lưu Bảng Lương Tháng ${currentMonth} lên Google Drive?`,
      description: `Hệ thống sẽ tổng hợp bảng lương của ${employees.length} nhân sự và tải lên thư mục Google Drive 'HRM Enterprise - Sao Lưu Bảng Lương & Hợp Đồng'.`,
      action: async () => {
        setIsBackingUp(true);
        setBackupActionName('Đang sao lưu bảng lương...');
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const fileName = `Bang_Luong_Thang_${currentMonth}_${timestamp}.json`;

          const payrollData = {
            exportDate: new Date().toISOString(),
            month: currentMonth,
            employeeCount: employees.length,
            records: payrollItems,
            summary: {
              totalGross: payrollItems.reduce((s, p) => s + (p.grossIncome || 0), 0),
              totalNet: payrollItems.reduce((s, p) => s + (p.netIncome || 0), 0),
            },
          };

          await uploadFileToDrive(
            fileName,
            JSON.stringify(payrollData, null, 2),
            'application/json'
          );

          showToast(`Đã sao lưu Bảng Lương tháng ${currentMonth} lên Google Drive!`, 'success');
          await fetchDriveFiles();
        } catch (err: any) {
          showToast(`Lỗi sao lưu: ${err.message}`, 'error');
        } finally {
          setIsBackingUp(false);
          setBackupActionName('');
          setConfirmDialog(null);
        }
      },
    });
  };

  // 2. Backup Employee Contracts & Profiles to Google Drive
  const triggerBackupContracts = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sao lưu Hồ Sơ & Hợp Đồng Nhân Sự lên Google Drive?',
      description: `Hệ thống sẽ đóng gói thông tin hợp đồng lao động, bảo hiểm và hồ sơ của ${employees.length} nhân viên lên Google Drive.`,
      action: async () => {
        setIsBackingUp(true);
        setBackupActionName('Đang sao lưu hợp đồng lao động...');
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const fileName = `Ho_So_Hop_Dong_Nhan_Su_${timestamp}.json`;

          const contractsData = {
            exportDate: new Date().toISOString(),
            totalEmployees: employees.length,
            contractsCount: contracts.length,
            contractsList: contracts,
            employees: employees.map((e) => {
              const contract = contracts.find((c) => c.employeeId === e.id);
              return {
                code: e.code,
                fullName: e.fullName,
                position: e.position,
                departmentId: e.departmentId,
                departmentName: departments.find((d) => d.id === e.departmentId)?.name || '',
                joinDate: e.joinDate,
                identityCard: e.identityCard,
                socialInsuranceCode: e.socialInsuranceCode,
                bankAccount: e.bankAccount,
                bankName: e.bankName,
                contractCode: contract?.code,
                contractType: contract?.contractType,
                contractTypeName: contract?.contractTypeName,
                contractStartDate: contract?.startDate,
                contractEndDate: contract?.endDate,
                baseSalary: contract?.baseSalary,
                insuranceSalary: contract?.insuranceSalary,
                contractStatus: contract?.status,
              };
            }),
          };

          await uploadFileToDrive(
            fileName,
            JSON.stringify(contractsData, null, 2),
            'application/json'
          );

          showToast('Đã sao lưu Hồ Sơ & Hợp Đồng Nhân Sự lên Google Drive thành công!', 'success');
          await fetchDriveFiles();
        } catch (err: any) {
          showToast(`Lỗi sao lưu: ${err.message}`, 'error');
        } finally {
          setIsBackingUp(false);
          setBackupActionName('');
          setConfirmDialog(null);
        }
      },
    });
  };

  // 3. Backup Full System (Save Project State)
  const triggerBackupFullSystem = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Lưu & Sao lưu Toàn Bộ Dự Án lên Google Drive?',
      description: `Toàn bộ dữ liệu của dự án HRM (Nhân sự, Công trình, Bảng chấm công 31 ngày, Bảng lương, Cấu hình) sẽ được lưu trữ an toàn vào Google Drive của bạn.`,
      action: async () => {
        setIsBackingUp(true);
        setBackupActionName('Đang lưu trữ toàn bộ dự án...');
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const fileName = `Du_An_HRM_Enterprise_FullBackup_${timestamp}.json`;

          const fullState = {
            appName: 'HRM Enterprise - Quản Lý Nhân Sự & Thang Bảng Lương',
            backupTimestamp: new Date().toISOString(),
            currentMonth,
            departments,
            projects,
            employees,
            timesheets,
            contracts,
            payrollItems,
          };

          await uploadFileToDrive(
            fileName,
            JSON.stringify(fullState, null, 2),
            'application/json'
          );

          showToast('Đã lưu và đồng bộ toàn bộ dự án lên Google Drive thành công!', 'success');
          await fetchDriveFiles();
        } catch (err: any) {
          showToast(`Lỗi lưu dự án: ${err.message}`, 'error');
        } finally {
          setIsBackingUp(false);
          setBackupActionName('');
          setConfirmDialog(null);
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center border border-blue-500/40 shadow-xs">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Sao Lưu & Lưu Trữ Google Drive
                <span className="text-[10px] bg-blue-800 text-blue-200 px-2 py-0.5 rounded font-mono font-normal">
                  Google Workspace
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Lưu dự án, sao lưu bảng lương và hợp đồng lao động trực tiếp vào Google Drive cá nhân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Account Status Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow-2xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border-2 border-emerald-400">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900 text-sm">{user.displayName || 'Tài khoản Google'}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã kết nối
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs font-mono">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">Chưa kết nối Google Drive</div>
                  <p className="text-slate-500 text-xs">
                    Đăng nhập tài khoản Google để cấp quyền sao lưu dữ liệu tự động
                  </p>
                </div>
              </div>
            )}

            <div>
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium flex items-center gap-1.5 cursor-pointer text-xs transition-colors shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoadingAuth}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded font-semibold flex items-center gap-2 cursor-pointer text-xs transition-all shadow-xs hover:border-blue-400 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isLoadingAuth ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Backup Action Cards */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-blue-700" />
              Tùy Chọn Sao Lưu Lên Google Drive
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Payroll */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-col justify-between hover:bg-blue-50 transition-colors">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Bảng Lương Tháng</h5>
                  <p className="text-[11px] text-slate-600">
                    Sao lưu bảng lương chi tiết tháng {currentMonth} của {employees.length} nhân viên.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={triggerBackupPayroll}
                  disabled={!user || isBackingUp}
                  className="mt-3 w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-xs cursor-pointer transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Sao lưu Bảng Lương</span>
                </button>
              </div>

              {/* Card 2: Contracts */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex flex-col justify-between hover:bg-emerald-50 transition-colors">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Hồ Sơ & Hợp Đồng</h5>
                  <p className="text-[11px] text-slate-600">
                    Sao lưu hợp đồng lao động, mức lương đóng BHXH và thông tin nhân sự.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={triggerBackupContracts}
                  disabled={!user || isBackingUp}
                  className="mt-3 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs cursor-pointer transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sao lưu Hợp Đồng</span>
                </button>
              </div>

              {/* Card 3: Full Project State */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-lg flex flex-col justify-between hover:bg-indigo-50 transition-colors">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <Database className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Lưu Toàn Bộ Dự Án</h5>
                  <p className="text-[11px] text-slate-600">
                    Lưu trữ toàn bộ công trình, nhân sự, lịch chấm công 31 ngày và bảng lương.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={triggerBackupFullSystem}
                  disabled={!user || isBackingUp}
                  className="mt-3 w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-bold text-xs cursor-pointer transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Lưu Dự Án Lên Drive</span>
                </button>
              </div>
            </div>

            {isBackingUp && (
              <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-900 flex items-center space-x-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
                <span className="font-semibold text-xs">{backupActionName}</span>
              </div>
            )}
          </div>

          {/* Previous Backups History */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-slate-600" />
                Các bản sao lưu trên Google Drive:
              </span>
              {user && (
                <button
                  type="button"
                  onClick={fetchDriveFiles}
                  disabled={isLoadingFiles}
                  className="text-blue-700 hover:text-blue-900 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>Làm mới danh sách</span>
                </button>
              )}
            </div>

            {!user ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-xs">
                Vui lòng đăng nhập Google để xem các bản sao lưu đã lưu trữ.
              </div>
            ) : backupFiles.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-xs">
                {isLoadingFiles
                  ? 'Đang tải danh sách bản sao lưu...'
                  : 'Chưa có bản sao lưu nào trong thư mục. Hãy bấm sao lưu ở trên để bắt đầu lưu trữ!'}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-2xs">
                {backupFiles.map((file) => (
                  <div key={file.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        {file.name.includes('Bang_Luong') ? (
                          <DollarSign className="w-3.5 h-3.5" />
                        ) : file.name.includes('Hop_Dong') ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : (
                          <Database className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 text-xs block truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(file.createdTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-blue-700 hover:text-white hover:bg-blue-700 border border-blue-200 rounded font-medium flex items-center gap-1 shrink-0 text-[11px] transition-colors ml-2"
                        title="Mở file trên Google Drive"
                      >
                        <span>Mở Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Thư mục lưu trữ: <strong>HRM Enterprise - Sao Lưu Bảng Lương & Hợp Đồng</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium text-xs cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirmation Modal (User Confirmation for Destructive/Mutating Operations) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{confirmDialog.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDialog.action}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs cursor-pointer shadow-xs"
              >
                Xác nhận sao lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
