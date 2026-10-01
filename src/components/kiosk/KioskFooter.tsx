'use client';

export function KioskFooter() {
  return (
    <footer className="mt-auto border-t bg-background px-4 py-3 md:px-8">
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-foreground">
          Biogram MINI 교육 키오스크
        </p>
        <p className="text-xs text-muted-foreground">
          실제 측정은 현장 장비에서 진행됩니다
        </p>
      </div>
    </footer>
  );
}
