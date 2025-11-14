
import React, { useState } from 'react';
import type { Doctor } from '../types';

interface AddDoctorFormProps {
  onAddDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  doctors: Doctor[];
  onDeleteDoctor: (id: string) => void;
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

const AddDoctorForm: React.FC<AddDoctorFormProps> = ({ onAddDoctor, doctors, onDeleteDoctor }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddDoctor({ name });
      setName('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <MaterialInput
            label="اسم الدكتور"
            name="doctorName"
            type="text"
            id="doctorName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
          إضافة دكتور
        </button>
      </form>

      <div className="mt-8 p-2 flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">الأطباء الحاليون</h2>
        {doctors.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا يوجد أطباء مضافون حاليًا.</p>
        ) : (
          <ul className="space-y-2">
            {doctors.map((doctor) => (
              <li key={doctor.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <span className="text-gray-800">{doctor.name}</span>
                <button 
                  onClick={() => onDeleteDoctor(doctor.id)}
                  className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                  aria-label={`حذف ${doctor.name}`}
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

export default AddDoctorForm;
