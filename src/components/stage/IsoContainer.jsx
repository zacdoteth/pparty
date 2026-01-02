/**
 * IsoContainer — EXACT PORT from vanilla.html
 *
 * "PICTO-PARTY FIX: rotateX only — faces VIEWER directly like PictoChat/Habbo"
 * No rotateZ means NO/YES zones face you straight on!
 */

import React from 'react'
import './IsoContainer.css'

export default function IsoContainer({ children }) {
  return (
    <div className="iso-room">
      {/* The World — rotateX(55deg) only, no Z rotation! */}
      <div className="iso-world">
        {children}
      </div>
    </div>
  )
}
