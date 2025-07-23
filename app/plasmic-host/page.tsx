import "@/plasmic-init-client";
import { PlasmicCanvasHost } from "@plasmicapp/loader-nextjs";
import { SessionProvider } from "next-auth/react";

export default function PlasmicHost() {
    return (
        <SessionProvider>
            <PlasmicCanvasHost />
        </SessionProvider>
    );
}