import { ArrowDown, Share2 } from 'lucide-react'
import Reveal from './Reveal'

export default function SectionOne() {
  return (
    <section className="relative flex min-h-screen flex-col justify-end supports-[height:100svh]:min-h-[100svh]">
      <div className="relative flex flex-col gap-10 px-5 pb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:px-8 md:px-12 md:pb-20">
        <h1 className="max-w-xl text-4xl font-medium uppercase leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
          <Reveal as="span" delay={100} className="block pl-6 sm:pl-12">
            Today AI
          </Reveal>
          <Reveal as="span" delay={220} className="block">
            Aligns <span className="normal-case italic font-light">with</span>
          </Reveal>
          <Reveal as="span" delay={340} className="block pl-10 sm:pl-20">
            // Bold
          </Reveal>
          <Reveal as="span" delay={460} className="block pl-16 sm:pl-32">
            Dreams
          </Reveal>
        </h1>

        <div className="flex w-full max-w-xs flex-col items-start">
          <Reveal
            delay={400}
            className="mb-6 flex w-full items-center justify-between font-mono text-white sm:mb-8"
          >
            <span className="text-lg">( A )</span>
            <span className="text-xs text-white/70">[ 001 /004 ]</span>
          </Reveal>

          <Reveal delay={520} className="mb-6 text-sm leading-relaxed text-white/85 drop-shadow-md sm:mb-8">
            NovaAI is where your bravest work finds its true expression. We hand you the
            means not only to form the future.
          </Reveal>

          <Reveal delay={640} className="w-full">
            <a
              href="#begin"
              className="block w-full rounded-full border border-white/60 px-8 py-3 text-center font-mono text-xs uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-white hover:text-black"
            >
              Begin Today
            </a>
          </Reveal>
        </div>
      </div>

      <Reveal delay={760} className="absolute bottom-5 left-5 sm:bottom-6 sm:left-8 md:left-12">
        <button type="button" aria-label="Share" className="text-white/80 hover:text-white">
          <Share2 size={18} />
        </button>
      </Reveal>

      <Reveal delay={760} className="absolute bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6">
        <ArrowDown size={18} className="animate-bounce text-white/80" />
      </Reveal>
    </section>
  )
}
