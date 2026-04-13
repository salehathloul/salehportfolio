import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://saleh-portfolio.vercel.app"
  ),
  robots: { index: true, follow: true },
};

// Anti-FOUC: runs before first paint to set theme class and locale attributes
const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('theme');
    var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
    if(t?t==='dark':d) document.documentElement.classList.add('dark');
    var p=location.pathname.split('/')[1];
    if(p==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';}
    else{document.documentElement.lang='ar';document.documentElement.dir='rtl';}
  }catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
