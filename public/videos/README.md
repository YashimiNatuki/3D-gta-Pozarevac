# Intro video asset

The supplied intro is bundled at:

`public/videos/GameIntro_Pozarevac_ThugLife.mp4`

The source attachment was 119 MiB. To keep the repository asset under GitHub's 100 MB per-file limit and make browser delivery more practical, it was re-encoded from 1280×720 H.264/AAC to web-optimized 1280×720 H.264/AAC (CRF 20, 5 Mbps max rate, AAC 192 kbps, fast-start MP4). The bundled video is about 28 MiB and runs for about 43.5 seconds. The source attachment remains unchanged outside the repository.

The game uses this exact path as its startup intro. If the asset is absent, the startup screen falls back to the in-game cyber-matrix title card and offers a local MP4/WebM source picker. Locally uploaded object URLs are session-only and are deliberately not written to `localStorage`. Do not replace this Požarevac trailer with a third-party sample video.
