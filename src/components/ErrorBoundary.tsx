import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('[FamPlay]', error); }
  render() {
    if (this.state.failed) return (
      <main className="min-h-dvh bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl">Die Ansicht konnte nicht geladen werden.</h1>
        <p>Bitte lade die App erneut. Ein laufendes Online-Spiel kann dabei unterbrochen werden.</p>
        <button className="rounded-xl bg-amber-500 text-slate-950 px-6 py-3 font-bold" onClick={() => location.reload()}>Erneut laden</button>
      </main>
    );
    return this.props.children;
  }
}
