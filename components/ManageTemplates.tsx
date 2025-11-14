
import React from 'react';
import type { Template } from '../types';

interface ManageTemplatesProps {
  templates: Template[];
  onDeleteTemplate: (id: string) => void;
  onEditTemplate: (id: string) => void;
  onCreateNew: () => void;
}

const ManageTemplates: React.FC<ManageTemplatesProps> = ({ templates, onDeleteTemplate, onEditTemplate, onCreateNew }) => {
  return (
    <div className="h-full flex flex-col p-2">
      <button 
        onClick={onCreateNew}
        className="w-full mb-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>إنشاء قالب جديد</span>
      </button>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">القوالب المحفوظة</h2>
        {templates.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا يوجد قوالب محفوظة حاليًا.</p>
        ) : (
          <ul className="space-y-3">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <span className="text-gray-800 font-medium">{template.name}</span>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => onEditTemplate(template.id)}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors"
                    aria-label={`تعديل ${template.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => onDeleteTemplate(template.id)}
                    className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                    aria-label={`حذف ${template.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManageTemplates;
