import "./globals.css";

export const metadata = {
  title: "Second Draft | What if failure wasn't the end?",
  description: "Second Draft turns abandoned inventions into starting points."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}