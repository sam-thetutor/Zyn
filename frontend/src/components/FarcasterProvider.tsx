'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface FarcasterContextType {
  isFarcasterApp: boolean
  isReady: boolean
  context: any
  showToast: (message: string) => void
  composeCast: (text: string, embeds?: [] | [string] | [string, string]) => void
  callReady: () => Promise<void>
  // Enhanced features
  getUserDisplayName: () => string
  getUserEmoji: () => string
  getRandomEmoji: () => string
  isInFarcasterContext: () => boolean
  getLocationContext: () => string
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined)

export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider')
  }
  return context
}

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isFarcasterApp, setIsFarcasterApp] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [context] = useState<any>(null)

  // Cool emojis for Farcaster users
  const farcasterEmojis = ['🚀', '✨', '🎯', '🔥', '💫', '🌟', '⚡', '🎪', '🎭', '🎨', '🎵', '🎮', '🏆', '💎', '🌈', '🎊', '🎉', '🎁', '🎈', '🎠', '🎡', '🎢', '🎣', '🎤', '🎥', '🎦', '🎧', '🎨', '🎩', '🎪', '🎫', '🎬', '🎭', '🎮', '🎯', '🎲', '🎳', '🎴', '🎵', '🎶', '🎷', '🎸', '🎹', '🎺', '🎻', '🎼', '🎽', '🎾', '🎿', '🏀', '🏁', '🏂', '🏃', '🏄', '🏅', '🏆', '🏇', '🏈', '🏉', '🏊', '🏋️', '🏌️', '🏍️', '🏎️', '🏏', '🏐', '🏑', '🏒', '🏓', '🏔️', '🏕️', '🏖️', '🏗️', '🏘️', '🏙️', '🏚️', '🏛️', '🏜️', '🏝️', '🏞️', '🏟️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🏰', '🏱', '🏲', '🏳️', '🏴', '🏵️', '🏶', '🏷️', '🏸', '🏹', '🏺', '🏻', '🏼', '🏽', '🏾', '🏿']

  // Random emojis for non-Farcaster users
  const randomEmojis = ['🎯', '🧠', '💡', '🎪', '🎭', '🎨', '🎵', '🎮', '🏆', '💎', '🌈', '🎊', '🎉', '🎁', '🎈', '🎠', '🎡', '🎢', '🎣', '🎤', '🎥', '🎦', '🎧', '🎨', '🎩', '🎪', '🎫', '🎬', '🎭', '🎮', '🎯', '🎲', '🎳', '🎴', '🎵', '🎶', '🎷', '🎸', '🎹', '🎺', '🎻', '🎼', '🎽', '🎾', '🎿', '🏀', '🏁', '🏂', '🏃', '🏄', '🏅', '🏆', '🏇', '🏈', '🏉', '🏊', '🏋️', '🏌️', '🏍️', '🏎️', '🏏', '🏐', '🏑', '🏒', '🏓', '🏔️', '🏕️', '🏖️', '🏗️', '🏘️', '🏙️', '🏚️', '🏛️', '🏜️', '🏝️', '🏞️', '🏟️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🏰', '🏱', '🏲', '🏳️', '🏴', '🏵️', '🏶', '🏷️', '🏸', '🏹', '🏺', '🏻', '🏼', '🏽', '🏾', '🏿']

  useEffect(() => {
    const detectFarcasterApp = async () => {
      try {
        // Check if we're in a Farcaster environment by looking for the SDK
        const isFarcaster = typeof window !== 'undefined' && 
          (window.location.href.includes('farcaster') || 
           window.navigator.userAgent.includes('Farcaster') ||
           // Check for Farcaster-specific global variables
           (window as any).farcaster || 
           (window as any).fc)
        
        if (isFarcaster) {
          setIsFarcasterApp(true)
          console.log('Farcaster environment detected')
        }
        
        setIsReady(true)
      } catch (error) {
        console.error('Error detecting Farcaster app:', error)
        setIsReady(true)
      }
    }

    detectFarcasterApp()
  }, [])

  const composeCast = async (text: string, embeds?: [] | [string] | [string, string]) => {
    if (isFarcasterApp) {
      try {
        // Placeholder for Farcaster cast composition
        console.log('Composing cast:', text, embeds)
        alert('Cast composition feature will be implemented when Farcaster SDK is properly integrated')
      } catch (error) {
        console.error('Error composing cast:', error)
        alert('Failed to compose cast')
      }
    } else {
      // Fallback for non-Farcaster environments
      alert('Cast feature available in Farcaster Mini App')
    }
  }

  const showToast = async (message: string) => {
    if (isFarcasterApp) {
      try {
        // Placeholder for Farcaster haptics
        console.log('Farcaster haptic feedback:', message)
      } catch (error) {
        console.log('Haptics not available, using fallback')
      }
    }
    // Fallback to browser alert for now
    alert(message)
  }

  const callReady = async () => {
    try {
      // Placeholder for Farcaster SDK ready call
      console.log('Farcaster SDK ready called')
      setIsReady(true)
    } catch (error) {
      console.error('Failed to call Farcaster SDK ready:', error)
    }
  }

  // Enhanced Farcaster-specific functions
  const getUserDisplayName = (): string => {
    if (!isFarcasterApp || !context?.user) return ''
    
    const user = context.user
    if (user.displayName) return user.displayName
    if (user.username) return user.username
    return `FID: ${user.fid}`
  }

  const getUserEmoji = (): string => {
    if (!isFarcasterApp || !context?.user) return getRandomEmoji()
    
    // Use FID to generate consistent emoji for the same user
    const user = context.user
    const emojiIndex = user.fid % farcasterEmojis.length
    return farcasterEmojis[emojiIndex]
  }

  const getRandomEmoji = (): string => {
    const randomIndex = Math.floor(Math.random() * randomEmojis.length)
    return randomEmojis[randomIndex]
  }

  const isInFarcasterContext = (): boolean => {
    return isFarcasterApp && !!context?.user
  }

  const getLocationContext = (): string => {
    if (!isFarcasterApp || !context?.location) return 'Social Feed'
    
    const location = context.location
    switch (location.type) {
      case 'cast_embed':
        return `Cast by ${location.cast?.author?.displayName || location.cast?.author?.username || 'Unknown'}`
      case 'cast_share':
        return `Shared from ${location.cast?.author?.displayName || location.cast?.author?.username || 'Unknown'}`
      case 'notification':
        return 'Notification'
      case 'launcher':
        return 'Launcher'
      case 'channel':
        return `Channel: ${location.channel?.name || 'Unknown'}`
      case 'open_miniapp':
        return `From ${location.referrerDomain}`
      default:
        return 'Social Feed'
    }
  }

  const value: FarcasterContextType = {
    isFarcasterApp,
    isReady,
    context,
    showToast,
    composeCast,
    callReady,
    getUserDisplayName,
    getUserEmoji,
    getRandomEmoji,
    isInFarcasterContext,
    getLocationContext,
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
}
