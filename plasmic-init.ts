import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";
import * as NextNavigation from "next/navigation";
import { Prisma } from '@prisma/client';
import { PrismaQueryOperationType } from "@/lib/prisma";
import { prismaQuery } from '@/functions/prismaQuery';

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


PLASMIC.registerFunction(prismaQuery, {
    name: 'prismaQuery',
    params: [
        {
            name: 'table',
            type: 'choice',
            options: Object.values(Prisma.ModelName).map((name) => ({
                value: name,
                label: name,
            })),
            description: 'Select the Prisma model to query',
        },
        {
            name: 'operation',
            type: 'choice',
            options: Object.values(PrismaQueryOperationType).map((op) => ({
                value: op,
                label: op,
            })),
            description: 'Select the Prisma operation to perform',
        },
        {
            name: 'args',
            type: 'code',
            description: 'The Prisma query arguments',
            // This is a placeholder; you can define the structure of the query object as needed
        }, 
    ],
})