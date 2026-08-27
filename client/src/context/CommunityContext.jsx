import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../lib/api.js'
import { CommunityContext } from './communityContextValue.js'

// How long to wait for the very first snapshot before declaring the
// backend unreachable. EventSource retries forever on its own with no
// "gave up" signal, so this is the app's own patience timer -- it only
// ever governs the first-connection window. Once a snapshot has arrived
// at least once, a dropped connection always degrades to 'reconnecting',
// never 'failed'.
const FIRST_CONNECT_TIMEOUT_MS = 10000

export function CommunityProvider({ children }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('connecting') // connecting | open | reconnecting | failed
  const hasReceivedFirstSnapshot = useRef(false)

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/stream`)

    const failTimer = setTimeout(() => {
      if (!hasReceivedFirstSnapshot.current) {
        setStatus('failed')
      }
    }, FIRST_CONNECT_TIMEOUT_MS)

    source.addEventListener('snapshot', (event) => {
      hasReceivedFirstSnapshot.current = true
      clearTimeout(failTimer)
      setData(JSON.parse(event.data))
      setStatus('open')
    })

    source.onerror = () => {
      setStatus(hasReceivedFirstSnapshot.current ? 'reconnecting' : 'connecting')
    }

    return () => {
      clearTimeout(failTimer)
      source.close()
    }
  }, [])

  return (
    <CommunityContext.Provider value={{ data, status }}>
      {children}
    </CommunityContext.Provider>
  )
}
