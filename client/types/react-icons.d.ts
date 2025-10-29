// Type fixes for react-icons compatibility
declare module 'react-icons/fa' {
  import { ComponentType, SVGProps } from 'react';
  
  type IconProps = SVGProps<SVGSVGElement> & { className?: string };
  
  export const FaRobot: ComponentType<IconProps>;
  export const FaCalendarAlt: ComponentType<IconProps>;
  export const FaBrain: ComponentType<IconProps>;
}

declare module 'react-icons/hi2' {
  import { ComponentType, SVGProps } from 'react';
  
  type IconProps = SVGProps<SVGSVGElement> & { className?: string };
  
  export const HiClock: ComponentType<IconProps>;
  export const HiSparkles: ComponentType<IconProps>;
  export const HiPencilSquare: ComponentType<IconProps>;
  export const HiLightBulb: ComponentType<IconProps>;
  export const HiCog6Tooth: ComponentType<IconProps>;
  export const HiExclamationTriangle: ComponentType<IconProps>;
  export const HiDocumentText: ComponentType<IconProps>;
  export const HiMagnifyingGlass: ComponentType<IconProps>;
  export const HiXMark: ComponentType<IconProps>;
  export const HiBars3: ComponentType<IconProps>;
  export const HiMusicalNote: ComponentType<IconProps>;
  export const HiPlay: ComponentType<IconProps>;
  export const HiPhoto: ComponentType<IconProps>;
  export const HiDocument: ComponentType<IconProps>;
  export const HiFolder: ComponentType<IconProps>;
  export const HiShare: ComponentType<IconProps>;
  export const HiTrash: ComponentType<IconProps>;
  export const HiArrowDownTray: ComponentType<IconProps>;
  export const HiPlus: ComponentType<IconProps>;
  export const HiChatBubbleLeft: ComponentType<IconProps>;
  export const HiHome: ComponentType<IconProps>;
}