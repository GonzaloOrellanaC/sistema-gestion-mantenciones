import React from 'react';

export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'image' | 'file' | 'number' | 'radio' | 'signature' | 'geo' | 'date' | 'division' | 'columns' | 'dynamic_list' | 'parts' | 'supplies';

export type Field = {
  key: string;
  type: FieldType;
  label?: string;
  required?: boolean;
  input?: boolean;
  placeholder?: string;
  options?: string[];
  children?: Field[][];
  [k: string]: any;
};

export const ICON_MAP: Record<FieldType, string> = {
  text: 'fa-font',
  textarea: 'fa-align-left',
  number: 'fa-hashtag',
  select: 'fa-list-ul',
  checkbox: 'fa-check-square',
  radio: 'fa-dot-circle',
  image: 'fa-image',
  dynamic_list: 'fa-list',
  signature: 'fa-pen-fancy',
  geo: 'fa-map-marker-alt',
  date: 'fa-calendar-alt',
  file: 'fa-file-alt',
  columns: 'fa-columns',
  division: 'fa-arrows-alt-h',
  parts: 'fa-wrench',
  supplies: 'fa-box',
};

export function createFieldFromType(type: FieldType, t?: (key: string, opts?: Record<string, any>) => string) {
  const base: any = { key: `${type}_${Date.now()}`, type, label: '', required: false };
  switch (type) {
    case 'text':
      base.label = t ? t('templates.builder.palette.text') : 'Texto corto';
      base.input = true;
      base.placeholder = '';
      break;
    case 'textarea':
      base.label = t ? t('templates.builder.palette.textarea') : 'Texto largo';
      base.input = true;
      base.placeholder = '';
      break;
    case 'number':
      base.label = t ? t('templates.builder.palette.number') : 'Número';
      base.input = true;
      base.placeholder = '';
      break;
    case 'select':
      base.label = t ? t('templates.builder.palette.select') : 'Selector';
      base.options = ['Opción 1', 'Opción 2'];
      break;
    case 'radio':
      base.label = t ? t('templates.builder.palette.radio') : 'Opción única';
      base.options = ['Opción 1', 'Opción 2'];
      break;
    case 'checkbox':
      base.label = t ? t('templates.builder.palette.checkbox') : 'Checkbox';
      break;
    case 'signature':
      base.label = t ? t('templates.builder.palette.signature') : 'Firma';
      break;
    case 'geo':
      base.label = t ? t('templates.builder.palette.geo') : 'Geolocalización';
      break;
    case 'date':
      base.label = t ? t('templates.builder.palette.date') : 'Fecha / Hora';
      break;
    case 'image':
      base.label = t ? t('templates.builder.palette.image') : 'Imagen';
      break;
    case 'file':
      base.label = t ? t('templates.builder.palette.file') : 'Archivo';
      break;
    case 'columns':
      base.label = '';
      base.isDesign = true;
      base.children = [[], []];
      break;
    case 'dynamic_list':
      base.label = t ? t('templates.builder.palette.dynamic_list') : 'Listado editable';
      base.items = [];
      base.allowedItemTypes = ['text', 'image'];
      break;
    case 'parts':
      base.label = t ? t('templates.builder.palette.parts') : 'Repuesto';
      base.parts = [];
      break;
    case 'supplies':
      base.label = t ? t('templates.builder.palette.supplies') : 'Insumo';
      base.supplies = [];
      break;
    case 'division':
      base.label = t ? t('templates.builder.palette.division') : 'Fin de página (División)';
      base.input = false;
      base.pageTitle = '';
      break;
    default:
      base.label = t ? t('templates.builder.palette.text') : 'Campo';
  }
  return base as Field;
}

export default {};
