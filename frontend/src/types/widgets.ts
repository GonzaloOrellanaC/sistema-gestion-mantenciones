// Shared widget prop types
import type { CSSProperties } from 'react';
export type TextareaProps = {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  style?: CSSProperties;
  readOnly?: boolean;
  name?: string;
};

export type InputProps = {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date';
  label?: string;
  placeholder?: string;
  value?: string | number;
  onInput?: (e: any) => void;
  name?: string;
  labelPlacement?: 'fixed' | 'start' | 'end' | 'floating' | 'stacked';
  key?: string | number;
  radius?: number;
  disabled?: boolean;
  passwordAleatory?: boolean;
  readOnly?: boolean;
};

export type SelectOption = { label: string; value: string | number };

export type SelectProps = {
  label?: string;
  value?: string | number | null;
  onChange?: (value: any) => void;
  onInput?: (e: any) => void;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
  readOnly?: boolean;
  name?: string;
};
