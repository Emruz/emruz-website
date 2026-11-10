const errors: Record<string, string> = {
  title: 'Add a title.',
  slug: 'The address can use lowercase letters, numbers and dashes only.',
  taken: 'Another article already uses that address.',
  link: 'The related link must start with / or https://.',
};

export const errorText = (code?: string) => (code ? errors[code] ?? 'Something went wrong.' : null);
