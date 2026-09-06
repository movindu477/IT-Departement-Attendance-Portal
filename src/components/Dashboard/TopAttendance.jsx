import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MemberCard from './MemberCard';

const PER_PAGE = 3;

/**
 * Ranked roster as a sliding carousel. Every page is rendered inside one track
 * and the track is translated, so paging is a slow eased slide (720ms, see
 * .carousel-track) rather than an instant swap of card contents.
 */
const TopAttendance = ({
  ranked,
  loading,
  error,
  currentUid,
  workingDaysElapsed = 0,
  monthLabel = '',
}) => {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(ranked.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);

  const pages = Array.from({ length: pageCount }, (_, i) =>
    ranked.slice(i * PER_PAGE, i * PER_PAGE + PER_PAGE)
  );

  return (
    <div className="bg-surface border border-line rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-ink tracking-tight">Top attendance</h3>

        {!loading && !error && ranked.length > PER_PAGE && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Previous page"
              className="w-8 h-8 rounded-full bg-raised border border-line text-ink
                         flex items-center justify-center hover:bg-line transition-colors
                         disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-muted tabular-nums px-0.5">
              {safePage + 1}/{pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
              className="w-8 h-8 rounded-full bg-raised border border-line text-ink
                         flex items-center justify-center hover:bg-line transition-colors
                         disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-raised" />
              <div className="h-3 w-24 rounded bg-raised mt-3" />
              <div className="h-2.5 w-20 rounded bg-raised mt-2" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error.message}
        </p>
      )}

      {!loading && !error && ranked.length > 0 && (
        <div className="overflow-hidden">
          <div
            className="carousel-track flex"
            style={{ transform: `translateX(-${safePage * 100}%)` }}
          >
            {pages.map((group, pageIdx) => (
              <div
                key={pageIdx}
                className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-5"
                aria-hidden={pageIdx !== safePage}
              >
                {group.map((m, i) => {
                  const rank = pageIdx * PER_PAGE + i + 1;
                  const days = m.stats.daysPresent;
                  const pct = workingDaysElapsed > 0
                    ? Math.round((days / workingDaysElapsed) * 100)
                    : 0;

                  return (
                    <MemberCard
                      key={m.uid}
                      member={m}
                      isSelf={m.uid === currentUid}
                      badge={m.isOnline ? 'Active' : `#${rank}`}
                      badgeTone={m.isOnline ? 'mint' : 'azure'}
                      dateLine={m.stats.lastMarked ? `Last logged ${m.stats.lastMarked}` : 'No logs yet'}
                      note={
                        workingDaysElapsed > 0
                          ? `${days} of ${workingDaysElapsed} working days present — ${pct}%${monthLabel ? ` in ${monthLabel}` : ''}.`
                          : `${days} day${days === 1 ? '' : 's'} present so far.`
                      }
                    />
                  );
                })}

                {/* Keep the last page the same width as a full one */}
                {group.length < PER_PAGE &&
                  Array.from({ length: PER_PAGE - group.length }).map((_, k) => (
                    <div key={`pad-${k}`} aria-hidden="true" />
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && ranked.length === 0 && (
        <p className="text-xs text-muted py-8 text-center">No attendance published yet.</p>
      )}
    </div>
  );
};

export default TopAttendance;
