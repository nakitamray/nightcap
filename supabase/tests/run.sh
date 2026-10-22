#!/usr/bin/env bash
# Runs every migration, oldest first, against a scratch database, then the
# tests. Needs a Postgres you can create databases on, e.g.
#   PGHOST=localhost PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db="nightcap_test_$$"
psql -qX -v ON_ERROR_STOP=1 -d postgres -c "create database $db" >/dev/null
trap 'psql -qX -d postgres -c "drop database if exists $db" >/dev/null' EXIT

run() { PGOPTIONS="-c client_min_messages=error" psql -qX -v ON_ERROR_STOP=1 -d "$db" -f "$1" >/dev/null; }
run "$here/supabase-stub.sql"
for f in "$here"/../migrations/*.sql; do run "$f"; done
# results go nowhere; each check prints "ok - ..." or stops the run
psql -qXAt -v ON_ERROR_STOP=1 -d "$db" -f "$here/policies.sql" -o /dev/null 2>&1 |
  sed -e 's/^psql:[^ ]* //' -e 's/^NOTICE:  //'
test "${PIPESTATUS[0]}" -eq 0
