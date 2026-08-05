"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { deterministicScore } from "./deterministic-score";

const messages = [
  "CALIBRAGE DES PAPILLONS ABDOMINAUX…",
  "COMPARAISON DES PLAYLISTS HONTEUSES…",
  "MESURE DU POTENTIEL DE DANSE DE CUISINE…",
  "ANALYSE DES REGARDS EN COIN…",
  "CONSULTATION DE VÉNUS EN 56K…",
  "VÉRIFICATION DU PARTAGE DE COUETTE…",
  "SYNCHRONISATION DES BATTEMENTS DE CILS…",
  "INTERROGATION DU GRAND ORACLE DU CANAPÉ…",
  "DÉTECTION DES PETITS NOMS RIDICULES…",
  "TRIANGULATION DES CHAUSSETTES ORPHELINES…",
  "CALCUL DU COEFFICIENT DE RACLETTE À DEUX…",
  "AUDIT DES MESSAGES ENVOYÉS À 2H DU MATIN…",
  "SIMULATION D'UN DIMANCHE CHEZ IKEA…",
  "ANALYSE DU POTENTIEL DE DUO AU KARAOKÉ…",
  "MESURE DU TAUX DE VOL DE FRITES…",
  "LECTURE DES AURAS SUR DISQUETTE…",
  "CONVERSION DES SOUPIRS EN MÉGA-CŒURS…",
  "TEST DU REGARD 'ON RENTRE ?' EN SOIRÉE…",
  "ÉVALUATION DE LA TOLÉRANCE AUX RONFLEMENTS…",
  "ALIGNEMENT DES PLANÈTES ET DES AGENDAS…",
  "SCANNAGE DU POTENTIEL DE SLOW LANGOURISSANT…",
  "VÉRIFICATION DU PROTOCOLE BISOU SUR LE FRONT…",
  "COMPILATION DES BLAGUES QUE VOUS SEULS COMPRENEZ…",
  "CONTACT DU MINISTÈRE DES COUPS DE FOUDRE…",
];

const resultMessages = [
  "LE MYSTÈRE RESTE ENTIER",
  "QUELQUES ÉTINCELLES À ENCOURAGER",
  "LE COURANT PASSE, RESTE À BRANCHER",
  "HAUTE TENSION ROMANTIQUE",
  "DESTINÉ·ES À BRILLER",
];

function Portrait({ src, side, label }: { src: string; side: "blue" | "pink"; label: string }) {
  return (
    <div className={`portrait portrait--${side}`}>
      <div className="portrait__frame">
        {src ? <img src={src} alt={label} /> : <span aria-hidden>{side === "blue" ? "♂" : "♀"}</span>}
        <i className="scan" />
      </div>
      <small>{side === "blue" ? "SUJET A" : "SUJET B"}</small>
    </div>
  );
}

export default function Home() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [leftBytes, setLeftBytes] = useState<ArrayBuffer | null>(null);
  const [rightBytes, setRightBytes] = useState<ArrayBuffer | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [promptOrder, setPromptOrder] = useState(messages.slice(0, 6));
  const audio = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const raf = useRef(0);

  const loadImage = (setUrl: (url: string) => void, setBytes: (bytes: ArrayBuffer) => void) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      cancelAnimationFrame(raf.current);
      master.current?.disconnect();
      master.current = null;
      setRunning(false);
      setElapsed(0);
      setScore(null);
      setUrl(URL.createObjectURL(file));
      setBytes(await file.arrayBuffer());
    }
  };

  const playWeddingMarch = () => {
    const ctx = audio.current || new AudioContext();
    audio.current = ctx;
    if (master.current) master.current.disconnect();
    const bus = ctx.createGain();
    bus.gain.value = .72;
    bus.gain.setValueAtTime(.72, ctx.currentTime);
    bus.gain.setValueAtTime(0, ctx.currentTime + 20);
    bus.connect(ctx.destination); master.current = bus;
    const melody = [
      [349,.45],[466,.7],[466,.25],[466,.7],[349,.45],[523,.7],[440,.25],[466,.9],
      [349,.45],[466,.7],[587,.25],[523,.7],[466,.45],[440,.7],[392,.25],[349,.9],
    ];
    let cursor = ctx.currentTime + .08;
    for (let loop = 0; loop < 3; loop++) {
      melody.forEach(([frequency, duration], index) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = index % 4 === 0 ? "square" : "triangle"; osc.frequency.value = frequency;
        gain.gain.setValueAtTime(.045, cursor); gain.gain.exponentialRampToValueAtTime(.002, cursor + duration * .86);
        osc.connect(gain).connect(bus); osc.start(cursor); osc.stop(cursor + duration);
        if (index % 2 === 0) {
          const bass = ctx.createOscillator(); const bassGain = ctx.createGain();
          bass.type = "square"; bass.frequency.value = frequency / 4;
          bassGain.gain.setValueAtTime(.018, cursor); bassGain.gain.exponentialRampToValueAtTime(.001, cursor + duration * .8);
          bass.connect(bassGain).connect(bus); bass.start(cursor); bass.stop(cursor + duration);
        }
        cursor += duration;
      });
    }
  };

  const start = async () => {
    if (!leftBytes || !rightBytes) return;
    setScore(await deterministicScore(leftBytes, rightBytes));
    setPromptOrder([...messages].sort(() => Math.random() - .5).slice(0, 6));
    setElapsed(0); setRunning(true); playWeddingMarch();
    const began = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      const next = Math.min(20, (now - began) / 1000);
      setElapsed(next);
      if (next < 20) raf.current = requestAnimationFrame(tick); else setRunning(false);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!leftBytes || !rightBytes) {
      setScore(null);
      return;
    }
    deterministicScore(leftBytes, rightBytes).then(setScore);
  }, [leftBytes, rightBytes]);

  const phase = elapsed < 2.6 ? "intro" : elapsed < 5.5 ? "portraits" : elapsed < 16.4 ? "calcul" : elapsed < 18 ? "reveal" : "result";
  const progress = phase === "calcul" ? Math.min(100, Math.max(0, ((elapsed - 5.5) / 10.9) * 100)) : elapsed >= 16.4 ? 100 : 0;
  const msg = promptOrder[Math.min(promptOrder.length - 1, Math.floor(progress / (100 / promptOrder.length)))];

  return (
    <main>
      <aside className="control-panel" aria-label="Réglages">
        <div className="brand"><span>♥</span> LOVE-O-MATIC <b>’86</b></div>
        <div className="inputs">
          <label className="upload">PORTRAIT A<input type="file" accept="image/*" onChange={loadImage(setLeft, setLeftBytes)} /><span>{left ? "IMAGE CHARGÉE ✓" : "+ CHOISIR"}</span></label>
          <label className="upload">PORTRAIT B<input type="file" accept="image/*" onChange={loadImage(setRight, setRightBytes)} /><span>{right ? "IMAGE CHARGÉE ✓" : "+ CHOISIR"}</span></label>
          <button className="launch" onClick={start} disabled={!leftBytes || !rightBytes}>{running ? "↻ REJOUER" : elapsed ? "↻ REJOUER" : "▶ LANCER LE MATCH"}</button>
        </div>
        <p>Astuce vidéo : passez en plein écran, lancez l’enregistrement, puis cliquez sur « Lancer ».</p>
      </aside>

      <section className={`stage phase-${phase} ${running ? "is-running" : "is-paused"}`} aria-live="polite">
        <div className="grid" /><div className="vignette" /><div className="scanlines" />
        <div className="hearts" aria-hidden>{Array.from({length: 18}, (_, i) => <i key={i}>♥</i>)}</div>
        {!running && elapsed === 0 && <div className="standby"><em>♥</em><h1>LOVE<br/><span>CALCULATOR</span></h1><p>COMPATIBILITY SYSTEM</p><b>PRÊT À SCANNER L’AMOUR</b></div>}
        {(running || elapsed > 0) && <>
          <div className="intro-card"><em>♥</em><h2>LOVE-O-MATIC</h2><p>INITIALISATION DU PROTOCOLE ROMANTIQUE</p></div>
          <div className="couple">
            <Portrait src={left} side="blue" label="Portrait du candidat A" />
            <div className="connector"><span>+</span><i>♥</i></div>
            <Portrait src={right} side="pink" label="Portrait du candidat B" />
          </div>
          <div className="calculation">
            <header><span>ANALYSE SENTIMENTALE</span><b>{Math.round(progress)}%</b></header>
            <div className="progress"><div style={{transform: `scaleX(${progress / 100})`}}><i>♥</i></div></div>
            <p>{msg}</p>
          </div>
          <div className="reveal"><span>ALERTE !</span><h2>COMPATIBILITÉ<br/>DÉTECTÉE</h2><i>♥</i></div>
          <div className="finale">
            <Portrait src={left} side="blue" label="Portrait du candidat A" />
            <div className="final-score"><small>CALCUL EFFECTUÉ</small><strong>{score ?? 0}<sup>%</sup></strong><div>{resultMessages[Math.min(4, Math.floor((score ?? 0) / 20))]}</div></div>
            <Portrait src={right} side="pink" label="Portrait du candidat B" />
          </div>
        </>}
        <div className="timer">20 SEC LOVE EXPERIENCE <span>{elapsed.toFixed(1)}s</span></div>
      </section>
    </main>
  );
}
