"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    setLoading(false)
  }, [searchParams])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Domain Search</h1>
        
        <div className="mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter domain name..."
            className="w-full p-4 border rounded-lg text-lg"
          />
        </div>
        
        {query && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Search Results for: {query}</h2>
            <p className="text-gray-600">Search functionality is temporarily simplified to resolve module loading issues.</p>
          </div>
        )}
        
        {!query && (
          <div className="text-center text-gray-500">
            <p>Enter a domain name to search</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}