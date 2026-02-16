export const UI_COLORS = [
	'red', 'rose', 'pink', 'fuchsia', 'purple', 'violet',
	'indigo', 'blue', 'sky', 'cyan', 'teal', 'emerald',
	'green', 'lime', 'yellow', 'amber', 'orange', 'slate',
] as const

export type UiColor = (typeof UI_COLORS)[number]

export const VALID_UI_COLORS = new Set<string>(UI_COLORS)

export const UI_COLOR_LABELS: Record<UiColor, string> = {
	red: 'Red',
	rose: 'Rose',
	pink: 'Pink',
	fuchsia: 'Fuchsia',
	purple: 'Purple',
	violet: 'Violet',
	indigo: 'Indigo',
	blue: 'Blue',
	sky: 'Sky',
	cyan: 'Cyan',
	teal: 'Teal',
	emerald: 'Emerald',
	green: 'Green',
	lime: 'Lime',
	yellow: 'Yellow',
	amber: 'Amber',
	orange: 'Orange',
	slate: 'Slate',
}

export const COLOR_SWATCH: Record<UiColor, { bg: string; ring: string }> = {
	red:     { bg: 'bg-red-500',     ring: 'ring-red-500' },
	rose:    { bg: 'bg-rose-500',    ring: 'ring-rose-500' },
	pink:    { bg: 'bg-pink-500',    ring: 'ring-pink-500' },
	fuchsia: { bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-500' },
	purple:  { bg: 'bg-purple-500',  ring: 'ring-purple-500' },
	violet:  { bg: 'bg-violet-500',  ring: 'ring-violet-500' },
	indigo:  { bg: 'bg-indigo-500',  ring: 'ring-indigo-500' },
	blue:    { bg: 'bg-blue-500',    ring: 'ring-blue-500' },
	sky:     { bg: 'bg-sky-500',     ring: 'ring-sky-500' },
	cyan:    { bg: 'bg-cyan-500',    ring: 'ring-cyan-500' },
	teal:    { bg: 'bg-teal-500',    ring: 'ring-teal-500' },
	emerald: { bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
	green:   { bg: 'bg-green-500',   ring: 'ring-green-500' },
	lime:    { bg: 'bg-lime-500',    ring: 'ring-lime-500' },
	yellow:  { bg: 'bg-yellow-500',  ring: 'ring-yellow-500' },
	amber:   { bg: 'bg-amber-500',   ring: 'ring-amber-500' },
	orange:  { bg: 'bg-orange-500',  ring: 'ring-orange-500' },
	slate:   { bg: 'bg-slate-500',   ring: 'ring-slate-500' },
}

export const COLOR_CLASSES: Record<UiColor, { btn: string; hover: string; avatar: string; chevron: string; text: string }> = {
	red:     { btn: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',         hover: 'hover:bg-red-200 dark:hover:bg-red-800',         avatar: 'bg-red-700/20 dark:bg-red-300/20',         chevron: 'text-red-400',     text: 'text-red-700 dark:text-red-300' },
	rose:    { btn: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300',      hover: 'hover:bg-rose-200 dark:hover:bg-rose-800',      avatar: 'bg-rose-700/20 dark:bg-rose-300/20',      chevron: 'text-rose-400',    text: 'text-rose-700 dark:text-rose-300' },
	pink:    { btn: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',      hover: 'hover:bg-pink-200 dark:hover:bg-pink-800',      avatar: 'bg-pink-700/20 dark:bg-pink-300/20',      chevron: 'text-pink-400',    text: 'text-pink-700 dark:text-pink-300' },
	fuchsia: { btn: 'bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-300', hover: 'hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800', avatar: 'bg-fuchsia-700/20 dark:bg-fuchsia-300/20', chevron: 'text-fuchsia-400', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
	purple:  { btn: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',  hover: 'hover:bg-purple-200 dark:hover:bg-purple-800',  avatar: 'bg-purple-700/20 dark:bg-purple-300/20',  chevron: 'text-purple-400',  text: 'text-purple-700 dark:text-purple-300' },
	violet:  { btn: 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300',  hover: 'hover:bg-violet-200 dark:hover:bg-violet-800',  avatar: 'bg-violet-700/20 dark:bg-violet-300/20',  chevron: 'text-violet-400',  text: 'text-violet-700 dark:text-violet-300' },
	indigo:  { btn: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',  hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800',  avatar: 'bg-indigo-700/20 dark:bg-indigo-300/20',  chevron: 'text-indigo-400',  text: 'text-indigo-700 dark:text-indigo-300' },
	blue:    { btn: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',      hover: 'hover:bg-blue-200 dark:hover:bg-blue-800',      avatar: 'bg-blue-700/20 dark:bg-blue-300/20',      chevron: 'text-blue-400',    text: 'text-blue-700 dark:text-blue-300' },
	sky:     { btn: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300',         hover: 'hover:bg-sky-200 dark:hover:bg-sky-800',         avatar: 'bg-sky-700/20 dark:bg-sky-300/20',         chevron: 'text-sky-400',     text: 'text-sky-700 dark:text-sky-300' },
	cyan:    { btn: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',      hover: 'hover:bg-cyan-200 dark:hover:bg-cyan-800',      avatar: 'bg-cyan-700/20 dark:bg-cyan-300/20',      chevron: 'text-cyan-400',    text: 'text-cyan-700 dark:text-cyan-300' },
	teal:    { btn: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',      hover: 'hover:bg-teal-200 dark:hover:bg-teal-800',      avatar: 'bg-teal-700/20 dark:bg-teal-300/20',      chevron: 'text-teal-400',    text: 'text-teal-700 dark:text-teal-300' },
	emerald: { btn: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-800', avatar: 'bg-emerald-700/20 dark:bg-emerald-300/20', chevron: 'text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
	green:   { btn: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',    hover: 'hover:bg-green-200 dark:hover:bg-green-800',    avatar: 'bg-green-700/20 dark:bg-green-300/20',    chevron: 'text-green-400',   text: 'text-green-700 dark:text-green-300' },
	lime:    { btn: 'bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300',      hover: 'hover:bg-lime-200 dark:hover:bg-lime-800',      avatar: 'bg-lime-700/20 dark:bg-lime-300/20',      chevron: 'text-lime-400',    text: 'text-lime-700 dark:text-lime-300' },
	yellow:  { btn: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',  hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',  avatar: 'bg-yellow-700/20 dark:bg-yellow-300/20',  chevron: 'text-yellow-400',  text: 'text-yellow-700 dark:text-yellow-300' },
	amber:   { btn: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',    hover: 'hover:bg-amber-200 dark:hover:bg-amber-800',    avatar: 'bg-amber-700/20 dark:bg-amber-300/20',    chevron: 'text-amber-400',   text: 'text-amber-700 dark:text-amber-300' },
	orange:  { btn: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',  hover: 'hover:bg-orange-200 dark:hover:bg-orange-800',  avatar: 'bg-orange-700/20 dark:bg-orange-300/20',  chevron: 'text-orange-400',  text: 'text-orange-700 dark:text-orange-300' },
	slate:   { btn: 'bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300',    hover: 'hover:bg-slate-300 dark:hover:bg-slate-800',    avatar: 'bg-slate-700/20 dark:bg-slate-300/20',    chevron: 'text-slate-400',   text: 'text-slate-700 dark:text-slate-300' },
}

export function getWebsiteColor(name: string): UiColor {
	const code = name.charAt(0).toUpperCase().charCodeAt(0) - 65
	return UI_COLORS[((code % UI_COLORS.length) + UI_COLORS.length) % UI_COLORS.length]
}
