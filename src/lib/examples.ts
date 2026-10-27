// Snippets from the H9/H10 exams in Scratch_Klausur_Werkstatt (German syntax)
// plus one English-syntax example to show both keyword sets are accepted.
export const examples: { id: string; title: { de: string; en: string }; code: string }[] = [
	{
		id: 'mouse',
		title: { de: 'Maus & Käse – Punkte zählen', en: 'Mouse & cheese – count points' },
		code: `Wenn @greenFlag angeklickt wird
setze [Punkte v] auf (0)
wiederhole (8) mal
   gehe (25) er Schritt
   falls <wird [Käse v] berührt?>, dann
      ändere [Punkte v] um (1)
   end
end`
	},
	{
		id: 'start',
		title: { de: 'Startposition & Begrüßung', en: 'Start position & greeting' },
		code: `Wenn @greenFlag angeklickt wird
gehe zu x: (-180) y: (0)
setze Richtung auf (90 v) Grad
gehe (60) er Schritt
sage [Hallo!] für (3) Sekunden`
	},
	{
		id: 'pin',
		title: { de: 'PIN-Sperre (H10)', en: 'PIN lock (H10)' },
		code: `Wenn @greenFlag angeklickt wird
wechsle zu Bühnenbild [sperre v]
setze [Code v] auf (1985)
wiederhole fortlaufend
   frage [Bitte Code eingeben] und warte
   falls <(Antwort) = (Code)>, dann
      wechsle zu Bühnenbild [start v]
      stoppe [dieses Skript v]
   sonst
      wechsle zu Bühnenbild [falsch v]
      warte (1) Sekunden
      wechsle zu Bühnenbild [sperre v]
   end
end`
	},
	{
		id: 'gaps',
		title: { de: 'Lückentext ①②③', en: 'Fill the gaps ①②③' },
		code: `Wenn @greenFlag angeklickt wird
setze [Punkte v] auf (   ①   )
wiederhole fortlaufend
   gehe (15) er Schritt
   falls <wird [Käse v] berührt?>, dann
      ändere [Punkte v] um (   ②   )
   end
   falls <wird [   ③    v] berührt?>, dann
      drehe dich @turnRight um (180) Grad
   end
end`
	},
	{
		id: 'square',
		title: { de: 'Quadrat (englische Syntax)', en: 'Square (English syntax)' },
		code: `when flag clicked
pen down
repeat (4)
   move (100) steps
   turn right (90) degrees
end
pen up
say [Done!] for (2) seconds`
	}
];
