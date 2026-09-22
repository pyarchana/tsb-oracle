import type {Vehicle} from '@/lib/agent/systemPrompt'
import type {SourceRow} from '@/lib/sanity/queries'
import {Pill} from './Pill'
import {settlement, shortTitle, statusLabel, typeLabel, type Records} from './records'
import styles from './SourceRail.module.css'

interface SourceRailProps {
  records: Records | null
  error: string | null
  cited: Set<string>
  vehicle: Vehicle
}

export function SourceRail({records, error, cited, vehicle}: SourceRailProps) {
  if (error) {
    return (
      <aside className={styles.rail}>
        <p className={styles.note}>The sources could not be loaded: {error}</p>
      </aside>
    )
  }
  if (!records) {
    return (
      <aside className={styles.rail}>
        <p className={styles.note}>Loading sources</p>
      </aside>
    )
  }

  const {sources, related, contradictions} = records
  const citedCount = [...sources, ...related].filter((s) => cited.has(s.tsbNumber)).length
  const openCount = contradictions.filter((c) => c.status !== 'resolved').length

  return (
    <aside className={styles.rail} aria-label="Sources">
      <h2 className={styles.title}>
        Sources{' '}
        <em>
          {sources.length} found &middot; {citedCount} cited
        </em>
      </h2>
      {sources.length === 0 ? (
        <p className={styles.note}>Nothing in the dataset covers this vehicle.</p>
      ) : (
        <ul className={styles.list}>
          {sources.map((s) => (
            <Source key={s.tsbNumber} source={s} cited={cited.has(s.tsbNumber)} trim={vehicle.trim} />
          ))}
        </ul>
      )}

      {related.length > 0 && (
        <div className={styles.block}>
          <h2 className={styles.title}>
            Also referenced <em>not for this car</em>
          </h2>
          <ul className={styles.list}>
            {related.map((s) => (
              <Source key={s.tsbNumber} source={s} cited={cited.has(s.tsbNumber)} trim={vehicle.trim} />
            ))}
          </ul>
        </div>
      )}

      {contradictions.length > 0 && (
        <div className={styles.block}>
          <h2 className={styles.title}>
            Contradictions <em>{openCount} open</em>
          </h2>
          <ul className={styles.list}>
            {contradictions.map((c) => (
              <li key={c.id} className={styles.row}>
                <span>{c.topic}</span>
                <Pill state={settlement(c)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

function Source({source, cited, trim}: {source: SourceRow; cited: boolean; trim?: string}) {
  const excludesTrim =
    trim !== undefined && (source.excludedTrims ?? []).some((t) => t.toLowerCase() === trim.toLowerCase())
  const title = shortTitle(source)

  return (
    <li className={`${styles.src} ${cited ? styles.cited : ''}`}>
      <div className={styles.tick} />
      <div>
        <div className={styles.no}>
          <span>{source.tsbNumber}</span>
          <span className={styles.type}>{typeLabel(source)}</span>
        </div>
        <div className={styles.name}>
          {source.sourceUrl ? (
            <a href={source.sourceUrl} target="_blank" rel="noreferrer">
              {title}
            </a>
          ) : (
            title
          )}
        </div>
        <div className={styles.date}>
          {source.publishDate ?? 'undated'} &middot; {statusLabel(source)}
          {excludesTrim ? ` \u00b7 excludes ${trim}` : ''}
        </div>
      </div>
    </li>
  )
}
