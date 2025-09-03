'use client'

export const useMiniApp = () => {
  // Simple fallback implementation without FarcasterProvider
  const isFarcasterApp = false // Will be implemented later
  
  return {
    isMiniApp: isFarcasterApp,
    composeCast: async (text: string, embeds?: any) => {
      console.log('Cast composition:', text, embeds)
      alert('Cast feature will be available when Farcaster integration is complete')
    },
    triggerHaptic: (message: string) => {
      console.log('Haptic feedback:', message)
      alert(message)
    },
    triggerNotificationHaptic: (message: string) => {
      console.log('Notification haptic:', message)
      alert(message)
    },
    isInFarcasterContext: () => false,
    farcasterUser: null,
    addToFarcaster: () => {
      console.log('addToFarcaster called - functionality to be implemented')
    }
  }
}
