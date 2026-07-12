import { rgba } from './assets'

/* Contextual ambient light — colors escape from the active content into the
   shell. Restrained alphas keep it behind readability at all times. */
export function AmbientBackground({
  colors,
  intensity = 1,
}: {
  colors: [string, string, string?]
  intensity?: number
}) {
  const [c1, c2, c3] = colors
  return (
    <div className="ambient" aria-hidden>
      <div
        className="amb-wash"
        // key re-mounts the wash so the color change cross-fades in
        key={`${c1}-${c2}-${c3 ?? ''}`}
        style={
          {
            '--amb-1': rgba(c1, 0.5),
            '--amb-2': rgba(c2, 0.42),
            '--amb-3': c3 ? rgba(c3, 0.28) : 'transparent',
            '--amb-intensity': intensity,
          } as React.CSSProperties
        }
      />
      <div className="amb-vignette" />
      <div className="amb-grain" />
    </div>
  )
}
