import Hero from '@/components/sections/Hero';
import Locations from '@/components/sections/Locations';
import Manifesto from '@/components/sections/Manifesto';
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
      <Manifesto />
      <Rooms />
      <Spaces />
      <Reel />
      <Detail />
      <Reserve />
    </>
  );
}
