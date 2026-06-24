'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

interface CardData {
  id: number
  imageUrl: string
  title: string
}

interface ImageSwiperProps {
  cards?: CardData[]
  cardWidth?: number
  cardHeight?: number
  className?: string
}

const DEFAULT_CARDS: CardData[] = [
  { id: 1, imageUrl: '/images/collections/jamdani.jpg', title: 'Jamdani Sharee' },
  { id: 2, imageUrl: '/images/collections/nakshi.jpg', title: 'Nakshi Kantha' },
  { id: 3, imageUrl: '/images/collections/punjabi.jpg', title: 'Punjabi Collection' },
  { id: 4, imageUrl: '/images/collections/shoes.jpg', title: 'Traditional Shoes' },
  { id: 5, imageUrl: '/images/collections/muslin.jpg', title: 'Muslin Fabric' },
]

export const ImageSwiper: React.FC<ImageSwiperProps> = ({
  cards = DEFAULT_CARDS,
  cardWidth = 256,
  cardHeight = 352,
  className = ''
}) => {
  const cardStackRef = useRef<HTMLDivElement>(null)
  const isSwiping = useRef(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const animationFrameId = useRef<number | null>(null)

  const [cardOrder, setCardOrder] = useState<number[]>(() =>
    Array.from({ length: cards.length }, (_, i) => i)
  )

  const getCards = useCallback((): HTMLElement[] => {
    if (!cardStackRef.current) return []
    return Array.from(cardStackRef.current.querySelectorAll('.image-card'))
  }, [])

  const getActiveCard = useCallback((): HTMLElement | null => {
    return getCards()[0] || null
  }, [getCards])

  const updateCardPositions = useCallback(() => {
    getCards().forEach((card, i) => {
      card.style.setProperty('--i', i.toString())
      card.style.setProperty('--swipe-x', '0px')
      card.style.setProperty('--swipe-rotate', '0deg')
      card.style.opacity = '1'
      card.style.transition = 'transform 0.5s ease, opacity 0.5s ease'
    })
  }, [getCards])

  const applySwipeStyles = useCallback((deltaX: number) => {
    const card = getActiveCard()
    if (!card) return
    const rotation = deltaX * 0.1
    const opacity = 1 - Math.abs(deltaX) / (cardWidth * 1.5)
    card.style.setProperty('--swipe-x', `${deltaX}px`)
    card.style.setProperty('--swipe-rotate', `${rotation}deg`)
    card.style.opacity = opacity.toString()
  }, [getActiveCard, cardWidth])

  const handleStart = useCallback((clientX: number) => {
    if (isSwiping.current) return
    isSwiping.current = true
    startX.current = clientX
    currentX.current = clientX
    const card = getActiveCard()
    if (card) card.style.transition = 'none'
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
  }, [getActiveCard])

  const handleMove = useCallback((clientX: number) => {
    if (!isSwiping.current) return
    currentX.current = clientX
    animationFrameId.current = requestAnimationFrame(() => {
      const deltaX = currentX.current - startX.current
      applySwipeStyles(deltaX)
    })
  }, [applySwipeStyles])

  const handleEnd = useCallback(() => {
    if (!isSwiping.current) return
    isSwiping.current = false
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    const deltaX = currentX.current - startX.current
    const threshold = cardWidth / 3
    const card = getActiveCard()
    if (!card) return
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
    if (Math.abs(deltaX) > threshold) {
      const direction = Math.sign(deltaX)
      const swipeOutX = direction * (cardWidth * 1.5)
      card.style.setProperty('--swipe-x', `${swipeOutX}px`)
      card.style.setProperty('--swipe-rotate', `${direction * 15}deg`)
      card.style.opacity = '0'
      setTimeout(() => {
        setCardOrder(prev => [...prev.slice(1), prev[0]])
      }, 300)
    } else {
      applySwipeStyles(0)
    }
  }, [getActiveCard, applySwipeStyles, cardWidth])

  useEffect(() => {
    const element = cardStackRef.current
    if (!element) return
    const onPointerDown = (e: PointerEvent) => handleStart(e.clientX)
    const onPointerMove = (e: PointerEvent) => handleMove(e.clientX)
    const onPointerUp = () => handleEnd()
    const onPointerLeave = () => handleEnd()
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)
    element.addEventListener('pointerleave', onPointerLeave)
    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerUp)
      element.removeEventListener('pointerleave', onPointerLeave)
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [handleStart, handleMove, handleEnd])

  useEffect(() => {
    updateCardPositions()
  }, [cardOrder, updateCardPositions])

  return (
    <section
      ref={cardStackRef}
      className={`relative grid place-content-center select-none ${className}`}
      style={{
        width: cardWidth + 32,
        height: cardHeight + 32,
        perspective: '1000px',
        touchAction: 'none',
      } as React.CSSProperties}
    >
      {cardOrder.map((originalIndex, displayIndex) => {
        const card = cards[originalIndex]
        return (
          <article
            key={card.id}
            className="image-card absolute cursor-grab active:cursor-grabbing place-self-center border-2 border-slate-700 rounded-2xl shadow-lg overflow-hidden will-change-transform bg-slate-800"
            style={{
              '--i': displayIndex.toString(),
              '--swipe-x': '0px',
              '--swipe-rotate': '0deg',
              width: cardWidth,
              height: cardHeight,
              zIndex: cards.length - displayIndex,
              transform: `translateY(calc(var(--i) * 10px)) translateZ(calc(var(--i) * -45px)) translateX(var(--swipe-x)) rotate(var(--swipe-rotate))`,
            } as React.CSSProperties}
          >
            <img
              src={card.imageUrl}
              alt={card.title}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.src = `https://placehold.co/${cardWidth}x${cardHeight}/2d3748/e2e8f0?text=${encodeURIComponent(card.title)}`
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="font-bold text-xl text-white drop-shadow-lg">{card.title}</h3>
            </div>
          </article>
        )
      })}
    </section>
  )
}
