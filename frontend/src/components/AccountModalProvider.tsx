'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect, useMemo } from 'react'

type Props = { children: React.ReactNode }

export default function AccountModalProvider({ children }: Props) {
  const { address, isConnected } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const wallet = useMemo(() => address?.toLowerCase() ?? '', [address])

  useEffect(() => {
    let aborted = false
    async function ensureAccount() {
      if (!isConnected || !wallet) return
      
      try {
        // For now, we'll just check if we have a name
        // In a real implementation, you'd call your API here
        if (!aborted) {
          if (!name) {
            setIsOpen(true)
          }
        }
      } catch (e) {
        // Open modal to allow user to retry creating
        if (!aborted) setIsOpen(true)
      }
    }
    ensureAccount()
    return () => {
      aborted = true
    }
  }, [isConnected, wallet, name])

  async function saveProfile() {
    if (!wallet) return
    setLoading(true)
    try {
      // For now, just close the modal
      // In a real implementation, you'd call your API here
      console.log('Saving profile:', { wallet, name })
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  // Auto-save functionality can be added later

  return (
    <>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Complete Your Profile</h2>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your display name"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={loading || !name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
