import SiteShell from '@/components/chrome/SiteShell';
import Hero from '@/components/sections/Hero';
import Manifesto from '@/components/sections/Manifesto';
import Arrival from '@/components/sections/Arrival';
import Rooms from '@/components/sections/Rooms';
import Spaces from '@/components/sections/Spaces';
import Reel from '@/components/sections/Reel';
import Detail from '@/components/sections/Detail';
import Location from '@/components/sections/Location';
import Reserve from '@/components/sections/Reserve';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <SiteShell footer={<Footer />}>
      <Hero />
      <Manifesto />
      <Arrival />
      <Rooms />
      <Spaces />
      <Reel />
      <Detail />
      <Location />
      <Reserve />
    </SiteShell>
  );
}
