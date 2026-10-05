import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Chillado Indoor Sports Complex | Book Indoor Cricket",description:"24-hour indoor cricket bookings in Kottawa. Two-hour slots, Rs. 3,500 per hour."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="/style.css"/></head><body>{children}</body></html>;}