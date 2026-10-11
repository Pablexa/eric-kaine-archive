import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { EASE } from '../../lib/animation/timeline'
import { scrollToSection } from '../../lib/interactions/scroll'
import { channel } from '../../lib/content/channel'
import { Icon } from '../shared/Icon'
import { Period } from '../shared/Period'
import { NAV } from './Header'

export function MobileMenu({ open, onClose, active }: { open: boolean; onClose: () => void; active: string }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[60] flex flex-col bg-ink px-[var(--gutter)] pb-8 pt-5"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.6, ease: EASE.outExpo }}
          data-testid="mobile-menu"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-baseline font-display text-[19px] font-extrabold tracking-[-0.04em] [font-stretch:115%]">
              EK<Period />
            </span>
            <button ref={closeRef} type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-line-2" aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>
          <nav aria-label="Sections" className="mt-12 flex-1">
            <ol className="space-y-1">
              {NAV.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: EASE.outExpo }}
                >
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onClose()
                      window.setTimeout(() => scrollToSection(n.id), 380)
                    }}
                    className="flex items-baseline gap-4 py-1"
                    aria-current={active === n.id ? 'true' : undefined}
                  >
                    <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
                    <span className={`display text-[13vw] leading-[0.95] ${active === n.id ? 'text-paper' : 'text-paper/70'}`}>{n.label}</span>
                  </a>
                </motion.li>
              ))}
            </ol>
          </nav>
          <a href={channel.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-full bg-signal px-6 py-4 text-[15px] font-semibold text-white">
            Watch on YouTube <Icon name="arrow-up-right" />
          </a>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
