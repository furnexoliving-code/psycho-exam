/**
 * Keeps a page off paper. The browser's print (and "Save as PDF") shows a
 * line instead of the page: the questions of a paper stay in the portal,
 * and a result leaves only as the picture its own button draws.
 */
export function NoPrint({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="print-blocked contents">{children}</div>
      <p className="print-blocked-note hidden">
        This page is not for printing. Use the Download button on the result to save it as a picture.
      </p>
    </>
  );
}
