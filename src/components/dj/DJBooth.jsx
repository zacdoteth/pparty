/**
 * DJBooth — EXACT PORT from vanilla.html
 * "Mr. Game & Watch Style Epic Stick Figure DJ" — Toshiro
 *
 * Features:
 * - Gold neon outline (Game & Watch style)
 * - Headphones with ear cups
 * - Spinning turntables
 * - Scratching arms animation
 * - Faces the crowd (rotateY 180deg)
 */

import React from 'react'
import './DJBooth.css'

export default function DJBooth() {
  return (
    <div className="iso-dj-booth">
      {/* THE DJ BOOTH BASE — 3D CSS Cube */}
      <div className="dj-booth-block">
        {/* TOP FACE — Console surface */}
        <div className="dj-booth-top">
          {/* Turntables */}
          <div className="dj-turntables">
            <div className="dj-turntable" />
            <div className="dj-turntable" />
          </div>
          {/* Mixer */}
          <div className="dj-mixer">
            <div className="dj-mixer-slider" />
            <div className="dj-mixer-slider" />
          </div>
        </div>

        {/* FRONT-LEFT FACE — LED strip */}
        <div className="dj-booth-front-left" />

        {/* FRONT-RIGHT FACE — Side panel */}
        <div className="dj-booth-front-right" />
      </div>

      {/* THE DJ — Mr. Game & Watch Style */}
      <div className="stick-dj">
        {/* HEAD */}
        <div className="stick-dj-head">
          {/* HEADPHONES */}
          <div className="stick-dj-headphones" />
        </div>

        {/* BODY */}
        <div className="stick-dj-body" />

        {/* ARMS — Scratching animation */}
        <div className="stick-dj-arms" />

        {/* LEGS — Wide stance */}
        <div className="stick-dj-legs" />

        {/* LABEL */}
        <div className="stick-dj-label">DJ PREDICT</div>
      </div>
    </div>
  )
}
