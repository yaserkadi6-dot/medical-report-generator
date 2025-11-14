
import React, { useState } from 'react';
import { Diagnosis, AgeGroup, Gender } from '../types';

interface AddDiagnosisFormProps {
  onAddDiagnosis: (diagnosis: Omit<Diagnosis, 'id'>) => void;
  diagnoses: Diagnosis[];
  onDeleteDiagnosis: (id: string) => void;
}

const MaterialInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; id?: string;}> = ({ label, ...props }) => (
    <div className="relative bg-slate-100 rounded-t-lg border-b-2 border-slate-300 focus-within:border-blue-600 pt-4 transition-colors">
      <input
        {...props}
        placeholder=" " 
        className="block w-full px-3 pb-2 bg-transparent outline-none text-gray-800 peer"
      />
      <label
        htmlFor={props.id}
        className="absolute top-4 right-3 text-gray-500 duration-300 transform -translate-y-3 scale-75 origin-top-right
                   peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                   peer-focus:scale-75 peer-focus:-translate-y-3
                   pointer-events-none"
      >
        {label}
      </label>
    </div>
);

const MaterialSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; id?: string }> = ({ label, value, onChange, children, id }) => (
    <div className="relative bg-slate-100 rounded-t-lg border-b-2 border-slate-300 focus-within:border-blue-600 pt-4 transition-colors flex-1">
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="block w-full px-2 pb-2 bg-transparent outline-none text-gray-800 appearance-none"
        >
            {children}
        </select>
        <label htmlFor={id} className="absolute top-1 right-3 text-gray-500 duration-300 transform scale-75 origin-top-right pointer-events-none">
            {label}
        </label>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);


const AddDiagnosisForm: React.FC<AddDiagnosisFormProps> = ({ onAddDiagnosis, diagnoses, onDeleteDiagnosis }) => {
  const [text, setText] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(AgeGroup.Children);
  const [gender, setGender] = useState<Gender>(Gender.Male);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddDiagnosis({ text, ageGroup, gender });
      setText('');
    }
  };

  const getAgeGroupLabel = (ageGroupVal: AgeGroup) => {
    switch (ageGroupVal) {
      case AgeGroup.Children: return 'اطفال';
      case AgeGroup.Youth: return 'شباب';
      case AgeGroup.Adults: return 'كبار';
      default: return '';
    }
  }

  const getGenderLabel = (genderVal: Gender) => {
    return genderVal === Gender.Male ? 'ذكر' : 'أنثى';
  }

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <MaterialInput
            label="نص التشخيص"
            name="diagnosisText"
            id="diagnosisText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        <div className="flex gap-4">
            <MaterialSelect
                id="ageGroup"
                label="الفئة العمرية"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
            >
                <option value={AgeGroup.Children}>اطفال</option>
                <option value={AgeGroup.Youth}>شباب</option>
                <option value={AgeGroup.Adults}>كبار</option>
            </MaterialSelect>
            <MaterialSelect
                id="gender"
                label="النوع"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
            >
                <option value={Gender.Male}>ذكر</option>
                <option value={Gender.Female}>أنثى</option>
            </MaterialSelect>
        </div>
        <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
          إضافة تشخيص
        </button>
      </form>
      <div className="mt-8 p-2 flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">التشخيصات الحالية</h2>
        {diagnoses.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا يوجد تشخيصات مضافة حاليًا.</p>
        ) : (
          <ul className="space-y-2">
            {diagnoses.map((d) => (
              <li key={d.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex-1">
                  <p className="text-gray-800">{d.text}</p>
                  <p className="text-sm text-gray-500 mt-1">{getAgeGroupLabel(d.ageGroup)} - {getGenderLabel(d.gender)}</p>
                </div>
                <button 
                  onClick={() => onDeleteDiagnosis(d.id)}
                  className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors flex-shrink-0 ml-4"
                  aria-label={`حذف التشخيص`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AddDiagnosisForm;
