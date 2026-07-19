import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Welcome from './pages/Welcome'
import PublicProfile from './pages/PublicProfile'
import PublicChapter from './pages/PublicChapter'
import { useRoute, navigate } from './router'
import { demoStore } from './demo/repository'
import './index.css'
import './features.css'

/* Public routes render standalone surfaces; everything else is the app,
   whose internal navigation stays state-based and untouched. A first
   visit lands on /welcome — no login, ever; just a local demo session. */
function Root() {
  const route = useRoute()

  useEffect(() => {
    if (route.name === 'app' && !demoStore.hasSession()) navigate('/welcome', { replace: true })
  }, [route])

  if (route.name === 'welcome') return <Welcome />
  if (route.name === 'publicProfile') return <PublicProfile username={route.username} />
  if (route.name === 'publicChapter') return <PublicChapter chapterId={route.chapterId} />
  if (!demoStore.hasSession()) return null // redirecting to /welcome
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
