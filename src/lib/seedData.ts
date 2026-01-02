
import { Song } from '@/types';
import { getAllSongs, saveSong } from '@/lib/db';

const EXAMPLE_SONGS: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Amazing Grace',
    artist: 'John Newton',
    key: 'G',
    content: `G                C           G
Amazing grace, how sweet the sound
                        D
That saved a wretch like me
G                C        G
I once was lost, but now I'm found
        D           G
Was blind, but now I see

G              C              G
'Twas grace that taught my heart to fear
                      D
And grace my fears relieved
G                C           G
How precious did that grace appear
    D              G
The hour I first believed`
  },
  {
    title: 'Wonderful Tonight',
    artist: 'Eric Clapton',
    key: 'G',
    content: `G              D
It's late in the evening
C                    D
She's wondering what clothes to wear
G                D
She puts on her makeup
C                      D
And brushes her long blonde hair

C                 D
And then she asks me
G            D        Em
Do I look alright
        C              D              G    D
And I say yes, you look wonderful tonight

G                  D
We go to a party
C                      D
And everyone turns to see
G                    D
This beautiful lady
C                D
Walking around with me`
  },
  {
    title: 'Hallelujah',
    artist: 'Leonard Cohen',
    key: 'C',
    content: `C                 Am
I've heard there was a secret chord
     C                  Am
That David played and it pleased the Lord
    F                G               C       G
But you don't really care for music, do you?
   C                  F           G
It goes like this: the fourth, the fifth
    Am              F
The minor fall, the major lift
    G              E7             Am
The baffled king composing Hallelujah

F           Am
Hallelujah, Hallelujah
F           C   G   C   G
Hallelujah, Hallelu-jah`
  }
];

export const seedExampleSongs = async (): Promise<void> => {
  try {
    const existingSongs = await getAllSongs();
    
    if (existingSongs.length === 0) {
      const now = Date.now();
      
      for (let i = 0; i < EXAMPLE_SONGS.length; i++) {
        const song: Song = {
          ...EXAMPLE_SONGS[i],
          id: `song-${now}-${i}`,
          createdAt: now + i,
          updatedAt: now + i
        };
        
        await saveSong(song);
      }
    }
  } catch (error) {
    console.error('Error seeding example songs:', error);
  }
};
