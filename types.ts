
export enum AgeGroup {
  Children = 'children',
  Youth = 'youth',
  Adults = 'adults',
}

export enum Gender {
  Male = 'male',
  Female = 'female',
}

export interface Diagnosis {
  id: string;
  text: string;
  ageGroup: AgeGroup;
  gender: Gender;
}

export interface Doctor {
  id: string;
  name: string;
}

export interface TemplateElement {
    id: string;
    type: 'text' | 'image';
    content: string; // For text: the text or placeholder. For image: base64 data URL.
    
    // Position and dimensions are stored as percentages of the container
    positionPercent: { x: number; y: number };
    widthPercent: number; 
    heightPercent: number; 

    // Text styling properties
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'right' | 'center' | 'left';
    color?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
}

export interface Template {
  id: string;
  name: string;
  elements: TemplateElement[];
  designerCanvasWidth?: number;
}

export interface ReportData {
    patientName: string;
    date: string;
    doctorName: string;
    diagnosisChildrenMale: string;
    diagnosisChildrenFemale: string;
    diagnosisYouthMale: string;
    diagnosisYouthFemale: string;
    diagnosisAdultsMale: string;
    diagnosisAdultsFemale: string;
    templateId: string;
}