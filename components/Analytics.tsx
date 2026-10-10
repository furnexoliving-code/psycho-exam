import Script from "next/script";

/**
 * Google Analytics 4, on when NEXT_PUBLIC_GA_ID is set in Vercel (a
 * "G-XXXXXXXX" id). Nothing is loaded without it. Search Console reports
 * the keywords; this reports what visitors do once they arrive.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
