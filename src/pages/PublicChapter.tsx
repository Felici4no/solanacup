import { useSyncExternalStore } from 'react'
import { MatchCover } from '../MatchCover'
import { team } from '../assets'
import { MiniStars } from '../StarRange'
import { OfficialMomentVideo } from '../OfficialMomentVideo'
import { matchBroadcast, eventVideoMarkers, markerForEvent } from '../video'
import { pulseMatch } from '../pulse'
import { demoStore, PUBLIC_USERNAME } from '../demo/repository'
import { navigate, chapterUrl } from '../router'
import { ShareLinkButton } from '../share'
import { PublicShell, PublicNotFound } from './PublicShell'

/* /chapters/:chapterId — one preserved chapter, shareable by URL.
   Match, rating, favourite moment, the public note, and — when the chapter
   is anchored to a broadcast marker — the official video at the exact
   timestamp, origin always visible (OfficialMomentVideo, unchanged). */

export default function PublicChapter({ chapterId }: { chapterId: string }) {
  useSyncExternalStore(demoStore.subscribe, demoStore.getSnapshot, demoStore.getSnapshot)
  const chapter = demoStore.chapterById(chapterId)

  if (!chapter || chapter.visibility !== 'public') {
    return (
      <PublicShell ambient={['#2b303a', '#24222b']} cta={{ label: 'Open demo', to: '/welcome' }}>
        <PublicNotFound what="chapter" />
      </PublicShell>
    )
  }

  const m = chapter.match
  const homeC = team(m.home).colors[0]
  const awayC = team(m.away).colors[0]
  const marker = markerForEvent(eventVideoMarkers, chapter.markerEventId)
  const markerEvent =
    marker && chapter.matchId === 'wc26-sf-eng-arg'
      ? pulseMatch.events.find((e) => e.id === marker.eventId) ?? null
      : null

  return (
    <PublicShell ambient={[homeC, awayC]} intensity={0.9} cta={{ label: 'Open demo', to: '/welcome' }}>
      <div className="page pub-chp">
        <MatchCover match={m} format="landscape" />

        <div className="pub-chp-head">
          <div className="pub-chp-stars">
            <MiniStars value={chapter.memory.rating} />
            <span className="num">{chapter.memory.rating.toFixed(1)}</span>
          </div>
          {chapter.memory.moment && (
            <p className="pub-chp-moment">
              <span className="label" style={{ display: 'block', marginBottom: 6 }}>Momento preferido</span>
              <span className="num">{chapter.memory.moment.min}</span> · {chapter.memory.moment.type} ·{' '}
              {chapter.memory.moment.player}
            </p>
          )}
        </div>

        <blockquote className="pub-chp-note">“{chapter.memory.note}”</blockquote>
        {chapter.memory.place && <p className="pub-chp-place">{chapter.memory.place}</p>}

        {/* official broadcast moment at the chapter's timestamp */}
        {marker && markerEvent && (
          <div className="section" style={{ marginTop: 28 }}>
            <OfficialMomentVideo
              broadcast={matchBroadcast}
              markers={[marker]}
              events={[markerEvent]}
              selectedEventId={markerEvent.id}
              selectedMinute={markerEvent.minute}
              onSelectEvent={() => {}}
            />
          </div>
        )}

        <div className="pub-chp-actions">
          <ShareLinkButton
            label="Copy chapter link"
            title={`${team(m.home).name} × ${team(m.away).name} · GAM3BOOK chapter`}
            url={chapterUrl(chapter.id)}
          />
          <button className="pub-enter solid" onClick={() => navigate(`/u/${PUBLIC_USERNAME}`)}>
            Open the profile
          </button>
        </div>
      </div>
    </PublicShell>
  )
}
