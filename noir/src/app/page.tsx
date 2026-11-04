import Header from '@/components/layout/Header';
import Hero from '@/components/sections/Hero';
import FeaturedProduct from '@/components/sections/FeaturedProduct';
import Collection from '@/components/sections/Collection';
import About from '@/components/sections/About';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <FeaturedProduct />
      <Collection />
      <About />
      <Footer />
    </main>
  );
}
