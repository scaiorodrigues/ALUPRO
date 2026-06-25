import React from 'react'
import Svg, { Rect, Polygon, Line, Defs, Pattern, Path } from 'react-native-svg'

interface Props { name?: string; size?: number }

export function ProfileSVG({ name = 'T', size = 120 }: Props) {
  const tipo = name.charAt(0).toUpperCase()
  const s    = size
  const fill = 'rgba(255,107,26,0.12)'
  const stroke = '#FF6B1A'
  const sw   = 1.5
  const grid = `rgba(255,107,26,0.07)`

  const shapes: Record<string, React.ReactNode> = {
    T: <>
      <Rect x={8} y={8}  width={84} height={16} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={42} y={24} width={16} height={68} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </>,
    U: <>
      <Rect x={8}  y={8}  width={16} height={84} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={24} y={76} width={52} height={16} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={76} y={8}  width={16} height={84} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </>,
    L: <>
      <Rect x={8}  y={8}  width={16} height={84} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={24} y={76} width={68} height={16} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </>,
    F: <>
      <Rect x={8}  y={8}  width={16} height={84} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={24} y={8}  width={60} height={16} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={24} y={44} width={44} height={14} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </>,
    C: <>
      <Rect x={28} y={8}  width={64} height={16} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={8}  y={8}  width={20} height={84} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={28} y={76} width={64} height={16} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </>,
    H: <>
      <Rect x={8}  y={8}  width={16} height={84} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={76} y={8}  width={16} height={84} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={24} y={42} width={52} height={16} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </>,
    I: <>
      <Rect x={8}  y={8}  width={84} height={14} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={42} y={22} width={16} height={56} fill={fill} stroke={stroke} strokeWidth={sw}/>
      <Rect x={8}  y={78} width={84} height={14} fill={fill} stroke={stroke} strokeWidth={sw}/>
    </>,
  }

  return (
    <Svg width={s} height={s} viewBox="0 0 100 100">
      <Defs>
        <Pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <Path d="M 10 0 L 0 0 0 10" fill="none" stroke={grid} strokeWidth={0.5}/>
        </Pattern>
      </Defs>
      <Rect width="100" height="100" fill="url(#grid)"/>
      {shapes[tipo] ?? shapes['T']}
    </Svg>
  )
}
