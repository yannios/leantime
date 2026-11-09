#!/usr/bin/env bash
# Re-apply the Trames patches to a fresh Leantime release tree.
#
#   ./apply-patches.sh /path/to/new/leantime
#
# Run from this folder (the one holding patches/ and files.tsv). Every patch is a
# plain unified diff against Leantime v3.13.2, applied with `patch -p1` from the
# new tree's root. The theme and the Croatian overrides are separate copies - see
# REAPPLY.md.
set -uo pipefail

target="${1:-}"
if [[ -z "$target" ]]; then
    echo "upotreba: $0 /putanja/do/leantime" >&2
    exit 1
fi
if [[ ! -d "$target/app" ]]; then
    echo "greška: $target ne izgleda kao Leantime (nema app/)" >&2
    exit 1
fi

here="$(cd "$(dirname "$0")" && pwd)"
ok=0
failed=0

while IFS=$'\t' read -r file patch; do
    [[ -z "${file:-}" ]] && continue
    if patch -p1 -l --forward --directory "$target" -i "$here/$patch" >/dev/null 2>&1; then
        echo "OK    $file"
        ok=$((ok + 1))
    else
        echo "FAIL  $file   ->  patch -p1 -l --forward -i $here/$patch"
        failed=$((failed + 1))
    fi
done < "$here/patches/files.tsv"

echo
echo "primijenjeno: $ok, neuspjelo: $failed"
[[ $failed -eq 0 ]] || exit 2