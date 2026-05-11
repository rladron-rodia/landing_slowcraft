import { Nav } from '@/components/sections/nav'
import { Hero } from '@/components/sections/hero'
import { Tesis } from '@/components/sections/tesis'
import { Metodo } from '@/components/sections/metodo'
import { Strategy } from '@/components/sections/strategy'
import { Programs } from '@/components/sections/programs'
import { Principios } from '@/components/sections/principios'
import { Sobre } from '@/components/sections/sobre'
import { ContactCta } from '@/components/sections/contact-cta'
import { Footer } from '@/components/sections/footer'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Tesis />
        <Metodo />
        <Strategy />
        <Programs />
        <Principios />
        <Sobre />
        <ContactCta />
      </main>
      <Footer />
    </>
  )
}
