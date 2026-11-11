// What to tell someone about their spotify connection, in the room's record
// panel and on the account page. Keyed by the ?spotify= the callback sends
// back, plus 'not-allowed' for when spotify turns an account away.

export const SPOTIFY_RESULT: Record<string, string> = {
  connected: 'spotify’s connected. the record lights up when you’re listening.',
  denied: 'spotify wasn’t connected. you can try again any time.',
  'signed-out': 'you were signed out partway through. sign in and try again.',
  failed: 'spotify didn’t answer properly. give it a minute and try again.',
  'not-allowed':
    'spotify won’t let this account in yet. while nightcap is small, spotify only lets in people whoever runs it has added by hand (up to five). send them the email on your spotify account, then come back and connect again.',
}
