/** Local, source-checked photos. Full provenance lives in /media/SOURCES.md. */
export interface RealMedia {
  src: string
  alt: string
  source: string
  credit: string
  license?: string
}

export const objectMedia = {
  cheese: { src: '/media/cheese.jpg', alt: 'A real wedge of Swiss cheese', source: 'https://commons.wikimedia.org/wiki/File:Cheese.jpg', credit: 'Renee Comet / National Cancer Institute', license: 'Public domain' },
  burger: { src: '/media/burger.jpg', alt: 'A real hamburger', source: 'https://commons.wikimedia.org/wiki/File:Hamburger_(black_bg).jpg', credit: 'Len Rizzi / NIH; reprocessed by Off-shell', license: 'Public domain' },
  seal: { src: '/media/seal.jpg', alt: 'A real harbour seal', source: 'https://commons.wikimedia.org/wiki/File:Harbour_seal_(cropped).jpg', credit: 'Sue Matthews / U.S. Fish and Wildlife Service', license: 'Public domain' },
  drink: { src: '/media/drink.jpg', alt: 'A real double foam cup with a purple drink', source: 'https://commons.wikimedia.org/wiki/File:Lean_closeup.jpg', credit: 'Black Smurf StudiosTV', license: 'CC BY 3.0' },
  draco: { src: '/media/draco.png', alt: 'A Draco pistol in a video still', source: 'https://commons.wikimedia.org/wiki/File:Draco_pistol.png', credit: 'Любитель оружия', license: 'CC BY 4.0' },
  slime: { src: '/media/slime.jpg', alt: 'A real green Mattel Slime container', source: 'https://commons.wikimedia.org/wiki/File:Green_Slime.JPG', credit: 'Ciphers', license: 'CC BY-SA 3.0' },
} satisfies Record<string, RealMedia>

export const artistMedia = {
  bleood: { src: '/media/bleood.jpg', alt: 'Bleood in the official cryn innis coupe video', source: 'https://www.youtube.com/watch?v=m1zoIUa7rBE', credit: 'bleood · cryn innis coupe (official video)' },
  slayr: { src: '/media/slayr.jpg', alt: 'Slayr in the official Eyesight music video', source: 'https://www.youtube.com/watch?v=xpQ2KyNiVAU', credit: 'Lyrical Lemonade · Slayr — Eyesight; directed by Reduciano' },
  osamason: { src: '/media/osamason.jpg', alt: 'OsamaSon in the official Worldwide music video', source: 'https://www.youtube.com/watch?v=JWHDhiwJNOs', credit: 'OsamaSon · Worldwide (official music video)' },
  carti: { src: '/media/carti.jpg', alt: 'Playboi Carti performing in November 2016', source: 'https://commons.wikimedia.org/wiki/File:Playboi_Carti_(cropped).jpg', credit: 'The Come Up Show', license: 'CC BY 2.0' },
  jaydes: { src: '/media/jaydes.jpg', alt: 'Jaydes in the official Poison music video', source: 'https://www.youtube.com/watch?v=MgKebqcV8o4', credit: 'The Toxic Lifestyle · Jaydes — Poison; directed by Tycho' },
  slimey: { src: '/media/slimey.jpg', alt: '2Slimey in the official Vet music video', source: 'https://www.youtube.com/watch?v=vBoKLPKP8J0', credit: '2Slimey · Vet (official music video)' },
  cheese: objectMedia.cheese,
  verity: { src: '/media/bleoodity.png', alt: 'Bleoodity: Bleood\'s photo, tinted violet', source: '/media/SOURCES.md', credit: 'Photo of Bleood supplied by the site owner, tinted violet' },
} satisfies Record<string, RealMedia>

/** The guide: Eric Kaine's real avatar tinted yellow, then Bleood's photo tinted violet (with dreads) after the twist. */
export const characterMedia = {
  kaineity: { src: '/media/eric-kaineity.png', alt: 'Eric Kaineity: Eric Kaine\'s avatar, tinted yellow', source: 'https://www.youtube.com/@eric2kaine', credit: 'Derived from Eric Kaine\'s channel avatar' },
  bleoodity: { src: '/media/bleoodity.png', alt: 'Bleoodity: Bleood\'s photo, tinted violet', source: '/media/SOURCES.md', credit: 'Photo of Bleood supplied by the site owner, tinted violet' },
  ericPfp: { src: '/media/eric-pfp.png', alt: 'Eric Kaine\'s channel avatar', source: 'https://www.youtube.com/@eric2kaine', credit: 'Eric Kaine' },
} satisfies Record<string, RealMedia>

/** Every real underground photo, for collages, popups, clones and wallpapers. */
export const undergroundPhotos: RealMedia[] = [
  artistMedia.bleood, artistMedia.slayr, artistMedia.osamason, artistMedia.carti, artistMedia.jaydes, artistMedia.slimey,
  objectMedia.cheese, objectMedia.burger, objectMedia.seal, objectMedia.drink, objectMedia.draco, objectMedia.slime,
  characterMedia.ericPfp,
]

export type ObjectMediaId = keyof typeof objectMedia
export type ArtistMediaId = keyof typeof artistMedia
const cache = new Map<string, HTMLImageElement>()
export function objectImage(id: ObjectMediaId) {
  const source = objectMedia[id].src
  let image = cache.get(source)
  if (!image) {
    image = new Image()
    image.src = source
    cache.set(source, image)
  }
  return image
}
