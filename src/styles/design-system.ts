export const theme = {
  colors: {
    primary: {
      text: 'text-slate-800',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-400',
    },
    accent: {
      text: 'text-blue-600',
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
    },
    severity: {
      red: { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
      amber: { text: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
      emerald: { text: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    },
    background: {
      card: 'bg-white',
      page: 'bg-slate-50',
      hover: 'bg-slate-100',
    },
    border: 'border-slate-200',
  },
  typography: {
    heading: 'text-lg font-semibold text-slate-800',
    body: 'text-sm text-slate-600',
    caption: 'text-xs text-slate-400 uppercase tracking-wide',
    label: 'text-xs text-slate-500 uppercase tracking-wide font-medium',
  },
  spacing: {
    cardPadding: 'p-4',
    sectionGap: 'space-y-6',
    listItemPadding: 'py-3 px-4',
  },
  radius: {
    card: 'rounded-lg',
    button: 'rounded-md',
    input: 'rounded-md',
  },
} as const
