
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Diagnosis, Doctor, Template, ReportData } from '../types';
import { AgeGroup, Gender } from '../types';
import ReportView from './ReportView';
import type { View } from '../App';


// Fix: Add declarations for jspdf and html2canvas which are assumed to be loaded via script tags.
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (orientation?: string, unit?: string, format?: string) => any;
    };
  }
}
declare const html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;

interface MainFormProps {
  diagnoses: Diagnosis[];
  doctors: Doctor[];
  templates: Template[];
  setView: (view: View) => void;
}

const MaterialInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string;}> = ({ label, ...props }) => (
    <div className="relative bg-slate-100 rounded-t-lg border-b-2 border-slate-300 focus-within:border-blue-600 pt-4 transition-colors">
      <input
        {...props}
        placeholder=" " 
        className="block w-full px-3 pb-2 bg-transparent outline-none text-gray-800 peer"
      />
      <label
        className="absolute top-4 right-3 text-gray-500 duration-300 transform -translate-y-3 scale-75 origin-top-right
                   peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                   peer-focus:scale-75 peer-focus:-translate-y-3
                   pointer-events-none"
      >
        {label}
      </label>
    </div>
);

const MaterialSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; }> = ({ label, value, onChange, children }) => (
    <div className="relative bg-slate-100 rounded-t-lg border-b-2 border-slate-300 focus-within:border-blue-600 pt-4 transition-colors flex-1">
        <select
            value={value}
            onChange={onChange}
            className="block w-full px-2 pb-2 bg-transparent outline-none text-gray-800 appearance-none"
        >
            {children}
        </select>
        <label className={`absolute top-1 right-3 text-gray-500 duration-300 transform scale-75 origin-top-right pointer-events-none ${value ? '' : 'text-transparent'}`}>
            {label}
        </label>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const adjustReportLayout = (reportContainer: HTMLElement) => {
    const elements = Array.from(reportContainer.querySelectorAll<HTMLElement>('.report-element'));
    
    elements.sort((a, b) => {
        const topA = parseFloat(a.dataset.topPercent || '0');
        const topB = parseFloat(b.dataset.topPercent || '0');
        return topA - topB;
    });

    let cumulativeShift = 0;
    const containerHeight = reportContainer.offsetHeight;

    elements.forEach(el => {
        if (cumulativeShift > 0) {
            const currentTopPercent = parseFloat(el.dataset.topPercent || '0');
            const newTopPx = (currentTopPercent / 100 * containerHeight) + cumulativeShift;
            el.style.top = `${newTopPx}px`;
        }

        if (el.classList.contains('report-text-element')) {
            const designedHeight = el.offsetHeight;
            const actualContentHeight = el.scrollHeight;
            
            if (actualContentHeight > designedHeight) {
                const heightDifference = actualContentHeight - designedHeight;
                el.style.height = `${actualContentHeight}px`;
                cumulativeShift += heightDifference;
            }
        }
    });
};


const MainForm: React.FC<MainFormProps> = ({ diagnoses, doctors, templates, setView }) => {
  const [reportData, setReportData] = useState<ReportData>({
    patientName: '',
    date: new Date().toISOString().split('T')[0],
    doctorName: '',
    diagnosisChildrenMale: '',
    diagnosisChildrenFemale: '',
    diagnosisYouthMale: '',
    diagnosisYouthFemale: '',
    diagnosisAdultsMale: '',
    diagnosisAdultsFemale: '',
    templateId: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const actionToPerform = useRef<'print' | 'pdf' | null>(null);

  useEffect(() => {
    if (isGenerating && reportRef.current) {
        
        const performAction = async () => {
            const elementToCapture = reportRef.current!.querySelector('.report-a4-container') as HTMLElement;
            if (!elementToCapture) {
                console.error("Report element for generation not found.");
                setIsGenerating(false);
                return;
            }

            // Adjust layout before capturing for print or PDF
            adjustReportLayout(elementToCapture);

            if (actionToPerform.current === 'print') {
                window.print();
            } else if (actionToPerform.current === 'pdf') {
                const { jsPDF } = window.jspdf;
                
                const canvas = await html2canvas(elementToCapture, {
                    scale: 1, // Use a scale of 1 as we are sizing the element itself to be high-res
                    useCORS: true,
                    logging: false,
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('report.pdf');
            }
            
            // Cleanup after action
            actionToPerform.current = null;
            setIsGenerating(false);
        };

        // Delay to allow fonts and high-res rendering to complete.
        setTimeout(performAction, 500);
    }
  }, [isGenerating]);

  const filterDiagnoses = (ageGroup: AgeGroup, gender: Gender) =>
    useMemo(() => diagnoses.filter(d => d.ageGroup === ageGroup && d.gender === gender), [diagnoses, ageGroup, gender]);

  const diagnosesChildrenMale = filterDiagnoses(AgeGroup.Children, Gender.Male);
  const diagnosesChildrenFemale = filterDiagnoses(AgeGroup.Children, Gender.Female);
  const diagnosesYouthMale = filterDiagnoses(AgeGroup.Youth, Gender.Male);
  const diagnosesYouthFemale = filterDiagnoses(AgeGroup.Youth, Gender.Female);
  const diagnosesAdultsMale = filterDiagnoses(AgeGroup.Adults, Gender.Male);
  const diagnosesAdultsFemale = filterDiagnoses(AgeGroup.Adults, Gender.Female);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePrint = () => {
    if (isGenerating || !reportData.templateId) {
        if (!reportData.templateId) alert('الرجاء اختيار قالب أولاً.');
        return;
    }
    actionToPerform.current = 'print';
    setIsGenerating(true);
  };

  const handleSavePdf = () => {
    if (isGenerating || !reportData.templateId) {
        if (!reportData.templateId) alert('الرجاء اختيار قالب أولاً.');
        return;
    }
    actionToPerform.current = 'pdf';
    setIsGenerating(true);
  };
  
  const selectedTemplate = templates.find(t => t.id === reportData.templateId);

  return (
    <div className="space-y-6">
      <Section title="بيانات المريض والتشخيص">
        <MaterialInput label="اسم المريض" name="patientName" value={reportData.patientName} onChange={handleChange} />
        
        <div className="flex gap-4"><span className="text-sm font-medium text-gray-500 mt-2">تشخيص الأطفال</span></div>
        <div className="flex gap-4">
          <MaterialSelect label="ذكور" value={reportData.diagnosisChildrenMale} onChange={(e) => setReportData(p => ({...p, diagnosisChildrenMale: e.target.value}))}>
              <option value="">اختر تشخيص</option>
              {diagnosesChildrenMale.map(d => <option key={d.id} value={d.text}>{d.text}</option>)}
          </MaterialSelect>
          <MaterialSelect label="إناث" value={reportData.diagnosisChildrenFemale} onChange={(e) => setReportData(p => ({...p, diagnosisChildrenFemale: e.target.value}))}>
              <option value="">اختر تشخيص</option>
              {diagnosesChildrenFemale.map(d => <option key={d.id} value={d.text}>{d.text}</option>)}
          </MaterialSelect>
        </div>

        <div className="flex gap-4"><span className="text-sm font-medium text-gray-500 mt-2">تشخيص الشباب</span></div>
        <div className="flex gap-4">
            <MaterialSelect label="ذكور" value={reportData.diagnosisYouthMale} onChange={(e) => setReportData(p => ({...p, diagnosisYouthMale: e.target.value}))}>
                <option value="">اختر تشخيص</option>
                {diagnosesYouthMale.map(d => <option key={d.id} value={d.text}>{d.text}</option>)}
            </MaterialSelect>
            <MaterialSelect label="إناث" value={reportData.diagnosisYouthFemale} onChange={(e) => setReportData(p => ({...p, diagnosisYouthFemale: e.target.value}))}>
                <option value="">اختر تشخيص</option>
                {diagnosesYouthFemale.map(d => <option key={d.id} value={d.text}>{d.text}</option>)}
            </MaterialSelect>
        </div>
        
        <div className="flex gap-4"><span className="text-sm font-medium text-gray-500 mt-2">تشخيص الكبار</span></div>
        <div className="flex gap-4">
            <MaterialSelect label="ذكور" value={reportData.diagnosisAdultsMale} onChange={(e) => setReportData(p => ({...p, diagnosisAdultsMale: e.target.value}))}>
                <option value="">اختر تشخيص</option>
                {diagnosesAdultsMale.map(d => <option key={d.id} value={d.text}>{d.text}</option>)}
            </MaterialSelect>
            <MaterialSelect label="إناث" value={reportData.diagnosisAdultsFemale} onChange={(e) => setReportData(p => ({...p, diagnosisAdultsFemale: e.target.value}))}>
                <option value="">اختر تشخيص</option>
                {diagnosesAdultsFemale.map(d => <option key={d.id} value={d.text}>{d.text}</option>)}
            </MaterialSelect>
        </div>
      </Section>

      <Section title="بيانات التقرير">
        <MaterialSelect label="اختر قالب" value={reportData.templateId} onChange={(e) => setReportData(p => ({...p, templateId: e.target.value}))}>
            <option value="">اختر قالب</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </MaterialSelect>
        
        <MaterialSelect label="اختر طبيب" value={reportData.doctorName} onChange={(e) => setReportData(p => ({...p, doctorName: e.target.value}))}>
            <option value="">اختر طبيب</option>
            {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </MaterialSelect>

        <MaterialInput label="التاريخ" name="date" type="date" value={reportData.date} onChange={handleChange} />
      </Section>

      <Section title="إدارة البيانات">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setView('addDiagnosis')} className="w-full px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-all">إدارة التشخيصات</button>
            <button onClick={() => setView('addDoctor')} className="w-full px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-all">إدارة الأطباء</button>
            <button onClick={() => setView('manageTemplates')} className="w-full px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-all col-span-1 md:col-span-2">إدارة القوالب</button>
        </div>
      </Section>

      <Section title="الإجراءات">
        <div className="flex gap-4">
            <button onClick={handlePrint} className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all" disabled={isGenerating}>
                {isGenerating && actionToPerform.current === 'print' ? 'جاري الطباعة...' : 'طباعة'}
            </button>
            <button onClick={handleSavePdf} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all" disabled={isGenerating}>
                {isGenerating && actionToPerform.current === 'pdf' ? 'جاري الحفظ...' : 'حفظ PDF'}
            </button>
        </div>
      </Section>

      {/* Hidden report view for printing/PDF generation. Positioned off-screen. */}
      <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
        {selectedTemplate && (
          <div id="print-area">
            <div ref={reportRef}>
              <ReportView reportData={reportData} template={selectedTemplate} isPdfMode={true} />
            </div>
          </div>
        )}
      </div>
      
      {/* Visible report preview */}
      {selectedTemplate && (
          <Section title="معاينة التقرير">
              <div className="report-a4-container-preview overflow-hidden border border-gray-300">
                  <ReportView reportData={reportData} template={selectedTemplate} />
              </div>
          </Section>
      )}
    </div>
  );
};

export default MainForm;
