# Funding acknowledgements

Verified 28 September 2026. The shared footer includes the exact mandatory acknowledgement and identifies the funded Augmented Ensemble project. All pages using the base layout receive it, including news and project pages.

## CreaTech recipient sources

Official recipient pack: https://drive.google.com/drive/folders/191KNjI3B1bS-GSlBZAlTU8oG7wa7lqam

- Acknowledgement requirements: https://drive.google.com/file/d/1rMT-Z4MEHI5EzNILX4ol09OQJfrx6T1r/view
- Logo guidelines: https://drive.google.com/file/d/1El0wwCmrQMyLDPzilOHAK4tHXJsh9mD_/view
- CreaTech horizontal dark-green PNG: https://drive.google.com/file/d/1p2GNF7oirWTmiZ5C9vVPtuA3q2k5DZIq/view
- AHRC PNG: https://drive.google.com/file/d/1gwqRDWL7aTqGhk2UPfNjtqfvKV9fbb9T/view

Both PNGs are unchanged copies of supplied artwork. The CreaTech dark-green variant uses the guideline's cream background (#EFF4D4); AHRC uses a white background panel, restored at the user’s request to maintain contrast. The supplied full-colour artwork is unchanged. CSS preserves intrinsic proportions and provides padding and responsive sizing. The pre-existing blog SVG was not substituted for the approved asset.

## ICURe evidence and scope

The user's explicit confirmation of funding through both stages is the basis for acknowledging funding. Existing Explore/Exploit news articles and the From Research to Venture case study establish the sequence and supported activities. No award amounts, award dates, legal grant recipients or new delivery claims are added.

Official programme descriptions confirm the Innovate UK ICURe name and distinguish market exploration from subsequent venture support:
- https://iuk-business-connect.org.uk/opportunities/icure-explore/
- https://iuk-business-connect.org.uk/opportunities/icure-exploit/

UKRI branding guidance requires supplied artwork to retain its proportions, colours and legibility: https://www.ukri.org/wp-content/uploads/2020/10/UKRI-050920-BrandGuidelines.pdf
UKRI terms require approval to copy logos: https://www.ukri.org/who-we-are/terms-of-use/

Following the user's explicit request, both programme logos are included unchanged from the official Innovate UK Business Connect ICURe programme page:
- https://iuk-business-connect.org.uk/wp-content/uploads/2024/06/icure-explore.png
- https://iuk-business-connect.org.uk/wp-content/uploads/2024/06/icure-exploit.png

Both use white backgrounds, intrinsic proportions and descriptive alternative text. The ICURe acknowledgement remains separate from the CreaTech project acknowledgement.

The funding section distinguishes the completed 2026 CreaTech Frontiers Growth Lab (ten-week accelerator, £15,000 in-kind tailored business-growth support, mentoring, market validation and investor readiness) from the £25,000 Live & Immersive Innovation Fund grant to MyJAMS Ltd for Augmented Ensemble (R&D October 2026–April 2027). Verified directly against the current CV sources on 28 September 2026: `/Users/m.diluca@bham.ac.uk/GitHub/cv-test/appendix-grants.tex`, lines 87 and 90, and `appendix-kte.tex`, lines 6–7. The prior generic prototype-development label and article were corrected. The existing article URL/publication timestamp is retained for link continuity, with a 28 September 2026 last-modified date and explicit 2026 programme completion in its body.

## Asset SHA-256

- `createch-frontiers.png`: `882684fb12b51c5cfe816237f96233ca26d1c3d90c96edfc8f91892db0e0a16f`
- `ahrc.png`: `caed27d8a5c3d788f04360c629619c4aa00a4f07c50a95c73b12b8742415a20d`

## Validation

Hugo production build succeeded (17 generated HTML files; Hugo reports 22 pages including other outputs); exact mandatory wording and both ICURe stage names verified in every generated page. Browser checks at 1440px and 390px on the homepage, CreaTech grant article and ICURe Exploit article found no horizontal overflow, one funding block per page, and all four logos loaded with alternative text. Desktop and mobile screenshots were visually reviewed; reference captures are in `docs/funding-review/`. `git diff --check` passed.

Review is local only; no deployment or production publication was performed.
