import { spriteImage, spriteUrl, type SpriteId } from './sprites'

/**
 * The Act IV cast, drawn as original cartoon sprites (see sprites.ts).
 * No photographs, no real likenesses, no re-hosted thumbnails: the rappers
 * are represented by parody mascots, clearly labelled as fan nonsense.
 */
export interface CastArt {
  src: string
  alt: string
  sprite: SpriteId
}

const art = (sprite: SpriteId, alt: string): CastArt => ({ src: spriteUrl(sprite), alt, sprite })

export const objectArt = {
  cheese: art('cheese', 'A cartoon wedge of cheese'),
  burger: art('burger', 'A cartoon burger'),
  seal: art('seal', 'A cartoon seal'),
  drank: art('drank', 'A cartoon purple double cup'),
  draco: art('draco', 'A cartoon draco'),
  slime: art('slime', 'Cartoon green slime'),
  torta: art('torta', 'A cartoon torta sandwich'),
  dragon: art('dragon', 'A cartoon dragon'),
  poo: art('poo', 'A cartoon poo'),
  soda: art('soda', 'A cartoon grape soda'),
  coin: art('coin', 'A cartoon coin'),
} satisfies Record<string, CastArt>

/** Parody mascots. Each one is a drawing, not a person. */
export const artistArt = {
  bleood: art('sealdreads', 'Parody mascot for Bleood: a seal with rainbow dreads'),
  slayr: art('burgerguy', 'Parody mascot for Slayr: a burger costume with a visor'),
  osamason: art('flame', 'Parody mascot for OsamaSon: a cartoon flame'),
  carti: art('fangs', 'Parody mascot for Playboi Carti: cartoon vampire fangs'),
  jaydes: art('star', 'Parody mascot for Jaydes: a purple star'),
  slimey: art('slime', 'Parody mascot for 2Slimey: a slime blob'),
  cheese: art('cheeseguy', 'The Cheese Guy: a block of cheese holding a burrito'),
  verity: art('lilverity', 'Lil Verity, the fictional yellow guide orb'),
} satisfies Record<string, CastArt>

export type ObjectArtId = keyof typeof objectArt
export type ArtistArtId = keyof typeof artistArt
export const objectImage = (id: ObjectArtId) => spriteImage(objectArt[id].sprite)
