import React from 'react';
import type { ReportData, Template, TemplateElement } from '../types';

interface ReportViewProps {
  reportData: ReportData;
  template: Template | undefined;
  isPdfMode?: boolean;
}

const ReportView: React.FC<ReportViewProps> = ({ reportData, template, isPdfMode = false }) => {
  
  const getProcessedContent = (content: string) => {
    const allDiagnoses = [
        reportData.diagnosisChildrenMale,
        reportData.diagnosisChildrenFemale,
        reportData.diagnosisYouthMale,
        reportData.diagnosisYouthFemale,
        reportData.diagnosisAdultsMale,
        reportData.diagnosisAdultsFemale,
    ].filter(Boolean).join('، ');

    const data: Record<string, string> = {
        '{{patientName}}': reportData.patientName || 'غير محدد',
        '{{date}}': reportData.date || 'غير محدد',
        '{{doctorName}}': reportData.doctorName || 'غير محدد',
        '{{diagnosisChildrenMale}}': reportData.diagnosisChildrenMale || '',
        '{{diagnosisChildrenFemale}}': reportData.diagnosisChildrenFemale || '',
        '{{diagnosisYouthMale}}': reportData.diagnosisYouthMale || '',
        '{{diagnosisYouthFemale}}': reportData.diagnosisYouthFemale || '',
        '{{diagnosisAdultsMale}}': reportData.diagnosisAdultsMale || '',
        '{{diagnosisAdultsFemale}}': reportData.diagnosisAdultsFemale || '',
        '{{allDiagnoses}}': allDiagnoses || 'لا يوجد',
    };

    let processed = content;
    for (const key in data) {
      processed = processed.replace(new RegExp(key, 'g'), data[key]);
    }
    return processed;
  };

  const A4_WIDTH_PX_300DPI = 2480;
  const A4_HEIGHT_PX_300DPI = 3508;

  const renderElements = () => {
      if (!template) return null;
      
      const designerWidth = template.designerCanvasWidth || A4_WIDTH_PX_300DPI;
      const scaleFactor = isPdfMode ? A4_WIDTH_PX_300DPI / designerWidth : 1;

      return template.elements.map((el: TemplateElement) => {
          const commonStyle: React.CSSProperties = {
              position: 'absolute',
              top: `${el.positionPercent.y}%`,
              right: `${el.positionPercent.x}%`, // Corrected from 'left' to 'right' for RTL
              width: `${el.widthPercent}%`,
              height: `${el.heightPercent}%`,
          };

          if (el.type === 'image') {
              return (
                  <div
                      key={el.id}
                      className="report-element"
                      data-id={el.id}
                      data-top-percent={el.positionPercent.y}
                      style={commonStyle}
                  >
                      <img src={el.content} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="template element" />
                  </div>
              );
          }
          
          if (el.type === 'text') {
              const scaledFontSize = el.fontSize ? el.fontSize * scaleFactor : undefined;
              const textStyle: React.CSSProperties = {
                  ...commonStyle,
                  fontFamily: el.fontFamily,
                  fontSize: scaledFontSize ? `${scaledFontSize}px` : (isPdfMode ? undefined : el.fontSize),
                  color: el.color,
                  textAlign: el.textAlign,
                  fontWeight: el.fontWeight,
                  fontStyle: el.fontStyle,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  display: 'block',
              };
              
              return (
                <div
                  key={el.id}
                  className="report-element report-text-element"
                  data-id={el.id}
                  data-top-percent={el.positionPercent.y}
                  style={textStyle}
                >
                  {getProcessedContent(el.content)}
                </div>
              );
          }

          return null;
      });
  };

  if (!template) {
    return (
        <div className="report-a4-container flex items-center justify-center">
            <p className="text-gray-500">الرجاء اختيار قالب لعرض التقرير.</p>
        </div>
    );
  }
  
  return (
    <div className={`report-a4-container ${isPdfMode ? 'bg-white' : ''}`} style={isPdfMode ? { width: `${A4_WIDTH_PX_300DPI}px`, height: `${A4_HEIGHT_PX_300DPI}px` } : {}}>
        <div className="relative w-full h-full">
            {renderElements()}
        </div>
    </div>
  );
};

export default ReportView;