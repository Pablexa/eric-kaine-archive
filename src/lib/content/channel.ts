/**
 * Verified creator content.
 *
 * Every value here was read from public YouTube surfaces on 2026-10-10
 * (channel header + "more links" panel, the channel RSS feed, and each
 * watch page's public metadata). See SOURCES.md for the registry.
 * Nothing in this file is invented; when a value is unknown it is omitted.
 */

export const CAPTURED_AT = '2026-10-10'

export const channel = {
  name: 'Eric Kaine',
  handle: '@eric2kaine',
  url: 'https://www.youtube.com/@eric2kaine',
  subscribeUrl: 'https://www.youtube.com/@eric2kaine?sub_confirmation=1',
  channelId: 'UCTIkib43I4tDNUTIqWMFz7w',
  /** Verbatim channel description. */
  bio: 'please gatekeep me im not trying to be famous',
  joined: '2024-09-13',
  subscribersLabel: '1.5K',
  videoCount: 23,
  totalViews: 70077,
  avatar:
    'https://yt3.googleusercontent.com/UuOVTBq_KuKbciQgfzEKX3-cBBmEHNVgHrS6YKU0ppEc3I9WBRK_JxcIBJdjNPkLAS8SXAJwmA=s800-c-k-c0x00ffffff-no-rj',
} as const

export type LinkId = 'youtube' | 'twitch' | 'beats' | 'soundcloud' | 'instagram' | 'x' | 'discord'

export interface SocialLink {
  id: LinkId
  label: string
  handle: string
  url: string
  note: string
}

/** Links exactly as listed in the channel's "links" panel. */
export const links: SocialLink[] = [
  { id: 'youtube', label: 'YouTube', handle: '@eric2kaine', url: 'https://www.youtube.com/@eric2kaine', note: 'Main channel' },
  { id: 'twitch', label: 'Twitch', handle: 'eric1kaine', url: 'https://twitch.tv/eric1kaine', note: 'Live' },
  { id: 'beats', label: 'Beat channel', handle: '@eric1kaine', url: 'https://youtube.com/@eric1kaine', note: 'Beats on YouTube' },
  { id: 'soundcloud', label: 'SoundCloud', handle: 'on.soundcloud.com', url: 'https://on.soundcloud.com/2J9ecz91TU0FIVBGIU', note: 'Music' },
  { id: 'instagram', label: 'Instagram', handle: 'eric1kaine', url: 'https://www.instagram.com/eric1kaine', note: 'Photos' },
  { id: 'x', label: 'X', handle: '@erickaine_', url: 'https://x.com/erickaine_', note: 'Posts' },
  { id: 'discord', label: 'Discord', handle: 'discord.gg/jC6TtA8AdH', url: 'https://discord.gg/jC6TtA8AdH', note: 'Community' },
]

export type VideoKind = 'video' | 'stream' | 'short'

export interface Video {
  id: string
  title: string
  kind: VideoKind
  /** ISO date with offset, from the watch page's uploadDate. */
  published: string
  /** Seconds. Omitted when YouTube reports 0 (e.g. no processed VOD). */
  length?: number
  /** Public view count at capture time. */
  views: number
  /** Whether a 1280×720 maxresdefault thumbnail exists. */
  maxres: boolean
  /** Whether a vertical oardefault thumbnail exists (Shorts). */
  vertical?: boolean
}

export const videos: Video[] = [
  // Long-form uploads
  { id: 'm_3agIs-y-U', title: 'I Added Bleood to Verity Mod', kind: 'video', published: '2026-10-05T13:00:10-07:00', length: 856, views: 19865, maxres: true },
  { id: 'gG3Rl9z7s74', title: 'I sampled charlie kirk in fl studio…', kind: 'video', published: '2026-08-30T05:11:20-07:00', length: 253, views: 1512, maxres: true },
  { id: 'CIhHkePQRsw', title: 'bleood joined my stream and it got weird…', kind: 'video', published: '2026-08-28T08:23:02-07:00', length: 1187, views: 37451, maxres: true },
  { id: '6aOh59uokrY', title: 'UK Rap is Straight POO 💩💩🚮🗑️', kind: 'video', published: '2026-08-25T15:19:42-07:00', length: 366, views: 1957, maxres: true },
  { id: 'Xob-tjso9Ys', title: 'I Found Bleood’s Youngest fan in Fortnite...', kind: 'video', published: '2026-04-01T15:23:25-07:00', length: 546, views: 1038, maxres: true },
  { id: 't_DP6XJ_1Mg', title: 'I sampled jeffery epstein in fl studio...', kind: 'video', published: '2026-02-20T18:37:11-08:00', length: 480, views: 799, maxres: false },
  // Shorts
  { id: 'jMVtNV5zTec', title: 'bro donated at the wrong time ☠️', kind: 'short', published: '2026-09-03T21:41:26-07:00', length: 19, views: 1765, maxres: true, vertical: true },
  { id: 'HHMvTynI7o0', title: 'UK poo rapper joins my stream', kind: 'short', published: '2026-08-18T16:54:33-07:00', length: 40, views: 258, maxres: true, vertical: true },
  { id: '95ByVyg1y-Q', title: 'twitch: eric1kaine', kind: 'short', published: '2026-08-13T21:41:29-07:00', length: 129, views: 891, maxres: true, vertical: true },
  // Live streams
  { id: '-Ad1dSn4leI', title: 'short stream tap in !discord', kind: 'stream', published: '2026-10-07T15:09:59-07:00', views: 0, maxres: false },
  { id: 'Ymq4j58fueU', title: 'playing roblox with bleood (clickbait)', kind: 'stream', published: '2026-10-02T22:42:05-07:00', length: 13973, views: 297, maxres: true },
  { id: '2Adqk_voaNQ', title: 'please dont click this stream its so bad', kind: 'stream', published: '2026-09-27T23:24:59-07:00', length: 7290, views: 173, maxres: true },
  { id: 'JqO6Y3lUXks', title: 'playing underground rapper gartic phone with viewers !discord', kind: 'stream', published: '2026-09-26T23:53:21-07:00', length: 11446, views: 485, maxres: false },
  { id: 'bIOpt-lmJrU', title: 'making a beat but my chat chooses the sounds !discord', kind: 'stream', published: '2026-09-26T10:13:39-07:00', length: 6437, views: 408, maxres: false },
  { id: '83fmMazP260', title: 'I found 2slimey in minecraft (gone wrong)', kind: 'stream', published: '2026-09-23T21:13:06-07:00', length: 6486, views: 323, maxres: false },
  { id: 'qv-3Lrujn6k', title: 'Making Underground Rappers In Verity Mod w/ Viewers !discord', kind: 'stream', published: '2026-09-22T22:08:24-07:00', length: 11141, views: 694, maxres: true },
  { id: 'cYBWZyecX_w', title: 'I turned Verity into Bleood (Bleoodity)', kind: 'stream', published: '2026-09-21T19:06:32-07:00', length: 15712, views: 3200, maxres: true },
  { id: 'f9evoEQI0HI', title: 'testing bleood verity mod w/ chat', kind: 'stream', published: '2026-09-20T22:26:14-07:00', length: 8619, views: 258, maxres: false },
  { id: 'j-JPcEJCgbw', title: 'reacting to lucy bedroque - c live w/ viewers (skip to 32 minutes for the album)', kind: 'stream', published: '2026-09-17T23:05:51-07:00', length: 8971, views: 1182, maxres: true },
  { id: 'hhroQugZYRw', title: 'I added bleood to verity (and broke it)', kind: 'stream', published: '2026-09-17T03:56:53-07:00', length: 1541, views: 1367, maxres: false },
  { id: 'KYqn_39S070', title: 'IM BOUT TO HIT 1000 SUBS JOIN UP !DISCORD', kind: 'stream', published: '2026-09-13T12:19:27-07:00', length: 850, views: 342, maxres: false },
  { id: 'z0G8H259hRg', title: 'playing fort with the kid from the bleood video. ask him anything', kind: 'stream', published: '2026-09-12T10:11:45-07:00', length: 4096, views: 386, maxres: true },
  { id: 'Qi7COQtNVGk', title: 'BLEOOD JUST DROPPED HIS BEST… | Bleood - Haunted Hills (REACTION)', kind: 'stream', published: '2026-09-10T22:10:20-07:00', length: 784, views: 470, maxres: true },
]

export const byId = (id: string): Video => {
  const v = videos.find((x) => x.id === id)
  if (!v) throw new Error(`Unknown video ${id}`)
  return v
}

/** Editorial curation for the professional act. */
export const curation = {
  featured: 'm_3agIs-y-U',
  supporting: ['CIhHkePQRsw', 'Xob-tjso9Ys'],
  streams: ['cYBWZyecX_w', 'qv-3Lrujn6k', 'Ymq4j58fueU', 'j-JPcEJCgbw', '2Adqk_voaNQ', 'z0G8H259hRg', 'Qi7COQtNVGk'],
  shorts: ['jMVtNV5zTec', 'HHMvTynI7o0', '95ByVyg1y-Q'],
  /** The five videos hidden in the dark during "Lights Out". */
  hidden: ['m_3agIs-y-U', 'CIhHkePQRsw', '6aOh59uokrY', 'cYBWZyecX_w', 'Xob-tjso9Ys'],
} as const

export const watchUrl = (id: string, kind?: VideoKind) =>
  kind === 'short' ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`

export const thumb = (v: Pick<Video, 'id' | 'maxres'>, size: 'max' | 'hq' | 'mq' = 'max') => {
  if (size === 'mq') return `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`
  if (size === 'max' && v.maxres) return `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`
  return `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`
}

/** hqdefault is 4:3 with letterbox bars; callers crop it when this is true. */
export const isLetterboxed = (v: Pick<Video, 'maxres'>, size: 'max' | 'hq' | 'mq' = 'max') =>
  size === 'hq' || (size === 'max' && !v.maxres)

export const verticalThumb = (id: string) => `https://i.ytimg.com/vi/${id}/oardefault.jpg`

export const formatLength = (s?: number) => {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? h + ':' : ''}${mm}:${String(sec).padStart(2, '0')}`
}

export const formatDate = (iso: string, style: 'short' | 'long' = 'short') =>
  new Date(iso).toLocaleDateString('en-US', {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  })

export const formatViews = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`
  return String(n)
}

/**
 * The "Mhm I Got the Cheese" meme song, by Bleood (Eric's frequent
 * collaborator). Played only through YouTube's own embedded player, from the
 * artist's official upload. Source: knowyourmeme.com/memes/mhm-i-got-the-cheese
 * and YouTube oEmbed (author: bleood), captured 2026-10-10.
 */
export const cheeseSong = {
  id: 'mPJhwEcj2g4',
  artist: 'bleood',
  artistUrl: 'https://www.youtube.com/@bleood',
  url: 'https://www.youtube.com/watch?v=mPJhwEcj2g4',
} as const
