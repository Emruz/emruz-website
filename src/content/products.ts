/** Release page; asset names vary by version and architecture */
export const MOTIV_DOWNLOAD_URL = 'https://github.com/Emruz/motiv-releases/releases/';

export interface Product {
  slug: string;
  name: string;
  href: string;
  tagline: string;
  description: string;
  platforms: string;
  status: 'Coming soon' | 'Available';
}

export const products: Product[] = [
  {
    slug: 'motiv',
    name: 'Motiv',
    href: '/motiv',
    tagline: 'Your meetings, recorded, transcribed and understood, without sending your audio anywhere.',
    description:
      'A private AI meeting assistant. Records Teams, Zoom and Google Meet calls, transcribes them on your computer, and turns them into summaries, action items and answers.',
    platforms: 'macOS and Windows',
    status: 'Coming soon',
  },
];

export const motivFree = [
  'Record any meeting, microphone and system audio',
  'Local transcription with Whisper or Parakeet',
  'AI summaries with templates, using a local model or the cloud provider you choose',
  'Search across all meetings',
  'Copy summaries as rich text or Markdown, or send by email',
  'Import audio files and Meetily meetings',
];

export const motivPremium: { title: string; description: string }[] = [
  { title: 'Assistant', description: 'Ask anything about one meeting or all of them, with links to the meetings it used.' },
  { title: 'Action items', description: 'Owners, due dates, decisions, highlights and open questions as a checklist.' },
  { title: 'Speaker identification', description: 'Who said what, on-device. Name speakers from the invite and recognise them next time with opt-in voiceprints.' },
  { title: 'Meeting awareness', description: 'Notices Teams, Zoom and Google Meet calls, offers to record, and stops when the call ends.' },
  { title: 'Calendars', description: 'Apple Calendar on Mac plus Microsoft 365 and Google accounts. Recordings are named after the meeting, with invitees.' },
  { title: 'Names & terms', description: 'Correct spellings of names and jargon in transcripts and summaries.' },
  { title: 'Automatic cleanup', description: 'Remove old recording audio by age or total size.' },
  { title: 'Custom templates', description: 'Create and edit your own summary templates. The built-in templates stay free.' },
  { title: 'Trim recordings', description: 'Trim a meeting’s recording to the part you need.' },
];

export const motivPrivacy = [
  { title: 'Audio stays on your computer', description: 'Recording and transcription happen locally. Recordings, transcripts and voiceprints never leave the machine.' },
  { title: 'You choose the AI', description: 'Use a local model and work fully offline, or a cloud provider such as Claude or OpenAI. Only transcript text is sent, and only to the provider you pick.' },
  { title: 'No usage tracking', description: 'No analytics. Premium checks in with emruz.com using only your subscription ID and a random device ID.' },
  { title: 'Read-only calendars', description: 'Calendar access is read-only. Voiceprints are opt-in, stored locally and deletable.' },
];
