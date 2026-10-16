# Purpose pages

The six editorial pages share their Astro layouts across Spanish, English and
Brazilian Portuguese. `LocalizedPurpose.astro` translates their rendered content
on the server, including text, image descriptions and accessible labels. IDs,
styles, form values, analytics identifiers and scripts remain unchanged.

`es.json` contains stable phrase IDs and the Spanish source text.
`translations.json` pairs each ID with `[English, Portuguese]`. Add new source
phrases and both translations together. Repeated gallery labels and tour labels
are composed in `purpose.ts`; country names use `Intl.DisplayNames`.

Page paths live in `data/purposeSlugs.ts`. Related tour and destination links
are matched to their localized Strapi documents by `documentId`. Form feedback
messages live in `purposeClient.ts`; gallery counters use the rendered language.

Run `bun test src/lib/purposeLocalization.test.ts` and `bun run check` after edits.
