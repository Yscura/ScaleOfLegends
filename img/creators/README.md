# Creator portraits (Streamer Scale)

Drop portrait images here and point the matching entry's `img` field at them in
`js/data/creators.js`, e.g.:

```js
{ name: 'Tyler1', height: 167, img: 'img/creators/tyler1.png', note: '…' },
```

Guidelines:
- **Square** images look best (they're shown in a circle, cropped with `object-fit: cover`). ~200×200 px is plenty.
- PNG or JPG both fine.
- Any filename works — the `img` path is what matters, not the name.
- If `img` is `null` or the file is missing, the circle shows the creator's initial instead, so this is entirely optional and incremental.
