import React from 'react';

export default function ActiveBadge({ isOnline, isActive = true }) {
  const isAvailable = Boolean(isOnline) && Boolean(isActive);

  if (isAvailable) {
    return (
      <span className="badge-online">
        <span className="dot"></span>
        Active & Online
      </span>
    );
  }

  return (
    <span className="badge-offline">
      <span className="dot"></span>
      Offline / Inactive
    </span>
  );
}
