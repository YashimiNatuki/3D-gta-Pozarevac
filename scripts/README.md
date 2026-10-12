# Data maintenance scripts

Scripts in this directory are developer tools, not part of browser gameplay execution.

The city-data feature branch documents scripts for updating the bounded OSM extract and processing the DEM heightfield. Before running either:
1. Review the source and command arguments.
2. Confirm output paths and preserve the current data files for rollback.
3. Observe upstream API limits and licensing terms.
4. Capture input/output provenance.
5. Re-run source attribution and gameplay invariant checks.

Do not run external scripts against the user's Unity project or rewrite scene files as a side effect. Check the current branch inventory before using a script named here.
