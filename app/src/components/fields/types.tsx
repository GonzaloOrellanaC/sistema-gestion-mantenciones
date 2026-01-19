import React from 'react';

export interface Field {
  id?: string;
  type: string;
  label?: string;
  placeholder?: string;
  options?: Array<any>;
  columns?: any;
}

export interface FieldProps {
  field: Field;
  uid: string;
  // optional shared state handlers — components only need what they use
  values?: Record<string, any>;
  setValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  photos?: Record<string, string>;
  openCamera?: (uid: string) => void;
  onFileSelected?: (uid: string, file: File, forDynamicIndex?: number) => void;
  filesMap?: Record<string, { name: string; url?: string }>;
  setFilesMap?: React.Dispatch<React.SetStateAction<Record<string, { name: string; url?: string }>>>;
  locations?: Record<string, { lat: number; lon: number; alt?: number | null }>;
  setLocations?: React.Dispatch<React.SetStateAction<Record<string, { lat: number; lon: number; alt?: number | null }>>>;
  dynamicLists?: Record<string, Array<{ type: 'text' | 'image'; value: string; name?: string }>>;
  setDynamicLists?: React.Dispatch<React.SetStateAction<Record<string, Array<{ type: 'text' | 'image'; value: string; name?: string }>>>>;
  // UI state helpers for dynamic lists/camera/signature flows
  showAddTextFor?: Record<string, boolean>;
  showAddImageFor?: Record<string, boolean>;
  setShowAddTextFor?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setShowAddImageFor?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  addTextValue?: Record<string, string>;
  setAddTextValue?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addImagePreview?: Record<string, string>;
  setAddImagePreview?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setCameraOpenFor?: (uid: string | null) => void;
  setSignatureOpenFor?: (uid: string | null) => void;
  onFieldBlur?: (snapshot: any) => void;
}

export default FieldProps;
