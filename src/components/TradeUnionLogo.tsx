/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import logoUrl from '../assets/images/cong_doan_logo_1782188249064.jpg';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function TradeUnionLogo({ className = '', size = 50 }: LogoProps) {
  return (
    <img
      id="trade-union-logo"
      src={logoUrl}
      alt="Logo Công đoàn Việt Nam"
      className={`${className} object-contain rounded-full select-none`}
      style={{ width: `${size}px`, height: `${size}px` }}
      referrerPolicy="no-referrer"
    />
  );
}
