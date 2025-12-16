import React from 'react';

type Field = {
  id?: string;
  type: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  // for columns, expect a `columns` property: array of two arrays of Field
  columns?: Field[][];
};

type Props = {
  columns: Field[][];
  renderField: (field: Field, uidBase: string, index: number) => React.ReactNode;
  uidBase: string;
};

const Columns: React.FC<Props> = ({ columns, renderField, uidBase }) => {
  // ensure we have exactly two columns
  const left = columns && columns[0] ? columns[0] : [];
  const right = columns && columns[1] ? columns[1] : [];

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {left.map((f, i) => (
          <div key={`left-${i}`}>
            {f.type === 'columns' ? <div style={{ color: '#B0BEC5' }}>Componente "columns" anidado no permitido</div> : renderField(f, `${uidBase}-left`, i)}
          </div>
        ))}
      </div>

      <div style={{ width: 12 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {right.map((f, i) => (
          <div key={`right-${i}`}>
            {f.type === 'columns' ? <div style={{ color: '#B0BEC5' }}>Componente "columns" anidado no permitido</div> : renderField(f, `${uidBase}-right`, i)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Columns;
