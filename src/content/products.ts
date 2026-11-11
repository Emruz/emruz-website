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
  'AI summaries using a local model or the cloud provider you choose',
  'Built-in templates, including M&A Meeting and Weekly Scrum',
  'Continue recording: add to a meeting after a break or a crash',
  'Search across all meetings',
  'Copy summaries as rich text or Markdown, or send by email',
  'Import audio files and Meetily meetings',
];

export const motivPremium: { title: string; description: string }[] = [
  { title: 'Assistant', description: 'Ask anything about one meeting or all of them, with chat history, memory and links to the meetings it used.' },
  { title: 'Action items', description: 'Owners, due dates, decisions, highlights and open questions as a checklist.' },
  { title: 'Speaker identification', description: 'Who said what, on-device. Name speakers from the invite, the Teams transcript or a .vtt or .srt file, and recognise them next time with opt-in voiceprints.' },
  { title: 'Meeting awareness', description: 'Notices Teams, Zoom and Google Meet calls, including Meet in a browser tab, offers to record, and stops when the call ends.' },
  { title: 'Calendars', description: 'Apple Calendar on Mac plus several Microsoft 365 and Google accounts. Recordings are named after the meeting, with invitees.' },
  { title: 'Names & terms', description: 'Correct spellings of names and jargon in transcripts and summaries.' },
  { title: 'Automatic cleanup', description: 'Remove old recording audio by age or total size.' },
  { title: 'Custom templates', description: 'Create and edit your own summary templates, and remove the built-in ones you do not use.' },
  { title: 'Markers', description: 'Mark points while recording, such as a change of topic, with a click or a shortcut.' },
  { title: 'Trim, split and merge', description: 'Trim a recording to the meeting, split one recording into several meetings at your markers, or merge two recordings of the same meeting.' },
];

export const motivPrivacy = [
  { title: 'Audio stays on your computer', description: 'Recording and transcription happen locally. Recordings, transcripts and voiceprints never leave the machine.' },
  { title: 'You choose the AI', description: 'Use a local model and work fully offline, or a cloud provider such as Claude or OpenAI. Only transcript text is sent, and only to the provider you pick.' },
  { title: 'No usage tracking', description: 'No analytics. Premium checks in with emruz.com using only your subscription ID and a random device ID.' },
  { title: 'Read-only access', description: 'Calendar and Teams transcript access is read-only. Voiceprints are opt-in, stored locally and deletable.' },
];
