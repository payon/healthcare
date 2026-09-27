'use client';

import { Component, type ReactNode } from 'react';
import { useKioskStore } from '@/store/kiosk-store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Kiosk render safety net. Without this, any throw inside the newly-mounted
 * screen tree unmounts the whole UI (blank screen) while already-queued
 * speechSynthesis keeps speaking — exactly "voice but no screen".
 * The fallback stays visible and offers one-tap recovery to standby.
 */
export class KioskErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Kiosk render error:', error);
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: useKioskStore.getState().sessionId || 'standby',
          eventType: 'error',
          screen: useKioskStore.getState().currentScreen,
          detail: error instanceof Error ? error.message.slice(0, 500) : 'render error',
        }),
      }).catch(() => {});
    } catch {
      // never throw from the error path
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    useKioskStore.getState().resetToStandby();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
          <p className="text-2xl font-bold">화면을 불러오지 못했습니다</p>
          <p className="text-muted-foreground">버튼을 눌러 처음 화면으로 돌아가세요</p>
          <button
            onClick={this.handleReset}
            className="rounded-2xl bg-primary px-12 py-4 text-xl font-bold text-primary-foreground"
          >
            처음 화면으로
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
