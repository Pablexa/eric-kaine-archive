import type { ReactElement, SVGProps } from 'react'

/** Custom 1.5px-stroke icon set. Kept tiny on purpose. */

export type IconName = 'arrow-up-right' | 'arrow-right' | 'arrow-left' | 'arrow-down' | 'play' | 'menu' | 'close' | 'sound-on' | 'sound-off' | 'bell' | 'link' | 'replay'

const paths: Record<IconName, ReactElement> = {
  'arrow-up-right': <path d="M7 17 17 7M8 7h9v9" />,
  'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6" />,
  'arrow-left': <path d="M20 12H4m6-6-6 6 6 6" />,
  'arrow-down': <path d="M12 4v16m-6-6 6 6 6-6" />,
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none" />,
  menu: <path d="M4 8h16M4 16h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  'sound-on': (
    <>
      <path d="M4 10v4h3l5 4V6L7 10H4Z" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />
    </>
  ),
  'sound-off': (
    <>
      <path d="M4 10v4h3l5 4V6L7 10H4Z" />
      <path d="m16 10 4 4m0-4-4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />,
  replay: <path d="M4 12a8 8 0 1 0 2.34-5.66M4 4v4.5h4.5" />,
}

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
