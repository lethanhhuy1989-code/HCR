import React, { useState, useEffect } from 'react';
import { useHRM } from '../context/HRMContext';
import { SalaryGrade } from '../types/hrm';
import { formatNumberVN } from '../utils/payrollCalculator';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Plus, Trash2, Copy, Save, AlertCircle, CheckCircle2, FileSpreadsheet, FileText } from 'lucide-react';

export const SalaryScaleMatrix: React.FC = () => {
  const { grades, batchUpdateGrades, showToast } = useHRM();

  // Local draft state for pristine inline editing
  const [draftGrades, setDraftGrades] = useState<SalaryGrade[]>(() => JSON.parse(JSON.stringify(grades)));
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Sync when grades in context change externally
  useEffect(() => {
    setDraftGrades(JSON.parse(JSON.stringify(grades)));
    setHasChanges(false);
  }, [grades]);

  // Update grade name
  const handleNameChange = (gradeIdx: number, newName: string) => {
    const updated = [...draftGrades];
    updated[gradeIdx].name = newName;
    setDraftGrades(updated);
    setHasChanges(true);
  };

  // Update standard base rate
  const handleStandardBaseChange = (gradeIdx: number, valueStr: string) => {
    const cleanNum = parseFloat(valueStr.replace(/[^0-9]/g, '')) || 0;
    const updated = [...draftGrades];
    updated[gradeIdx].standardBaseRate = cleanNum;
    setDraftGrades(updated);
    setHasChanges(true);
  };

  // Update coefficient for a tier (0..7)
  const handleCoefficientChange = (gradeIdx: number, tierIdx: number, valStr: string) => {
    const cleanVal = parseFloat(valStr) || 0;
    const updated = [...draftGrades];
    updated[gradeIdx].coefficients[tierIdx] = cleanVal;
    setDraftGrades(updated);
    setHasChanges(true);
  };

  // Update competency salary for a tier
  const handleCompetencyChange = (gradeIdx: number, tierIdx: number, valStr: string) => {
    const cleanNum = parseFloat(valStr.replace(/[^0-9]/g, '')) || 0;
    const updated = [...draftGrades];
    updated[gradeIdx].competencySalaries[tierIdx] = cleanNum;
    setDraftGrades(updated);
    setHasChanges(true);
  };

  // Add a new grade
  const handleAddGrade = () => {
    const newIdx = draftGrades.length + 1;
    const newGrade: SalaryGrade = {
      id: `grade-${Date.now()}`,
      code: `NG-${newIdx}`,
      name: `Vị trí chức danh mới ${newIdx}`,
      standardBaseRate: 6000000,
      coefficients: [1.00, 1.20, 1.40, 1.60, 1.80, 2.00, 2.20, 2.50],
      competencySalaries: [0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000],
      description: 'Ngạch lương bổ sung mới'
    };
    setDraftGrades([...draftGrades, newGrade]);
    setHasChanges(true);
    showToast('Đã thêm 1 dòng ngạch lương mới vào bảng ma trận');
  };

  // Duplicate an existing grade
  const handleDuplicateGrade = (gradeIdx: number) => {
    const source = draftGrades[gradeIdx];
    const duplicated: SalaryGrade = {
      ...JSON.parse(JSON.stringify(source)),
      id: `grade-${Date.now()}`,
      code: `${source.code}-COPY`,
      name: `${source.name} (Bản sao)`,
    };
    const updated = [...draftGrades];
    updated.splice(gradeIdx + 1, 0, duplicated);
    setDraftGrades(updated);
    setHasChanges(true);
    showToast(`Đã sao chép ngạch "${source.name}"`);
  };

  // Delete a grade
  const handleDeleteGrade = (gradeIdx: number) => {
    if (draftGrades.length <= 1) {
      showToast('Cần duy trì ít nhất 1 ngạch lương trong hệ thống', 'error');
      return;
    }
    const name = draftGrades[gradeIdx].name;
    const updated = draftGrades.filter((_, idx) => idx !== gradeIdx);
    setDraftGrades(updated);
    setHasChanges(true);
    showToast(`Đã xóa ngạch "${name}" khỏi bản nháp`, 'info');
  };

  // Save changes
  const handleSave = () => {
    batchUpdateGrades(draftGrades);
    setHasChanges(false);
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã Ngạch',
      'Tên Ngạch / Vị Trí',
      'Chỉ Tiêu',
      'Bậc 1',
      'Bậc 2',
      'Bậc 3',
      'Bậc 4',
      'Bậc 5',
      'Bậc 6',
      'Bậc 7',
      'Bậc 8',
    ];
    const rows: (string | number)[][] = [];
    draftGrades.forEach((g, idx) => {
      rows.push([
        idx + 1,
        g.code,
        g.name,
        'Hệ số lương',
        ...g.coefficients.map((c) => c.toFixed(2)),
      ]);
      rows.push([
        '',
        '',
        `Lương chuẩn: ${formatNumberVN(g.standardBaseRate)} đ`,
        'Lương cơ bản (VNĐ)',
        ...g.coefficients.map((c) => Math.round(g.standardBaseRate * c)),
      ]);
      rows.push([
        '',
        '',
        '',
        'Phụ cấp năng lực (VNĐ)',
        ...g.competencySalaries,
      ]);
    });
    exportToExcel({
      fileName: `Thang_Bang_Luong_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'ThangLuong',
      title: 'HỆ THỐNG THANG BẢNG LƯƠNG & NGẠCH BẬC DOANH NGHIỆP',
      subtitles: [
        'Công ty Cổ phần Xây dựng | Tiêu chuẩn 8 bậc chức danh chuyên môn',
        `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
      ],
      headers,
      rows,
    });
    showToast('Đã xuất file Excel Thang bảng lương thành công!');
  };

  // Export PDF (.pdf)
  const handleExportPDF = () => {
    const headers = ['STT', 'Ma', 'Ten Ngach', 'Muc', 'Bac 1', 'Bac 2', 'Bac 3', 'Bac 4', 'Bac 5', 'Bac 6', 'Bac 7', 'Bac 8'];
    const rows: (string | number)[][] = [];
    draftGrades.forEach((g, idx) => {
      rows.push([
        idx + 1,
        g.code,
        g.name,
        'He so',
        ...g.coefficients.map((c) => c.toFixed(2)),
      ]);
      rows.push([
        '',
        '',
        `CB: ${formatNumberVN(g.standardBaseRate)}`,
        'Luong',
        ...g.coefficients.map((c) => (Math.round(g.standardBaseRate * c) / 1000).toFixed(0) + 'k'),
      ]);
    });
    exportToPDF({
      fileName: `Thang_Bang_Luong_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'THANG BANG LUONG VA NGACH BAC DOANH NGHIEP',
      subtitles: [`Cong ty CP Xay dung | Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`],
      headers,
      rows,
      orientation: 'landscape',
    });
    showToast('Đã xuất file PDF Thang bảng lương thành công!');
  };

  const tierHeaders = ['Bậc 1', 'Bậc 2', 'Bậc 3', 'Bậc 4', 'Bậc 5', 'Bậc 6', 'Bậc 7', 'Bậc 8'];

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-hidden">
      {/* Information Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Thang Bảng Lương & Ngạch Bậc Doanh Nghiệp
            {hasChanges && (
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Có thay đổi chưa lưu
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hệ số lương, mức lương cơ bản và phụ cấp năng lực 8 bậc chuẩn theo luật lao động Việt Nam.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
            title="Xuất Thang bảng lương ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center space-x-1.5 transition-colors border border-rose-300 shadow-2xs cursor-pointer"
            title="Xuất Thang bảng lương ra file PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Xuất PDF (.pdf)</span>
          </button>

          {hasChanges && (
            <button
              onClick={() => {
                setDraftGrades(JSON.parse(JSON.stringify(grades)));
                setHasChanges(false);
                showToast('Đã hoàn tác các thay đổi', 'info');
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 text-xs font-semibold rounded shadow-xs flex items-center space-x-1.5 transition-all ${
              hasChanges
                ? 'bg-[#1E40AF] hover:bg-blue-800 text-white shadow-md cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Cập nhật bảng lương</span>
          </button>
        </div>
      </div>

      {/* Main Matrix Table replicating the screenshot */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
            {/* Table Header matching the screenshot */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 w-10 text-center font-bold">#</th>
                <th className="py-3 px-4 w-72">Tên ngạch lương</th>
                {tierHeaders.map((header) => (
                  <th key={header} className="py-3 px-3 text-center min-w-[105px]">
                    {header}
                  </th>
                ))}
                <th className="py-3 px-3 w-20 text-center">Thao tác</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {draftGrades.map((grade, gradeIdx) => {
                return (
                  <React.Fragment key={grade.id}>
                    {/* Sub-row 1: Grade Name & Coefficients */}
                    <tr className="hover:bg-blue-50/20 transition-colors">
                      {/* Row index spanning all 3 sub-rows */}
                      <td
                        rowSpan={3}
                        className="py-3 px-3 text-center font-semibold text-slate-600 border-r border-slate-200 bg-slate-50/50 align-middle"
                      >
                        {gradeIdx + 1}
                      </td>

                      {/* Grade Name Input */}
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={grade.name}
                          onChange={(e) => handleNameChange(gradeIdx, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          placeholder="Nhập tên ngạch lương..."
                        />
                      </td>

                      {/* Tier 1 - 8 Coefficients */}
                      {grade.coefficients.map((coeff, tierIdx) => (
                        <td key={tierIdx} className="p-1.5 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={coeff}
                            onChange={(e) => handleCoefficientChange(gradeIdx, tierIdx, e.target.value)}
                            className="w-full px-2 py-1 text-center font-mono tabular-nums text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            title={`Hệ số lương Bậc ${tierIdx + 1}`}
                          />
                        </td>
                      ))}

                      {/* Actions column spanning all 3 rows */}
                      <td
                        rowSpan={3}
                        className="p-2 text-center align-middle bg-slate-50/30"
                      >
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <button
                            onClick={() => handleDuplicateGrade(gradeIdx)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Nhân bản ngạch lương này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(gradeIdx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa ngạch lương"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-row 2: Standard Base Salary & Calculated Tier Base Pay */}
                    <tr className="hover:bg-blue-50/20 transition-colors bg-slate-50/40">
                      <td className="p-2 border-r border-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-600 text-[11px] whitespace-nowrap shrink-0">
                            Mức lương cơ bản:
                          </span>
                          <input
                            type="text"
                            value={formatNumberVN(grade.standardBaseRate)}
                            onChange={(e) => handleStandardBaseChange(gradeIdx, e.target.value)}
                            className="w-full px-2 py-1 text-right font-mono tabular-nums text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      </td>

                      {/* Tier 1 - 8 Computed Base Salaries (standardBase * coeff) */}
                      {grade.coefficients.map((coeff, tierIdx) => {
                        const calculatedBase = Math.round(grade.standardBaseRate * coeff);
                        return (
                          <td
                            key={tierIdx}
                            className="p-1.5 border-r border-slate-200 text-right bg-slate-100/70"
                          >
                            <div className="px-1.5 py-1 font-mono tabular-nums text-xs text-slate-800 text-right font-medium">
                              {formatNumberVN(calculatedBase, 2)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Sub-row 3: Competency Pay (Lương theo năng lực) */}
                    <tr className="hover:bg-blue-50/20 transition-colors border-b border-slate-300">
                      <td className="p-2 border-r border-slate-200">
                        <span className="text-slate-600 text-[11px]">
                          Lương theo năng lực:
                        </span>
                      </td>

                      {/* Tier 1 - 8 Competency Pay Inputs */}
                      {grade.competencySalaries.map((compSalary, tierIdx) => (
                        <td key={tierIdx} className="p-1.5 border-r border-slate-200 text-right">
                          <input
                            type="text"
                            value={formatNumberVN(compSalary, 2)}
                            onChange={(e) => handleCompetencyChange(gradeIdx, tierIdx, e.target.value)}
                            className="w-full px-2 py-1 text-right font-mono tabular-nums text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            title={`Lương năng lực Bậc ${tierIdx + 1}`}
                          />
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions footer matching screenshot */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Orange "+ Thêm ngạch lương" button exactly as pictured */}
          <button
            onClick={handleAddGrade}
            className="text-orange-500 hover:text-orange-600 font-semibold text-xs flex items-center space-x-1 transition-colors self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm ngạch lương</span>
          </button>

          {/* Blue "Cập nhật" button exactly as pictured */}
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold rounded bg-[#1E3A8A] hover:bg-blue-800 text-white shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      {/* Guide Note */}
      <div className="mt-4 p-3 bg-blue-50/60 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start space-x-2">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Nguyên tắc tính toán:</span> Mức lương cơ bản của từng bậc = [Mức lương cơ bản tiêu chuẩn] × [Hệ số bậc]. Tổng mức lương của một nhân sự xếp tại bậc đó bao gồm Lương cơ bản theo bậc + Lương theo năng lực của bậc tương ứng. Khi cập nhật thang bảng lương, bảng tính tiền lương tháng sẽ tự động đồng bộ ngay lập tức.
        </div>
      </div>
    </div>
  );
};
