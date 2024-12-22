import { Inter } from "next/font/google";
//import "./globals.css";
import { SideNav } from "./side-nav";
const inter = Inter({ subsets: ["latin"] });

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="container mx-auto pt-12">
      <div className="flex gap-8">
      <SideNav/>
      <div className="w-full">{children}</div> 
      </div>    
    </main>
  );
}
