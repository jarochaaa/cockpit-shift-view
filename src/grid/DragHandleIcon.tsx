export function DragHandleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
      {[3, 7, 11].map((cy) =>
        [4, 10].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.2" fill="currentColor" />),
      )}
    </svg>
  );
}
