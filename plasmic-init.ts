import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";
import * as NextNavigation from "next/navigation";

export const PLASMIC = initPlasmicLoader({
  nextNavigation: NextNavigation,
  projects: [
    {
      id: "xpjuD2VqBCGPggNh2kWhnV",  // ID of a project you are using
      token: "KoTB6pMixrtcshRIbTxm4O1eJlvcXdMpTysufELoDziDkJ7yLz6pGCYcUtADcmsNCpZAWVKr9w78UNw9Yp4Q"  // API token for that project
    }
  ],
  // Fetches the latest revisions, whether or not they were unpublished!
  // Disable for production to ensure you render only published changes.
  preview: true,
})
