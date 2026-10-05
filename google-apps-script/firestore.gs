/**
 * Minimal Firestore REST client (read-only) using the script owner's OAuth token.
 * Server-side IAM access — Firestore security rules do not apply here, so only the
 * owner of the Firebase project can run this.
 */

function fsBaseUrl_() {
  return 'https://firestore.googleapis.com/v1/projects/' + CONFIG.FIREBASE_PROJECT_ID + '/databases/(default)/documents/';
}

function fsFetch_(url) {
  const res = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      // Bill/quota the call to the Firebase project (avoids "API not enabled in project …" errors)
      'X-Goog-User-Project': CONFIG.FIREBASE_PROJECT_ID,
    },
  });
  const code = res.getResponseCode();
  if (code === 404) return null;
  if (code !== 200) throw new Error('Firestore ' + code + ': ' + res.getContentText().slice(0, 500));
  return JSON.parse(res.getContentText());
}

/** Firestore typed value → plain JS value. */
function fsDecode_(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsDecode_);
  if ('mapValue' in v) return fsDecodeFields_(v.mapValue.fields || {});
  return null;
}

function fsDecodeFields_(fields) {
  const out = {};
  Object.keys(fields || {}).forEach(function (k) {
    out[k] = fsDecode_(fields[k]);
  });
  return out;
}

/** Get one document by path, e.g. 'users/abc/dailyLogs/2026-10-05'. Returns null if missing. */
function fsGet(path) {
  const doc = fsFetch_(fsBaseUrl_() + path);
  return doc ? fsDecodeFields_(doc.fields) : null;
}

/** List every document in a top-level collection → [{ id, data }]. */
function fsList(collection) {
  const out = [];
  let token = '';
  do {
    const json = fsFetch_(fsBaseUrl_() + collection + '?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : ''));
    (json && json.documents ? json.documents : []).forEach(function (d) {
      out.push({ id: d.name.split('/').pop(), data: fsDecodeFields_(d.fields) });
    });
    token = json && json.nextPageToken;
  } while (token);
  return out;
}
