'use client'

import Lottie from 'lottie-react'

type PublicLottieProps = {
  animationData: object
  className?: string
}

export default function PublicLottie({ animationData, className }: PublicLottieProps) {
  return <Lottie animationData={animationData} loop autoplay className={className} />
}
