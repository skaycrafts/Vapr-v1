import Hero from '@/components/sections/Hero';
import Locations from '@/components/sections/Locations';
import Chennai from '@/components/sections/Chennai';
import Rooms from '@/components/sections/Rooms';
import Spaces from '@/components/sections/Spaces';
import Reel from '@/components/sections/Reel';
import Detail from '@/components/sections/Detail';
import Reserve from '@/components/sections/Reserve';

export default function Home() {
  return (
    <>
      <Hero />
      {/* Directly under the hero: a two-property group has to answer "which
          one?" before it answers anything else. */}
      <Locations />
      {/* The chapter. It carries the sentence the manifesto used to hold, and
          sits in the same slot the manifesto did — the hero's scroll cue has
          always pointed here. */}
      <Chennai />
      <Rooms />
      <Spaces />
      <Reel />
      <Detail />
      <Reserve />
    </>
  );
}
