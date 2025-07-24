// app/layout.tsx
import Providers from "./providers";

export const metadata = {
  title: "Plasmic + Prisma Blog",
  description: "A blog app using Next.js, Plasmic and Prisma",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}
