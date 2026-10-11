import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { sfx } from '../../../lib/audio/sfx'
import { artistMedia, characterMedia, objectMedia, type RealMedia } from '../../../lib/assets/realMedia'
import { TIME, EASE, pick } from '../../../lib/animation/timeline'

/**
 * Act IV is "live": a fake underground chat column scrolls with in-jokes and
 * brainrot, and donation alerts pop with a chime and a real photo.
 * All usernames are made up.
 */

const CHATTERS = [
  ['sealenjoyer_99', '#7fd4ff'],
  ['slatt_master', '#ff4fd8'],
  ['cheese_guy_fan', '#ffd21f'],
  ['bleoodity_hater', '#ff7a1f'],
  ['lil_gartic', '#5be36b'],
  ['not_bleood', '#c53cff'],
  ['ukrap_refugee', '#26d0ce'],
  ['eric_kaine_fan_2024', '#ffffff'],
  ['fl_studio_loop', '#ffb347'],
  ['mod_bleoodity', '#ffd21f'],
  ['im10fr', '#9bff6a'],
  ['2slimey_enjoyer', '#7bed3f'],
] as const

const LINES = [
  'W', 'L', 'W STREAM', 'slatt', '!discord', '!discord', 'bleoodity???', 'I’m 10.', '+1000 aura', 'who let bleoodity cook', 'BLEOODITY FM GOATED',
  'seals', 'play haunted hills', 'UK rap is straight poo', 'bro donated at the wrong time ☠️', 'cheese', 'cheese', 'is this the 2slimey stream',
  'please dont click this stream its so bad', 'IM BOUT TO HIT 1000 PLAYS', 'gatekeep him', 'chat is this real', 'first', 'skibidi', 'ohio',
  'mewing rn', 'fanum tax', 'sigma', 'osamason on the aux', 'carti dropped??', 'slayr burger arc', 'jaydes!!', 'lil bleoodity type beat', '1.5K+1 W',
  'the website is CRYING', 'who turned on comic sans', 'my ears', 'LOUDER', 'grape soda 🍇', 'dragon spotted', 'torta arc', 'aura farming',
  'not the clones again', 'eric kaineity fell off', 'bleoodity rise up', '67', 'six seven', 'this is peak', 'eric pls', 'gatekept 😭',
  'double cup 💜', 'pour one up', 'DRACO SPOTTED', 'the dracos are flying', 'lean on the website', 'who brought dragons AND dracos'
]

const DONATIONS: { name: string; amount: string; msg: string; photo: RealMedia }[] = [
  { name: 'sealenjoyer_99', amount: '$5.00', msg: 'play haunted hills', photo: objectMedia.seal },
  { name: 'xX_cheese_Xx', amount: '$1.00', msg: 'cheese.', photo: objectMedia.cheese },
  { name: 'gartic_god', amount: '$2.50', msg: 'draw bleoodity rn', photo: artistMedia.bleood },
  { name: 'im10fr', amount: '$0.10', msg: 'I’m 10.', photo: objectMedia.burger },
  { name: 'bleoodity_main', amount: '$4.20', msg: 'gatekeep him harder', photo: characterMedia.bleoodity },
  { name: 'ukrap_refugee', amount: '$3.00', msg: 'uk rap is NOT poo', photo: objectMedia.slime },
  { name: 'not_eric', amount: '$1,501', msg: '1.5K + 1', photo: characterMedia.ericPfp },
  { name: 'wrong_timer', amount: '$5.00', msg: 'bro donated at the wrong time ☠️', photo: artistMedia.osamason },
  { name: 'dragon_rider', amount: '$7.00', msg: 'add more dracos (and the dragons stay)', photo: objectMedia.draco },
  { name: 'double_cup_dan', amount: '$4.00', msg: 'pour one up for the website', photo: objectMedia.drink },
  { name: 'torta_lover', amount: '$6.00', msg: 'more tortas. (this is a burger.)', photo: objectMedia.burger },
  { name: 'kaineity_was_better', amount: '$0.67', msg: 'bring back eric kaineity', photo: characterMedia.kaineity },
]

interface Msg {
  id: number
  name: string
  color: string
  text: string
}

export function StreamOverlay() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [alert, setAlert] = useState<(typeof DONATIONS)[number] | null>(null)
  const nextId = useRef(1)

  useEffect(() => {
    let t = 0
    const tick = () => {
      const [name, color] = pick(CHATTERS)
      setMsgs((m) => [...m.slice(-16), { id: nextId.current++, name, color, text: pick(LINES) }])
      t = window.setTimeout(tick, (250 + Math.random() * 650) * Math.max(0.5, TIME.scale))
    }
    tick()
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    let t = 0
    let hide = 0
    let i = Math.floor(Math.random() * DONATIONS.length)
    const next = () => {
      setAlert(DONATIONS[i++ % DONATIONS.length])
      sfx.donation()
      hide = window.setTimeout(() => setAlert(null), 3600)
      t = window.setTimeout(next, (9000 + Math.random() * 6000) * Math.max(0.3, TIME.scale))
    }
    t = window.setTimeout(next, 3500 * Math.max(0.3, TIME.scale))
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(hide)
    }
  }, [])

  return (
    <div data-troll-ui aria-hidden="true">
      <div className="pointer-events-none fixed right-3 top-[120px] z-[44] hidden w-[250px] flex-col justify-end overflow-hidden border-2 border-black bg-black/70 lg:flex" style={{ bottom: 300 }} data-testid="live-chat">
        <p className="pixel flex items-center gap-2 border-4 border-double border-[#00ff00] bg-[#000080] px-2 py-1 text-[13px] text-[#ffff00]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-alarm" /> LIVE SHOUTBOX · {Math.floor(1500 + msgs.length * 3)} lurking
        </p>
        <ol className="flex flex-col gap-0.5 px-2 py-1.5">
          {msgs.map((m) => (
            <motion.li key={m.id} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="text-[12.5px] leading-snug text-white">
              <b style={{ color: m.color }}>{m.name}</b>: {m.text}
            </motion.li>
          ))}
        </ol>
      </div>

      <AnimatePresence>
        {alert ? (
          <motion.div
            key={alert.name + alert.msg}
            className="pointer-events-none fixed left-1/2 top-[132px] z-[48] flex w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 border-[3px] border-black bg-[#ffd21f] px-4 py-3 text-black shadow-[6px_6px_0_#ff3fbf]"
            initial={{ y: -80, scale: 0.6, rotate: -6, opacity: 0 }}
            animate={{ y: 0, scale: 1, rotate: [0, 3, -3, 0], opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE.snap }}
            data-testid="donation"
          >
            <img src={alert.photo.src} alt="" className="h-14 w-14 shrink-0 border-4 border-red-600 object-cover [border-style:ridge]" style={{ animation: 'ug-spin-y 1.2s linear infinite' }} />
            <span className="min-w-0">
              <span className="pixel block text-[16px]">
                <b>{alert.name}</b> donated <b className="text-[#b3001b]">{alert.amount}</b>
              </span>
              <span className="block truncate text-[14px] font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                “{alert.msg}”
              </span>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
