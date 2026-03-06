import React from 'react'
import Hero from '@/app/components/Home/Hero'
import Companies from '@/app/components/Home/Companies'
import NamesList from '@/app/components/Home/Courses'
import Mentor from '@/app/components/Home/Mentor'
import Testimonial from '@/app/components/Home/Testimonial'
import Newsletter from '@/app/components/Home/Newsletter'
import { Metadata } from 'next'
import ContactForm from './components/Contact/Form'
export const metadata: Metadata = {
  title: 'Si Educational',
}

export default function Home() {
  return (
    <main>
      <Hero />
      <Companies />
      <NamesList />
      <Mentor />
      <Testimonial />
      <ContactForm />
      <Newsletter />
    </main>
  )
}
