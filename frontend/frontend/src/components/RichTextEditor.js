import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
/**
 * Компонент Rich Text Editor на основе React Quill
 * ВАЖНО: Для использования необходимо установить:
 * npm install react-quill-new
 * 
 * После установки раскомментируйте код ниже и замените содержимое функции.
 */
const RichTextEditor = ({ value, onChange, placeholder }) => {
  // ========== ВНИМАНИЕ ==========
  // После установки npm install react-quill-new
  // раскомментируйте этот код и удалите временную реализацию ниже
  
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };
  
  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];
  
  return (
    <ReactQuill
      theme="snow"
      modules={modules}
      formats={formats}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
  
};

export default RichTextEditor; 