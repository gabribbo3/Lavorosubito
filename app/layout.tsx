import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {title:"LavoroSubito — V1",description:"Marketplace per interventi urgenti."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>}