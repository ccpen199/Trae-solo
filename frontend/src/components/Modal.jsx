import React, { useState, useEffect } from 'react';

export function PromptModal({ isOpen, title, message, placeholder, defaultValue, type = 'text', onClose, onConfirm }) {
  const [value, setValue] = useState(defaultValue || '');

  useEffect(() => {
    setValue(defaultValue || '');
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'confirm' || value.trim()) {
      onConfirm(value);
      setValue('');
    }
  };

  const handleCancel = () => {
    setValue('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={handleCancel}>&times;</button>
        </div>

        {message && <p style={{ marginBottom: '20px', color: '#4a5568' }}>{message}</p>}

        {type !== 'confirm' && (
          <div className="form-group">
            {type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                style={{ minHeight: '150px' }}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>取消</button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            {type === 'confirm' ? '确定' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptModal;
