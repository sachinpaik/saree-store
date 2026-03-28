# About Page Manual Test Checklist

Use this checklist after deploying new content or videos.

## Data / ordering

- [ ] `about_content` title, intro, and HTML body render on `/about`.
- [ ] Videos render in ascending `sort_order` (then `created_at`).
- [ ] First video appears in featured section; remaining videos appear in grid.

## Video UX

- [ ] Video is not loaded until thumbnail is clicked.
- [ ] Clicking thumbnail replaces poster with video player and starts controls-ready playback.
- [ ] Quality dropdown shows `Auto` plus only available qualities (360p/720p/1080p).
- [ ] Switching quality preserves playback position (seeks near the previous timestamp).
- [ ] Manual quality selection persists while interacting with that player.

## Fallback behavior

- [ ] Missing quality files are not shown in dropdown.
- [ ] Video still plays if only one quality exists.
- [ ] Missing poster still shows playable video card with fallback background.
- [ ] Empty videos list shows friendly "Videos will appear here..." message.

## Performance

- [ ] No video auto-plays on page load.
- [ ] Network tab shows MP4 requests only after user interaction.
- [ ] Posters load as images first (fast first render).

## Responsive

- [ ] Mobile: player and dropdown fit without horizontal overflow.
- [ ] Desktop: featured video full-width, remaining videos in 2-column grid.

## Navigation

- [ ] Header includes `Silk Manufacturing` link to `/about`.
- [ ] Footer quick links include `Silk Manufacturing`.
