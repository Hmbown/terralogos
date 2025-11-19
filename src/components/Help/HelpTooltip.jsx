import React, { useState } from 'react';
import '../../styles/help.css';

const HelpTooltip = ({ content, title, sourceLink }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="help-tooltip-container">
      <button
        className="help-icon"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label="Help"
      >
        ?
      </button>
      {isOpen && (
        <div className="help-tooltip">
          {title && <div className="help-tooltip-title">{title}</div>}
          <div className="help-tooltip-content">{content}</div>
          {sourceLink && (
            <div className="help-tooltip-link">
              <a href={sourceLink.url} target="_blank" rel="noopener noreferrer">
                {sourceLink.label || 'Learn more'}
              </a>
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default HelpTooltip;

