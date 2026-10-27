import type { Lang } from './scratch.ts';

const strings = {
	de: {
		tagline: 'Text rein, Scratch-Blöcke raus.',
		tabEditor: 'Editor',
		tabWord: 'Word-Workflow',
		source: 'Quelltext',
		preview: 'Vorschau',
		examples: 'Beispiele',
		copySvg: 'SVG kopieren',
		copied: 'Kopiert',
		dlSvg: 'SVG',
		dlPng: 'PNG',
		syntax: 'Syntax-Hilfe',
		syntaxBody:
			'Ein Block pro Zeile. (Zahl) ist ein runder Slot, [Text] ein eckiger, [Name v] ein Dropdown, <…> eine Bedingung. C-Blöcke mit „end“ schließen. Deutsche und englische Schlüsselwörter funktionieren beide.',
		syntaxLink: 'Vollständige Referenz im Scratch-Wiki',
		empty: 'Schreib links ein Skript. Die Blöcke erscheinen hier.',
		unknown: 'Nicht erkannt (grau):',
		blockLang: 'Blocksprache',
		step1: 'Dokument',
		step2: 'Blöcke prüfen',
		step3: 'Exportieren',
		drop: '.docx hierher ziehen',
		dropOr: 'oder Datei auswählen',
		dropHint: 'Codeblöcke stehen in einzelligen Tabellen zwischen [[SB:id]] und [[/SB]].',
		demoDoc: 'Demo-Klausur laden',
		found: (n: number) => `${n} Codeblock${n === 1 ? '' : 'e'} gefunden`,
		none: 'Keine [[SB:…]]-Platzhalter in diesem Dokument.',
		edit: 'Code bearbeiten',
		done: 'Fertig',
		build: '.docx erzeugen',
		building: 'Wird erzeugt …',
		allPng: 'Alle PNGs (.zip)',
		another: 'Anderes Dokument',
		exportNote: 'Jede Tabelle wird durch ein PNG mit 288 dpi ersetzt. Der Rest des Dokuments bleibt unverändert.',
		error: 'Fehler beim Lesen:',
		exportError: 'Export fehlgeschlagen:',
		footer: 'Läuft komplett im Browser. Keine Datei verlässt deinen Rechner.'
	},
	en: {
		tagline: 'Text in, Scratch blocks out.',
		tabEditor: 'Editor',
		tabWord: 'Word workflow',
		source: 'Source',
		preview: 'Preview',
		examples: 'Examples',
		copySvg: 'Copy SVG',
		copied: 'Copied',
		dlSvg: 'SVG',
		dlPng: 'PNG',
		syntax: 'Syntax help',
		syntaxBody:
			'One block per line. (number) is a round slot, [text] a square one, [name v] a dropdown, <…> a condition. Close C-blocks with "end". German and English keywords both work.',
		syntaxLink: 'Full reference on the Scratch Wiki',
		empty: 'Write a script on the left. The blocks show up here.',
		unknown: 'Not recognised (grey):',
		blockLang: 'Block language',
		step1: 'Document',
		step2: 'Review blocks',
		step3: 'Export',
		drop: 'Drop a .docx here',
		dropOr: 'or choose a file',
		dropHint: 'Code blocks live in one-cell tables between [[SB:id]] and [[/SB]].',
		demoDoc: 'Load demo exam',
		found: (n: number) => `${n} code block${n === 1 ? '' : 's'} found`,
		none: 'No [[SB:…]] placeholders in this document.',
		edit: 'Edit code',
		done: 'Done',
		build: 'Generate .docx',
		building: 'Generating …',
		allPng: 'All PNGs (.zip)',
		another: 'Another document',
		exportNote: 'Each table is replaced by a 288 dpi PNG. The rest of the document stays as it was.',
		error: 'Could not read file:',
		exportError: 'Export failed:',
		footer: 'Runs entirely in your browser. No file leaves your machine.'
	}
};

function initial(): Lang {
	try {
		const v = localStorage.getItem('t2s-lang');
		if (v === 'de' || v === 'en') return v;
	} catch {}
	return navigator.language?.startsWith('de') ? 'de' : 'en';
}

class I18n {
	lang = $state<Lang>(initial());
	t = $derived(strings[this.lang]);

	set(lang: Lang) {
		this.lang = lang;
		document.documentElement.lang = lang;
		try {
			localStorage.setItem('t2s-lang', lang);
		} catch {}
	}
}

export const i18n = new I18n();
