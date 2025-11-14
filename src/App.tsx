
import React, { useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Diagnosis, Doctor, Template } from './types';
import MainForm from './components/MainForm';
import AddDiagnosisForm from './components/AddDiagnosisForm';
import AddDoctorForm from './components/AddDoctorForm';
import TemplateDesigner from './components/TemplateDesigner';
import ManageTemplates from './components/ManageTemplates';

export type View = 'main' | 'addDiagnosis' | 'addDoctor' | 'designTemplate' | 'manageTemplates';

const App: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [diagnoses, setDiagnoses] = useLocalStorage<Diagnosis[]>('diagnoses', []);
  const [doctors, setDoctors] = useLocalStorage<Doctor[]>('doctors', []);
  const [templates, setTemplates] = useLocalStorage<Template[]>('templates', []);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const changeView = (newView: View) => {
    if (view === 'designTemplate' && newView !== 'designTemplate') {
      setEditingTemplate(null); // Cleanup when leaving designer
    }
    setView(newView);
  };

  const addDiagnosis = (diagnosis: Omit<Diagnosis, 'id'>) => {
    setDiagnoses([...diagnoses, { ...diagnosis, id: Date.now().toString() }]);
  };

  const deleteDiagnosis = (id: string) => {
    setDiagnoses(diagnoses.filter(d => d.id !== id));
  };

  const addDoctor = (doctor: Omit<Doctor, 'id'>) => {
    setDoctors([...doctors, { ...doctor, id: Date.now().toString() }]);
  };

  const deleteDoctor = (id: string) => {
    setDoctors(doctors.filter(d => d.id !== id));
  };

  const saveTemplate = (templateData: Omit<Template, 'id'> & { id?: string }) => {
    if (templateData.id) {
      // Update existing
      setTemplates(templates.map(t => t.id === templateData.id ? { ...t, ...templateData } : t));
    } else {
      // Add new
      setTemplates([...templates, { ...templateData, id: Date.now().toString() } as Template]);
    }
    setEditingTemplate(null);
    changeView('manageTemplates');
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const startEditingTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setEditingTemplate(template);
      setView('designTemplate');
    }
  };

  const startCreatingTemplate = () => {
      setEditingTemplate(null);
      setView('designTemplate');
  };


  const renderView = () => {
    switch (view) {
      case 'addDiagnosis':
        return <AddDiagnosisForm onAddDiagnosis={addDiagnosis} diagnoses={diagnoses} onDeleteDiagnosis={deleteDiagnosis} />;
      case 'addDoctor':
        return <AddDoctorForm onAddDoctor={addDoctor} doctors={doctors} onDeleteDoctor={deleteDoctor} />;
      case 'manageTemplates':
        return <ManageTemplates templates={templates} onDeleteTemplate={deleteTemplate} onEditTemplate={startEditingTemplate} onCreateNew={startCreatingTemplate} />;
      case 'designTemplate':
        return <TemplateDesigner onSaveTemplate={saveTemplate} templateToEdit={editingTemplate} />;
      case 'main':
      default:
        return (
          <MainForm
            diagnoses={diagnoses}
            doctors={doctors}
            templates={templates}
            setView={changeView}
          />
        );
    }
  };
  
  const viewTitles: Record<View, string> = {
    main: 'مولد التقارير الطبية',
    addDiagnosis: 'إدارة التشخيصات',
    addDoctor: 'إدارة الأطباء',
    manageTemplates: 'إدارة القوالب',
    designTemplate: editingTemplate ? 'تعديل القالب' : 'تصميم قالب جديد',
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-gray-800">
      <header className="bg-blue-700 text-white p-4 flex items-center shadow-lg sticky top-0 z-10">
        {view !== 'main' && (
          <button onClick={() => changeView(view === 'designTemplate' ? 'manageTemplates' : 'main')} className="mr-4 p-2 rounded-full hover:bg-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold">{viewTitles[view]}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
