import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "folio · Asset Allocation",
  description: "Acompanhamento da alocação da carteira.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${lora.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f7f5ef] font-sans text-[#292c27]">
        {children}
      </body>
    </html>
  );
}
