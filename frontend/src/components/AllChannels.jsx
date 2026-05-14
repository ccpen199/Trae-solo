import React from 'react'
import './AllChannels.css'

const AllChannels = ({ channels, activeChannel, onSelect, onClose }) => {
  return (
    <div className="all-channels-overlay" onClick={onClose}>
      <div className="all-channels" onClick={e => e.stopPropagation()}>
        <div className="all-channels-header">
          <h3>全部频道</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="all-channels-body">
          <div className="channel-grid">
            {channels.map(ch => (
              <button
                key={ch.code}
                className={`channel-item ${activeChannel === ch.code ? 'active' : ''}`}
                onClick={() => onSelect(ch.code)}
              >
                {ch.icon && <span className="channel-icon">{ch.icon}</span>}
                <span className="channel-name">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AllChannels
